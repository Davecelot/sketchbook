import { createHash } from 'node:crypto';
import { chmodSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { AGENT_PROFILES, agentFileState, profileFiles } from './agent-config.mjs';
import type { AgentProfile } from './agent-config.mjs';
import { frontmatter } from './claude-layer.mjs';
import { ENGINE, errorCode, errorMessage, hashOf, readJson, walk } from './files.mjs';
import { CATALOG_SOURCE, catalogSourceFiles } from './agent-render.mjs';

type Kind = 'bundle' | 'skill' | 'agent' | 'rule' | 'command' | 'hook' | 'config';
type Entry = { id: string; kind: Kind; summary: string; integration?: true; partOf?: string; files: Payload[]; members?: string[] };
type Payload = { source: string; path: string; projectSetting?: true };
const PROJECT = 'harness/templates/project/';
const REFERENCE = 'docs/sketchbook-harness';
const SHARED = '.agents/skills';
const GUIDANCE = '.agents/sketchbook';
const RECOMMENDED = ['contract-author', 'component-builder', 'hammock', 'review-rangers'];
const MODULE_SETTINGS: Record<string, Payload> = {
  hammock: { source: `${CATALOG_SOURCE}/hammock/default-mode.example.json`, path: '.sketchbook/hammock.json', projectSetting: true },
};
export const CATALOG_CLIENTS = [...AGENT_PROFILES, 'opencode', 'cursor', 'windsurf', 'antigravity', 'kiro'] as const;
export type CatalogClient = typeof CATALOG_CLIENTS[number];
const SHARED_DISCOVERY: CatalogClient[] = ['opencode', 'codex', 'copilot', 'gemini', 'cursor', 'windsurf', 'antigravity'];
const RULES_FOR: Record<string, string[]> = {
  'contract-author': ['contract-first', 'planning-gate', 'spec-is-source'],
  'component-builder': ['contract-first', 'planning-gate', 'form-associated-controls', 'test-first', 'tokens-through-the-harness'],
  'web-components-best-practices': ['contract-first'],
  'a11y-checker': ['form-associated-controls'],
  'design-figma': ['figma-fidelity'],
  foundations: ['tokens-through-the-harness'],
};
const COMMAND_SKILL: Record<string, string> = {
  add: 'contract-author', foundations: 'foundations', 'import-tokens': 'foundations', init: 'onboarding',
  kits: 'kits', 'roast-foundations': 'foundations', start: 'onboarding', sync: 'design-figma', tour: 'onboarding',
};
const withoutExtension = (file: string) => file.replace(/\.[^.]+$/, '');
const agentSummary = (source: string, fallback: string): string => {
  const value = frontmatter(readFileSync(join(ENGINE, source), 'utf8'))?.description;
  return typeof value === 'string' ? value.split('Trigger:')[0]?.trim() || fallback : fallback;
};

export function harnessCatalog(): Entry[] {
  const entries: Entry[] = [{ id: 'recommended', kind: 'bundle', summary: 'Contract authoring, component implementation, simplicity and structured review.', members: RECOMMENDED, files: [] }];
  const artifact = (kind: Kind, id: string, source: string, summary = `${kind} for ${id}`, path?: string, members?: string[], partOf?: string) => {
    entries.push({ id: `${kind}:${id}`, kind, integration: path ? undefined : true, members, partOf,
      files: [{ source, path: path ?? `${REFERENCE}/${source.replace(/^(?:harness\/templates\/(?:project\/)?)/, '')}` }],
      summary: source.endsWith('.md') ? agentSummary(source, summary) : summary });
  };
  const canonical = catalogSourceFiles();
  for (const source of canonical) {
    const rel = source.slice(CATALOG_SOURCE.length + 1);
    const [id = '', area, file = ''] = rel.split('/');
    if (area === 'SKILL.md') {
      const files: Payload[] = canonical.filter((file) => file.startsWith(`${CATALOG_SOURCE}/${id}/`) && !file.endsWith('.example.json'))
        .map((source) => ({ source, path: `${SHARED}/${source.slice(CATALOG_SOURCE.length + 1)}` }));
      const settings = MODULE_SETTINGS[id];
      if (settings) files.push(settings);
      entries.push({ id, kind: 'skill', summary: agentSummary(source, 'Skill workflow'),
        files, members: RULES_FOR[id]?.map((rule) => `rule:${rule}`) });
    } else if ((id === 'rules' || id === 'commands') && area?.endsWith('.md')) {
      const kind = id === 'rules' ? 'rule' : 'command';
      const name = withoutExtension(area);
      const skill = kind === 'command' ? COMMAND_SKILL[name] : undefined;
      artifact(kind, name, source, `Shared ${kind}: ${name}`, `${GUIDANCE}/${rel}`, skill ? [skill] : undefined);
    } else if (area === 'agents' && file.endsWith('.md')) {
      artifact('agent', `${id}/${withoutExtension(file)}`, source, `Role brief: ${withoutExtension(file)}`, `${SHARED}/${rel}`, undefined, id);
    } else if (id === 'review-rangers' && area === 'assets' && file.endsWith('-template.md')) {
      artifact('agent', `${id}/${file.replace(/-template\.md$/, '')}`, source, `Review brief: ${file.replace(/-template\.md$/, '')}`, `${SHARED}/${rel}`, undefined, id);
    }
  }
  const routing = `${PROJECT}${SHARED}/sketchbook/SKILL.md`;
  entries.push({ id: 'sketchbook', kind: 'skill', files: [{ source: routing, path: `${SHARED}/sketchbook/SKILL.md` }],
    members: ['rule:project/workflows'], summary: agentSummary(routing, 'Sketchbook task routing') });
  for (const file of walk(ENGINE, '.claude/hooks').map((p) => p.replaceAll('\\', '/')).filter((p) => p.endsWith('.mjs'))) {
    artifact('hook', withoutExtension(file.split('/').at(-1) ?? ''), file);
  }
  for (const file of walk(ENGINE, '.claude/skills').map((p) => p.replaceAll('\\', '/')).filter((p) => /\/hooks\/[^/]+\.mjs$/.test(p))) {
    const [, , id = '', , name = ''] = file.split('/');
    artifact('hook', `${id}/${withoutExtension(name)}`, file);
  }
  for (const file of walk(ENGINE, '.githooks')) artifact('hook', `git/${file.split(/[\\/]/).at(-1) ?? ''}`, file);
  for (const profile of AGENT_PROFILES) {
    for (const file of profileFiles([profile])) {
      if (file.startsWith(`${SHARED}/`) || file === 'CLAUDE.md' || file === 'AGENTS.md' || file === 'AGENT-WORKFLOWS.md') continue;
      const kind = file.endsWith('.json') ? 'config' : file.endsWith('.mjs') ? 'hook' : 'rule';
      artifact(kind, `${profile}/${file.split('/').at(-1) ?? ''}`, PROJECT + file);
    }
  }
  artifact('rule', 'project/AGENTS', PROJECT + 'AGENTS.md', 'Shared project instructions', `${GUIDANCE}/rules/AGENTS.md`, ['rule:project/workflows']);
  artifact('rule', 'project/workflows', PROJECT + 'AGENT-WORKFLOWS.md', 'Shared task routing and workflows', `${GUIDANCE}/rules/AGENT-WORKFLOWS.md`);
  artifact('rule', 'claude/CLAUDE', 'harness/templates/CLAUDE.md', 'Claude Code project instructions');
  artifact('config', 'claude/settings', PROJECT + '.claude/settings.json', 'Claude Code native hook registrations');
  entries.push({ id: 'config:hammock/default-mode', kind: 'config', partOf: 'hammock', files: [],
    summary: 'Project-local Hammock default mode, shared by the skill and optional adapters.' });
  return entries.sort((a, b) => a.kind.localeCompare(b.kind, 'en') || a.id.localeCompare(b.id, 'en'));
}

export function catalogAvailability(entry: Entry, client: CatalogClient) {
  if (entry.partOf) return 'included in module';
  if (entry.kind === 'bundle' || entry.kind === 'skill') {
    return SHARED_DISCOVERY.includes(client) ? 'shared discovery' : 'manual skill';
  }
  return entry.integration ? 'reference only' : 'portable';
}

const catalogEntry = (catalog: Entry[], id: string): Entry => {
  const entry = catalog.find((item) => item.id === id);
  if (!entry) throw new Error(`Unknown harness item "${id}". Run sketchbook harness list for item IDs.`);
  return entry;
};

function resolveEntries(catalog: Entry[], roots: Entry[]) {
  const entries = new Set<Entry>();
  function visit(entry: Entry, parents: Set<Entry>) {
    if (parents.has(entry)) throw new Error(`Circular harness dependency at ${entry.id}`);
    if (entries.has(entry)) return;
    for (const id of entry.members ?? []) visit(catalogEntry(catalog, id), new Set([...parents, entry]));
    entries.add(entry);
  }
  for (const entry of roots) visit(entry, new Set());
  return [...entries];
}

const payload = (entries: Entry[]) => [...new Map(entries.flatMap(({ files }) => files.map((file) => [file.path, file] as const))).values()];
const legacy = readJson<Record<string, string | string[]>>(join(ENGINE, CATALOG_SOURCE, 'legacy-content.json'));
export const matchesLegacyCatalogFile = (path: string, bytes: Buffer) => {
  const known = legacy[path.replace(/^move-to-\.claude\//, '.claude/')];
  const digest = hashOf(bytes.toString('utf8').replace(/\r\n/g, '\n'));
  return Array.isArray(known) ? known.includes(digest) : known === digest;
};

function inspect(root: string, item: Payload) {
  const bytes = readFileSync(join(ENGINE, item.source));
  const state = agentFileState(root, item.path);
  const have = state === 'file' ? readFileSync(join(root, item.path)) : null;
  return { bytes, path: item.path, before: have,
    state: have ? bytes.equals(have) ? 'present' : item.projectSetting ? 'preserved' : matchesLegacyCatalogFile(item.path, have) ? 'update' : 'conflict'
      : state === 'blocked' ? 'blocked' : 'missing' } as const;
}

export function harnessPlan(root: string, ids: string[], { show = false } = {}) {
  const catalog = harnessCatalog();
  const requested = [...new Set(ids)].map((id) => catalogEntry(catalog, id));
  const base = resolveEntries(catalog, requested.filter((entry) => !entry.partOf));
  const owners = requested.flatMap((entry) => entry.partOf ? [{ entry, owner: catalogEntry(catalog, entry.partOf) }] : []);
  if (!show) for (const { entry, owner } of owners) {
    if (!base.includes(owner)) throw Object.assign(new Error(`${entry.id} is included in ${owner.id} and cannot be installed separately.`), {
      fix: `sketchbook harness add ${owner.id} --dry-run`,
    });
  }
  const entries = show && owners.length ? resolveEntries(catalog, [...base, ...owners.map(({ owner }) => owner)]) : base;
  const items = payload(entries).map((file) => inspect(root, file));
  return { requested, entries, items };
}

type Plan = ReturnType<typeof harnessPlan>;

export function harnessPlanId(plan: Plan) {
  const digest = (bytes: Buffer | null) => bytes && createHash('sha256').update(bytes).digest('hex');
  return createHash('sha256').update(JSON.stringify([
    plan.requested.map(({ id }) => id),
    plan.items.map(({ path, state, before, bytes }) => [path, state, digest(before), digest(bytes)]),
  ])).digest('hex');
}

export function applyHarnessPlan(root: string, plan: Plan) {
  const changed: string[] = [];
  const errors: { file: string | null; msg: string; fix: string }[] = [];
  const warnings: string[] = [];
  if (plan.items.some(({ state }) => state === 'blocked' || state === 'conflict')) return { changed, errors, warnings };
  const pending = plan.items.filter(({ state }) => state === 'missing' || state === 'update');
  type Identity = { dev: number; ino: number };
  const sameFile = (a: Identity, b: Identity) => a.dev === b.dev && a.ino === b.ino;
  const dirs: { rel: string; identity: Identity }[] = [];
  const scratch: { rel: string; identity: Identity; files: string[] }[] = [];
  const undo: { path: string; backup: string | null; restore: () => void }[] = [];
  const ensureDir = (rel: string) => {
    if (rel === '.') return;
    ensureDir(dirname(rel));
    try { mkdirSync(join(root, rel)); dirs.push({ rel, identity: lstatSync(join(root, rel)) }); }
    catch (error) {
      if (errorCode(error) !== 'EEXIST' || !lstatSync(join(root, rel)).isDirectory()) throw error;
    }
  };
  const dirStillOurs = (rel: string, identity: Identity) => {
    // A probe below the directory checks all its parents without following symlinks.
    if (agentFileState(root, `${rel}/.sketchbook-cleanup-probe`) === 'blocked') return false;
    try { return sameFile(lstatSync(join(root, rel)), identity); }
    catch (error) { if (errorCode(error) === 'ENOENT') return false; throw error; }
  };
  const keep = new Set<string>();
  const verify = ({ path, before }: Plan['items'][number]) => {
    const state = agentFileState(root, path);
    if (before ? state === 'file' && before.equals(readFileSync(join(root, path))) : state === 'missing') return;
    throw new Error(`Destination changed while installing: ${path}`);
  };
  let current: string | null = null;
  try {
    // Stage beside each destination so publishing is atomic for each file, even on mounted subdirectories.
    const staged = pending.map((item) => {
      current = item.path;
      verify(item);
      ensureDir(dirname(item.path));
      const target = join(root, item.path);
      const dir = mkdtempSync(join(dirname(target), '.sketchbook-install-'));
      const next = join(dir, 'next');
      const backup = item.before ? join(dir, 'previous') : null;
      scratch.push({ rel: `${dirname(item.path)}/${basename(dir)}`, identity: lstatSync(dir), files: backup ? [next, backup] : [next] });
      writeFileSync(next, item.bytes, { flag: 'wx', mode: 0o644 });
      if (backup) {
        verify(item);
        linkSync(target, backup);
        chmodSync(next, lstatSync(backup).mode & 0o777);
      }
      return { item, target, next, backup, identity: lstatSync(next) };
    });
    for (const { item, target, next, backup, identity } of staged) {
      current = item.path;
      verify(item);
      if (backup) renameSync(next, target);
      else linkSync(next, target); // Do not replace a newly created destination.
      undo.push({ path: item.path, backup, restore: () => {
        const state = agentFileState(root, item.path);
        if (state === 'missing' && !backup) return;
        if (state !== 'file') throw new Error('Destination was moved or replaced');
        const live = lstatSync(target);
        if (!sameFile(live, identity) || !item.bytes.equals(readFileSync(target))) {
          throw new Error('Destination was edited after installation began');
        }
        if (backup) renameSync(backup, target);
        else unlinkSync(target);
      } });
    }
    changed.push(...pending.map(({ path }) => path));
  } catch (error) {
    errors.push({ file: current, msg: `Could not install${current ? ` ${current}` : ''}: ${errorMessage(error)}`, fix: 'Resolve the filesystem error and retry.' });
    for (const { path, backup, restore } of undo.reverse()) {
      try { restore(); } catch (failure) {
        changed.push(path);
        if (backup) keep.add(backup);
        errors.push({ file: path, msg: `Rollback could not restore ${path}: ${errorMessage(failure)}`,
          fix: backup ? `Review ${path} and the retained backup at ${backup} before retrying.` : 'Review this path before retrying.' });
      }
    }
  }
  for (const { rel, identity, files } of scratch) {
    try {
      if (!dirStillOurs(rel, identity)) throw new Error('Staging directory moved or replaced');
      for (const file of files) {
        if (keep.has(file)) continue;
        try { unlinkSync(file); } catch (error) { if (errorCode(error) !== 'ENOENT') throw error; }
      }
      if (!files.some((file) => keep.has(file))) rmdirSync(join(root, rel));
    } catch (error) { warnings.push(`Could not clean up ${rel}: ${errorMessage(error)}`); }
  }
  if (errors.length) for (const { rel, identity } of dirs.reverse()) {
    try { if (dirStillOurs(rel, identity)) rmdirSync(join(root, rel)); } catch (error) {
      if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(String(errorCode(error)))) warnings.push(`Could not clean up ${rel}: ${errorMessage(error)}`);
    }
  }
  return { changed, errors, warnings };
}

export function recommendedCatalogFiles(profiles: AgentProfile[]) {
  if (!profiles.length) return [];
  const catalog = harnessCatalog();
  return payload(resolveEntries(catalog, [catalogEntry(catalog, 'recommended')]))
    .filter(({ path }) => !path.endsWith('/contract-author/SKILL.md') && !path.endsWith('/component-builder/SKILL.md'));
}

export function catalogPresence(root: string) {
  return harnessCatalog().flatMap((entry) => {
    if (entry.partOf) return [];
    const files = entry.files.map((file) => ({ path: file.path, present: agentFileState(root, file.path) === 'file' }));
    return files.some((file) => file.present) ? [{ id: entry.id, complete: files.every((file) => file.present), files }] : [];
  });
}
