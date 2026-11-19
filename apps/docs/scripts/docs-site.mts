import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import MarkdownIt from 'markdown-it';
import { parseJson } from '../../../harness/lib/files.mjs';
import type { BrandConfig } from '../../../generated/types/brand-config.js';
import type { ComponentRegistry } from '../../../generated/types/registry.js';

interface Topic { slug: string; title: string; order: number; description: string }
interface Meta { title?: string; description?: string; order?: string | number; layout?: string; [key: string]: string | number | undefined }
interface TocEntry { level: number; id: string; text: string }
interface Source { meta: Meta; dir: string; url: string; body: string }
interface Page {
  url: string;
  dir: string;
  layout: string;
  order: number;
  title: string;
  tab: string;
  description: string;
  markdown: string;
  html: string;
  toc: TocEntry[];
  text: string;
}
interface Stats {
  components: number;
  byStatus: Record<string, number>;
  kits: number;
  starters: number;
  families: number;
  icons: number;
  checks: number;
  parityAudits: number;
  a11yAudits: number;
}

const OUT = 'site-dist';
const TABS = [
  { id: 'docs', title: 'Docs', url: '/' },
  { id: 'demo', title: 'Demo', url: '/demo/' }
];
const SECTIONS = [
  { dir: '', title: '', tab: 'docs' },
  { dir: 'start', title: 'Start', tab: 'docs' },
  { dir: 'concepts', title: 'Concepts', tab: 'docs' },
  { dir: 'guides', title: 'Guides', tab: 'docs' },
  { dir: 'cli', title: 'CLI', tab: 'docs' },
  { dir: 'reference', title: 'Reference', tab: 'docs' },
  { dir: 'playground', title: 'Playground', tab: 'demo' },
  { dir: 'demo', title: 'Components', tab: 'demo' }
];
const CLI_TOPICS: Record<string, Topic> = {
  Project: {
    slug: 'project',
    title: 'Project setup',
    order: 10,
    description: 'Create, inspect, repair and upgrade a Sketchbook project.'
  },
  Tokens: {
    slug: 'foundations',
    title: 'Tokens and brand',
    order: 20,
    description: 'Change foundations, presets and brands, and import or audit existing styles.'
  },
  Components: {
    slug: 'components',
    title: 'Components and kits',
    order: 30,
    description: 'Install, remove and list components and kits, and read the naming standard.'
  },
  'Design file': {
    slug: 'design-file',
    title: 'Design file',
    order: 40,
    description: 'Sync variables, styles and docs to the design file, and manage icons.'
  },
  Quality: {
    slug: 'quality',
    title: 'Quality and checks',
    order: 50,
    description: 'Run the deterministic checks, self-test the harness and trace where a value comes from.'
  }
};
const CALLOUTS = new Set(['note', 'tip', 'warning']);

const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

function parse(raw: string): { meta: Meta; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Meta = {};
  if (match) {
    for (const line of (match[1] ?? '').split('\n')) {
      const [key = '', ...rest] = line.split(':');
      meta[key.trim()] = rest.join(':').trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
    }
  }
  return { meta, body: match ? raw.slice(match[0].length) : raw };
}

const md = new MarkdownIt({ html: true });
md.core.ruler.push('toc', (state) => {
  const used = new Set<string>();
  const toc: TocEntry[] = [];
  state.env.toc = toc;
  state.tokens.forEach((token, i) => {
    if (token.type !== 'heading_open') return;
    const level = Number(token.tag.slice(1));
    const text = (state.tokens[i + 1]?.children ?? [])
      .filter((t) => t.type === 'text' || t.type === 'code_inline')
      .map((t) => t.content)
      .join('');
    let id = slug(text) || 'section';
    for (let n = 2; used.has(id); n++) id = `${slug(text)}-${n}`;
    used.add(id);
    token.attrSet('id', id);
    if (level >= 2 && level <= 3) toc.push({ level, id, text });
  });
});
md.core.ruler.push('callout', (state) => {
  const { tokens } = state;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token?.type !== 'blockquote_open') continue;
    const inline = tokens[i + 2];
    const children = inline?.children ?? [];
    const open = children.findIndex((t) => t.type === 'strong_open');
    const label = children[open + 1];
    const kind = label?.content.toLowerCase();
    const close = children.findIndex((t) => t.type === 'strong_close');
    const before = children.slice(0, open).every((t) => t.type === 'text' && !t.content);
    if (!inline || !label || kind === undefined || open < 0 || !before || close !== open + 2 || !CALLOUTS.has(kind)) continue;

    inline.children = children.slice(close + 1);
    const first = inline.children[0];
    if (first?.type === 'text') first.content = first.content.trimStart();
    token.attrJoin('class', `callout callout-${kind}`);
    const title = new state.Token('html_block', '', 0);
    title.content = `<p class="callout-title">${esc(label.content)}</p>\n`;
    tokens.splice(i + 1, 0, title);
  }
});
md.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0">\n<table>\n';
md.renderer.rules.table_close = () => '</table>\n</div>\n';
const { fence, code_block: codeBlock } = md.renderer.rules;
if (!fence || !codeBlock) throw new Error('markdown-it has no default fence or code_block renderer to wrap');
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const terminal = tokens[idx]?.info.trim() === 'terminal';
  const pre = fence(tokens, idx, options, env, self).replace('<pre', '<pre tabindex="0"');
  return `<div class="code${terminal ? ' terminal' : ''}">${pre}</div>\n`;
};
md.renderer.rules.code_inline = (tokens, idx) => {
  const content = tokens[idx]?.content ?? '';
  return `<code${/^--?[a-z][\w-]*$/.test(content) ? ' class="flag"' : ''}>${esc(content)}</code>`;
};
md.renderer.rules.text = (tokens, idx) =>
  esc(tokens[idx]?.content ?? '').replace(/(^|[\s(])(--?[a-z][\w-]*)/g, '$1<span class="flag">$2</span>');
md.renderer.rules.code_block = (...args) => codeBlock(...args).replace('<pre', '<pre tabindex="0"');

async function mdFiles(dir: string, prefix = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const rel = join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await mdFiles(join(dir, entry.name), rel)));
    else if (entry.name.endsWith('.md')) files.push(rel.split('\\').join('/'));
  }
  return files;
}

function summarize(markdown: string) {
  const para = markdown.split(/\n\n/).find((p) => p.trim() && !p.startsWith('#') && !p.startsWith('```'));
  const text = (para ?? '').replace(/\s+/g, ' ').trim();
  const cut = text.lastIndexOf(' ', 147);
  return text.length > 150 ? `${text.slice(0, cut > 0 ? cut : 147)}…` : text;
}

function cliSource(raw: string) {
  const chunks: string[][] = [];
  let inFence = false;
  for (const line of raw.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && line.startsWith('## ')) chunks.push([line.slice(3).trim()]);
    else chunks.at(-1)?.push(line);
  }
  const groups: Record<string, string> = Object.fromEntries(chunks.map(([title = '', ...body]) => [title, body.join('\n').trim()]));
  const unmapped = Object.entries(groups).filter(([group, body]) => !(group in CLI_TOPICS) && group !== 'Help' && body.includes('\n### ')).map(([group]) => group);
  if (unmapped.length) throw new Error(`docs/cli.md groups with no CLI_TOPICS entry: ${unmapped.join(', ')}`);
  const synopsis = (line: string) => (line.length > 100 && line.includes(' [') ? line.replace(/ (?=\[)/g, '\n  ') : line);
  const shift = (body: string) =>
    body
      .replace(/^###(#?) /gm, '##$1 ')
      .replace(/^sketchbook [a-z-]+ .+$/gm, synopsis)
      .replace(/^Examples:$/gm, '**Examples**');
  const pages = Object.entries(CLI_TOPICS).map(([group, topic]) => ({
    ...topic,
    url: `/cli/${topic.slug}/`,
    body: shift(groups[group] ?? '')
  }));
  const commands = pages.map((page) => ({
    topic: page,
    rows: [...page.body.matchAll(/^## (.+)\n\n([\s\S]*?)(?=\n## |$)/gm)].map(([, name = '', rest = '']): [string, string] => [name.trim(), summarize(rest)])
  }));
  const table = commands
    .map(
      ({ topic, rows }) =>
        `## ${topic.title}\n\n${topic.description}\n\n| Command | What it does |\n| --- | --- |\n${rows
          .map(([name, text]) => `| [\`${name}\`](${topic.url}#${slug(name)}) | ${text.replace(/\|/g, '\\|')} |`)
          .join('\n')}`
    )
    .join('\n\n');
  const conventions = `## Conventions\n\n${groups.Conventions}\n\n## Getting help\n\n${groups.Help}`;
  return { pages, table, conventions };
}

async function stats(): Promise<Stats> {
  const json = async <T,>(f: string) => parseJson<T>(await readFile(f, 'utf8'));
  const count = async (dir: string, ext: string) => (await readdir(dir).catch((): string[] => [])).filter((f) => f.endsWith(ext)).length;
  const registry = await json<ComponentRegistry>('spec/registry.json');
  const byStatus: Record<string, number> = {};
  for (const c of registry.components) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  const { families } = await import('../../../harness/standards/resolve.mjs');
  const { CHECKS } = await import('../../../harness/checks/run.mjs');
  return {
    components: registry.components.length,
    byStatus,
    kits: (await json<{ kits: unknown[] }>('harness/kits/index.json')).kits.length,
    starters: await count('harness/starters', '.json'),
    families: families().length,
    icons: Object.keys((await json<{ icons: Record<string, unknown> }>('spec/icons.json')).icons).length,
    checks: CHECKS.length,
    parityAudits: await count('docs/parity-audits', '.md'),
    a11yAudits: await count('docs/a11y-audits', '.md')
  };
}

function statusTable(n: Stats) {
  const stable = n.byStatus.stable ?? 0;
  const rows = [
    ['Components', `${n.components} (${Object.entries(n.byStatus).map(([k, v]) => `${v} ${k}`).join(', ')})`, '`spec/registry.json`'],
    ['Accessibility audits completed', String(n.a11yAudits), '`docs/a11y-audits/` (needed for `stable`)'],
    ['Component parity audits', String(n.parityAudits), '`docs/parity-audits/`'],
    ['Template kits', String(n.kits), '`harness/kits/index.json`'],
    ['Starters', String(n.starters), '`harness/starters/`'],
    ['Foundation families', String(n.families), '`harness/standards/`'],
    ['Icons', String(n.icons), '`spec/icons.json`'],
    ['Checks', String(n.checks), '`harness/checks/run.mjs`']
  ];
  const note = stable === 0 ? '\n\n> **Note** No component is `stable` yet. `stable` needs an accessibility audit with an `Approved-by:` line (check R1).' : '';
  return `| What | Count | Source |\n| --- | --- | --- |\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}${note}`;
}

async function tokenPanel() {
  const registry = parseJson<ComponentRegistry>(await readFile('spec/registry.json', 'utf8'));
  const shipped = registry.components
    .filter((c) => ['beta', 'stable', 'code-only'].includes(c.status) && c.path)
    .map((c) => c.path?.split('/').pop());
  const light = (await readFile('generated/css/tokens.css', 'utf8')).split('[data-theme="dark"]')[0] ?? '';
  const aliases = (variable: string) =>
    [...light.matchAll(new RegExp(`^\\s*(--sb-[a-z0-9-]+): var\\(${variable}\\);`, 'gm'))]
      .map((m) => m[1] ?? '')
      .filter((name) => shipped.some((component) => name.startsWith(`--sb-${component}-`)));
  const list = (names: string[], style: (name: string) => string) =>
    `<ul class="swatches">${names
      .map((n) => `<li><span class="swatch" style="${style(n)}" aria-hidden="true"></span><code>${n}</code></li>`)
      .join('')}</ul>`;
  const brandPrimary = parseJson<BrandConfig>(await readFile('brand.config.json', 'utf8')).color?.primary;
  const color = aliases('--sb-color-primary');
  const radius = aliases('--sb-radius-control');
  if (!color.length || !radius.length) throw new Error('docs token panel: no component aliases of the primary color or control radius in the light block of generated/css/tokens.css');
  return `<div class="token-panel" data-playground>
<div class="playground-controls">
<div class="playground-field"><sb-native-select label="Primary color" size="small" data-control="primary" value="${brandPrimary}">
<option value="${brandPrimary}">Brand</option>
<option value="#0F766E">Teal</option>
<option value="#2563EB">Blue</option>
<option value="#7C3AED">Violet</option>
<option value="#E11D48">Rose</option>
</sb-native-select></div>
<div class="playground-field playground-range"><sb-slider label="Radius" min="0" max="20" step="1" value="8" data-control="radius"></sb-slider><output data-output="radius">8px</output></div>
<sb-button variant="ghost" size="small" data-reset>Reset</sb-button>
</div>
<div class="token-groups">
<section><h3><code>color.primary</code></h3><p>${color.length} component tokens point at it.</p>${list(color, (n) => `background: var(${n})`)}</section>
<section><h3><code>radius.control</code></h3><p>${radius.length} component tokens point at it.</p>${list(radius, (n) => `border-radius: var(${n})`)}</section>
</div>
</div>`;
}

async function load() {
  const panel = await tokenPanel();
  const illustrations = Object.fromEntries(
    await Promise.all(
      (await readdir('apps/docs/content/_assets/illustrations'))
        .filter((f) => f.endsWith('.svg'))
        .map(async (f): Promise<[string, string]> => [f.slice(0, -4), await readFile(join('apps/docs/content/_assets/illustrations', f), 'utf8')])
    )
  );
  const figure = (name: string, caption: string) => {
    const svg = illustrations[name];
    if (!svg) throw new Error(`Unknown illustration: ${name}`);
    return `<figure class="illustration">${svg}<figcaption>${esc(caption)}</figcaption></figure>`;
  };
  const cli = cliSource(await readFile('docs/cli.md', 'utf8'));
  const n = await stats();
  const isStat = (key: string): key is keyof Stats => key in n;
  const sources: Source[] = [];
  for (const rel of await mdFiles('apps/docs/content')) {
    const { meta, body } = parse(await readFile(join('apps/docs/content', rel), 'utf8'));
    const dir = rel.includes('/') ? (rel.split('/')[0] ?? '') : '';
    const path = rel.replace(/\.md$/, '');
    sources.push({
      meta,
      dir,
      url: path === 'index' ? '/' : path.endsWith('/index') ? `/${path.slice(0, -6)}/` : `/${path}/`,
      body: body
        .replace('<!-- cli:commands -->', cli.table)
        .replace('<!-- cli:conventions -->', cli.conventions)
        .replace('<!-- tokens:preview -->', panel)
        .replace('<!-- status:table -->', statusTable(n))
        .replace(/<!-- stat:(\w+) -->/g, (_, key: string) => {
          if (!isStat(key)) throw new Error(`apps/docs/content/${rel}: unknown <!-- stat:${key} -->`);
          const value = n[key];
          if (typeof value === 'object') throw new Error(`apps/docs/content/${rel}: unknown <!-- stat:${key} -->`);
          return String(value);
        })
        .replace(/<!-- illustration: ([\w-]+) \| (.*?) -->/g, (_, name: string, caption: string) => figure(name, caption))
    });
  }
  for (const page of cli.pages) {
    sources.push({
      meta: { title: page.title, description: page.description, order: page.order },
      dir: 'cli',
      url: page.url,
      body: page.body
    });
  }

  const demoList = `<ul class="demo-list">${sources
    .filter((s) => s.dir === 'demo' && s.url !== '/demo/')
    .sort((a, b) => (a.meta.title ?? '').localeCompare(b.meta.title ?? '', 'en'))
    .map((s) => `<li><a href="${s.url}">${esc(s.meta.title)}</a></li>`)
    .join('')}</ul>`;

  const pages = sources.map(({ meta, dir, url, body: raw }): Page => {
    const body = raw.replace('<!-- demo:list -->', demoList);
    const h1 = body.match(/^\s*# (.+)\n/);
    const content = body.replace(/^\s*# .+\n/, '').replace(/^Source of truth:.*\n?/gm, '').trim();
    const env: { toc?: TocEntry[] } = {};
    const html = md.render(content, env);
    const title = meta.title ?? h1?.[1] ?? url;
    const section = SECTIONS.find((s) => s.dir === dir);
    if (!section) throw new Error(`apps/docs/content/${dir}: no SECTIONS entry for this folder`);
    return {
      url,
      dir,
      layout: meta.layout ?? '',
      order: Number(meta.order ?? 100),
      title,
      tab: section.tab,
      description: meta.description ?? '',
      markdown: content,
      html,
      toc: env.toc ?? [],
      text: html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()
    };
  });
  const rank = (p: Page) => SECTIONS.findIndex((s) => s.dir === p.dir);
  return pages.sort((a, b) => rank(a) - rank(b) || a.order - b.order || a.title.localeCompare(b.title, 'en'));
}

const PLAYGROUND_HEAD = `<script>try{var p=JSON.parse(localStorage.getItem('sb-docs-playground')||'null');if(p){var r=document.documentElement.style;if(p.primary){r.setProperty('--sb-color-primary',p.primary);r.setProperty('--sb-color-primary-foreground',p.primaryForeground)}if(p.radius!=null){var s={sm:.75,md:1,lg:1.25,xl:1.5};for(var k in s)r.setProperty('--sb-radius-'+k,Math.round(p.radius*s[k])+'px')}}}catch(e){}</script>`;

const icon = (d: string) =>
  `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  menu: icon('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  theme: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')
};

function nav(pages: Page[], page: Page) {
  return SECTIONS.filter((section) => section.title && section.tab === page.tab)
    .map((section) => {
      const index = `/${section.dir}/`;
      const items = pages.filter((p) => p.dir === section.dir && p.url !== index);
      const list = `<ul>${items
        .map((p) => `<li><a href="${p.url}"${p.url === page.url ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`)
        .join('')}</ul>`;
      const id = `nav-${section.dir}`;
      return `<div class="nav-group" role="group" aria-labelledby="${id}"><p class="nav-heading" id="${id}">${esc(section.title)}</p>${list}</div>`;
    })
    .join('\n');
}

function layout(pages: Page[], page: Page) {
  const home = page.layout === 'home';
  const scope = pages.filter((p) => p.tab === page.tab && p.layout !== 'home');
  const at = scope.indexOf(page);
  const prev = scope[at - 1];
  const next = scope[at + 1];
  const toc =
    page.toc.length && !home
      ? `<nav class="toc" aria-label="On this page"><h2 class="toc-heading">On this page</h2><ul>${page.toc
          .map((t) => `<li class="toc-${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`)
          .join('')}</ul></nav>`
      : '<div class="toc"></div>';
  const pager = home
    ? ''
    : `<nav class="pager" aria-label="Previous and next pages">${
        prev ? `<a rel="prev" href="${prev.url}"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'
      }${next ? `<a rel="next" href="${next.url}"><span>Next</span>${esc(next.title)}</a>` : ''}</nav>`;
  const tocInline =
    page.toc.length && !home
      ? `<details class="toc-inline"><summary>On this page</summary><ul>${page.toc
          .map((t) => `<li class="toc-${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`)
          .join('')}</ul></details>`
      : '';
  const header = `<header class="page-header"><h1>${esc(page.title)}</h1>${
    page.description ? `<p class="lead">${esc(page.description)}</p>` : ''
  }</header>${tocInline}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.url === '/' ? 'Sketchbook' : `${esc(page.title)} · Sketchbook`}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="icon" href="/assets/sketchbook-icon.png" type="image/png">
<link rel="alternate" type="text/markdown" href="${page.url}index.md">
<script>try{var t=localStorage.getItem('sb-docs-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
${page.tab === 'demo' ? PLAYGROUND_HEAD : ''}
<link rel="stylesheet" href="/assets/tokens.css">
<link rel="stylesheet" href="/assets/docs.css">
${page.html.includes('<sb-') ? '<script src="/assets/sketchbook.js" defer></script>' : ''}
<script src="/assets/docs.js" defer></script>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="topbar">
  <button class="icon-btn menu-btn" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${ICONS.menu}</button>
  <a class="brand" href="/"><img src="/assets/sketchbook-icon.png" alt="" width="24" height="24"><span class="brand-name">Sketchbook</span></a>
  <nav class="tabs" aria-label="Site">${TABS.map(
    (tab) => `<a href="${tab.url}"${tab.id === page.tab ? ' aria-current="page"' : ''}>${tab.title}</a>`
  ).join('')}</nav>
  <button class="search-btn" type="button" aria-haspopup="dialog">${ICONS.search}<span>Search</span><kbd>⌘K</kbd></button>
  <button class="icon-btn theme-btn" type="button" aria-label="Switch theme">${ICONS.theme}</button>
</header>
<div class="layout${home ? ' layout-home' : ''}">
  <nav id="sidebar" class="sidebar" aria-label="${page.tab === 'demo' ? 'Demo' : 'Documentation'}">
${nav(pages, page)}
  </nav>
  <script>try{var n=document.getElementById('sidebar'),s=sessionStorage.getItem('sb-docs-nav');if(s)n.scrollTop=+s}catch(e){}</script>
  <main id="content" class="content${home ? ' home' : ''}" tabindex="-1">
    <article class="prose">
${header}
${page.html}
    </article>
    ${pager}
    <p class="page-meta"><a href="${page.url}index.md">View as Markdown</a></p>
  </main>
  ${toc}
</div>
<div class="backdrop" hidden></div>
<dialog id="search" aria-label="Search documentation">
  <input id="q" type="search" placeholder="Search the docs" aria-label="Search documentation" autocomplete="off">
  <ul id="results"></ul>
  <p id="status" role="status" class="muted"></p>
</dialog>
</body>
</html>
`;
}

const pages = await load();
await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/assets`, { recursive: true });
await writeFile(join(OUT, 'build-metadata.json'), `${JSON.stringify({ commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown' }, null, 2)}\n`);

for (const page of pages) {
  const dir = join(OUT, page.url);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), layout(pages, page));
  await writeFile(join(dir, 'index.md'), `# ${page.title}\n\n${page.description ? `${page.description}\n\n` : ''}${page.markdown}\n`);
}

await cp('generated/css/tokens.css', `${OUT}/assets/tokens.css`);
await cp('dist/sketchbook.js', `${OUT}/assets/sketchbook.js`);
await cp("brand/sketchbook-icon.png", `${OUT}/assets/sketchbook-icon.png`);
await cp('node_modules/minisearch/dist/umd/index.js', `${OUT}/assets/minisearch.js`);
await cp('apps/docs/content/_assets/docs.css', `${OUT}/assets/docs.css`);
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
execFileSync(process.execPath, [tsc, '-p', 'apps/docs/tsconfig.browser.json'], { stdio: 'inherit' });
await cp('apps/docs/content/_assets/Sketchbook.fig', `${OUT}/assets/Sketchbook.fig`);

const sectionOf = (p: Page) => SECTIONS.find((s) => s.dir === p.dir)?.title ?? '';
await writeFile(
  `${OUT}/search.json`,
  JSON.stringify(pages.map((p, id) => ({ id, url: p.url, title: p.title, section: sectionOf(p), text: p.text })))
);
await writeFile(
  `${OUT}/llms.txt`,
  `# Sketchbook\n\n${pages.map((p) => `- [${p.title}](${p.url}index.md)${p.description ? `: ${p.description}` : ''}`).join('\n')}\n`
);

console.log(`Built ${pages.length} pages into ${OUT}/`);
