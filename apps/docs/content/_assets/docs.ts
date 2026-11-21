interface SearchDocument {
  id: number;
  title: string;
  section: string;
  text: string;
  url: string;
}

declare const MiniSearch: typeof import('minisearch').default;

const root = document.documentElement;
function requiredElement<T extends HTMLElement = HTMLElement>(selector: string, parent: ParentNode = document): T {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error(`Missing docs element: ${selector}`);
  return element;
}

const themeButton = requiredElement<HTMLButtonElement>('.theme-btn');
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.dataset.theme ?? (systemDark.matches ? 'dark' : 'light');
const syncThemeLabel = () => themeButton.setAttribute('aria-label', `Switch to ${currentTheme() === 'dark' ? 'light' : 'dark'} theme`);
syncThemeLabel();
themeButton.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('sb-docs-theme', next);
  } catch {
    // theme still applies for this page view
  }
  syncThemeLabel();
});

requiredElement('.search-btn kbd').textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

const sidebar = requiredElement('#sidebar');
const currentLink = sidebar.querySelector('[aria-current="page"]');
if (currentLink) {
  const box = sidebar.getBoundingClientRect();
  const rect = currentLink.getBoundingClientRect();
  if (rect.top < box.top || rect.bottom > box.bottom) sidebar.scrollTop += rect.top - box.top - box.height / 2;
}
addEventListener('pagehide', () => {
  try {
    sessionStorage.setItem('sb-docs-nav', String(sidebar.scrollTop));
  } catch {
    // the next page opens with the sidebar at the top
  }
});

const menuButton = requiredElement<HTMLButtonElement>('.menu-btn');
const navigationSheet = requiredElement<HTMLDialogElement>('#navigation-sheet');
const navigationClose = requiredElement<HTMLButtonElement>('.navigation-close');
const sidebarParent = sidebar.parentElement!;
const sidebarNext = sidebar.nextSibling;
const mobile = matchMedia('(max-width: 800px)');
menuButton.addEventListener('click', () => {
  navigationSheet.append(sidebar);
  navigationSheet.showModal();
  document.documentElement.classList.add('navigation-open');
  menuButton.setAttribute('aria-expanded', 'true');
  navigationClose.focus();
  currentLink?.scrollIntoView({ block: 'nearest' });
});
navigationClose.addEventListener('click', () => navigationSheet.close());
navigationSheet.addEventListener('click', (event) => {
  if (event.target === navigationSheet) navigationSheet.close();
});
navigationSheet.addEventListener('close', () => {
  sidebarParent.insertBefore(sidebar, sidebarNext);
  document.documentElement.classList.remove('navigation-open');
  menuButton.setAttribute('aria-expanded', 'false');
  if (mobile.matches && !dialog.open) menuButton.focus();
});
mobile.addEventListener('change', () => {
  if (!mobile.matches && navigationSheet.open) navigationSheet.close();
});

const dialog = requiredElement<HTMLDialogElement>('#search');
const input = requiredElement<HTMLInputElement>('#q');
const results = requiredElement<HTMLUListElement>('#results');
const searchStatus = requiredElement('#status');
let index: import('minisearch').default<SearchDocument> | undefined;

const loadIndex = async () => {
  if (index) return index;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/assets/minisearch.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load MiniSearch'));
    document.head.append(script);
  });
  const docs = (await (await fetch('/search.json')).json()) as SearchDocument[];
  const nextIndex = new MiniSearch<SearchDocument>({
    fields: ['title', 'section', 'text'],
    storeFields: ['title', 'section', 'url'],
    searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 }
  });
  nextIndex.addAll(docs);
  index = nextIndex;
  return index;
};

const render = async () => {
  const query = input.value.trim();
  results.replaceChildren();
  if (!query) {
    searchStatus.textContent = '';
    return;
  }
  if (!index) searchStatus.textContent = 'Searching…';
  let hits: import('minisearch').SearchResult[];
  try {
    hits = (await loadIndex()).search(query).slice(0, 8);
  } catch {
    searchStatus.textContent = 'Couldn’t load search. Reload the page to try again.';
    return;
  }
  if (input.value.trim() !== query) return;
  for (const hit of hits) {
    const url: unknown = hit.url;
    const title: unknown = hit.title;
    const sectionName: unknown = hit.section;
    if (typeof url !== 'string' || typeof title !== 'string' || typeof sectionName !== 'string') continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.textContent = title;
    const section = document.createElement('span');
    section.textContent = sectionName;
    link.append(section);
    item.append(link);
    results.append(item);
  }
  const count = results.childElementCount;
  searchStatus.textContent = count
    ? `${count} ${count === 1 ? 'result' : 'results'}`
    : 'No results. Try a topic, command, or component name, such as tokens or button.';
};

const openSearch = () => {
  if (navigationSheet.open) navigationSheet.close();
  if (dialog.open) return;
  dialog.showModal();
  input.select();
};
requiredElement('.search-btn').addEventListener('click', openSearch);
addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
  }
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
input.addEventListener('input', () => void render());
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    dialog.close();
    return;
  }
  const links = [...results.querySelectorAll('a')];
  if (event.key === 'Enter' && document.activeElement === input) links[0]?.click();
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  const at = links.findIndex((link) => link === document.activeElement);
  const next = event.key === 'ArrowDown' ? at + 1 : at - 1;
  if (next < 0) input.focus();
  else links[Math.min(next, links.length - 1)]?.focus();
});

const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('.toc a')];
if (tocLinks.length) {
  const byId = new Map(tocLinks.map((link) => [link.hash.slice(1), link]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of tocLinks) link.removeAttribute('aria-current');
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-56px 0px -70% 0px' }
  );
  for (const id of byId.keys()) {
    const target = document.getElementById(id);
    if (target) observer.observe(target);
  }
}

const copyStatus = document.createElement('p');
copyStatus.className = 'sr';
copyStatus.setAttribute('role', 'status');
document.body.append(copyStatus);

for (const code of document.querySelectorAll('.code')) {
  const pre = code.querySelector('pre');
  if (!pre) continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', `Copy ${pre.innerText.trim().slice(0, 40).split('\n')[0] ?? ''}`);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText);
      button.textContent = 'Copied';
      copyStatus.textContent = 'Copied to clipboard';
    } catch {
      getSelection()?.selectAllChildren(pre);
      button.textContent = 'Selected';
      copyStatus.textContent = 'Couldn’t copy automatically. Use your copy shortcut to copy the selected code.';
    }
    setTimeout(() => {
      button.textContent = 'Copy';
      copyStatus.textContent = '';
    }, 2000);
  };
  button.addEventListener('click', () => void copy());
  code.append(button);
}

const scrollRegions = document.querySelectorAll('.code pre, .table-scroll, .live-demo');
const syncScrollRegions = () => {
  for (const region of scrollRegions) {
    const overflows = region.scrollWidth > region.clientWidth || region.scrollHeight > region.clientHeight;
    region.toggleAttribute('tabindex', overflows);
    if (overflows) region.setAttribute('tabindex', '0');
  }
};
syncScrollRegions();
addEventListener('resize', syncScrollRegions);

const playground = document.querySelector('[data-playground]');
if (playground) {
  type Select = HTMLElement & { value: string };
  type Preset = { id: string; values: { height?: Record<string, number>; 'padding-x'?: Record<string, string>; gap?: Record<string, string>; base?: number; steps?: number[]; sizes?: Record<string, number>; ratio?: number } };
  const controls = requiredElement<HTMLElement>('[data-presets]', playground);
  const presets = JSON.parse(controls.dataset.presets ?? '{}') as Record<string, Preset[]>;
  const output = requiredElement('[data-output="radius"]', playground);
  const radius = requiredElement<HTMLElement & { value: number[] }>('[data-control="radius"]', playground);
  const names = ['primary', 'density', 'spacing', 'font', 'typeScale'] as const;
  const fields = Object.fromEntries(names.map((name) => [name, requiredElement<Select>(`[data-control="${name}"]`, playground)])) as Record<(typeof names)[number], Select>;
  const defaults = Object.fromEntries(names.map((name) => [name, fields[name].getAttribute('value') ?? ''])) as Record<(typeof names)[number], string>;
  const preset = (family: string, id: string) => presets[family]?.find((p) => p.id === id)?.values;
  const key = 'sb-docs-playground-v2';
  let applied: string[] = [];
  const apply = () => {
    const overrides: Record<string, string> = {};
    const pixels = Math.max(0, Math.min(20, radius.value[0] ?? 8));
    output.textContent = `${pixels}px`;
    radius.setAttribute('aria-valuetext', `${pixels} pixels`);
    const label = (name: (typeof names)[number]) => fields[name].querySelector<HTMLOptionElement>(`option[value="${fields[name].value}"]`)?.textContent ?? '';
    requiredElement('[data-summary="appearance"]', playground).textContent = `Color & shape: ${label('primary')} · ${pixels}px`;
    requiredElement('[data-summary="spacing"]', playground).textContent = `Spacing: ${label('density')} · ${label('spacing')}`;
    requiredElement('[data-summary="typography"]', playground).textContent = `Type: ${label('font')} · ${label('typeScale')}`;
    if (pixels !== 8) {
      for (const [name, factor] of Object.entries({ sm: 0.75, md: 1, lg: 1.25, xl: 1.5 })) overrides[`--sb-radius-${name}`] = `${Math.round(pixels * factor)}px`;
    }
    const color = fields.primary.value;
    if (color !== defaults.primary && /^#[\da-f]{6}$/i.test(color)) {
      const channels = [1, 3, 5].map((i) => {
        const value = parseInt(color.slice(i, i + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      const luminance = 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
      overrides['--sb-color-primary'] = color;
      overrides['--sb-color-primary-foreground'] = luminance > 0.179 ? '#000' : '#fff';
    }
    const density = preset('density', fields.density.value);
    const spacingPreset = preset('spacing', fields.spacing.value);
    const spacing = spacingPreset?.base ?? 4;
    const step = (value: string | undefined) => Number((value ?? '0').replace('-', '.')) * spacing;
    if (fields.spacing.value !== defaults.spacing) {
      for (const n of spacingPreset?.steps ?? []) overrides[`--sb-space-${String(n).replace('.', '-')}`] = `${n * spacing}px`;
    }
    if (fields.density.value !== defaults.density) {
      for (const [name, value] of Object.entries(density?.height ?? {})) overrides[`--sb-size-control-${name}`] = `${value}px`;
      for (const [name, value] of Object.entries(density?.['padding-x'] ?? {})) overrides[`--sb-space-control-padding-x-${name}`] = `${step(value)}px`;
      for (const [name, value] of Object.entries(density?.gap ?? {})) overrides[`--sb-space-control-gap-${name}`] = `${step(value)}px`;
    }
    const fonts: Record<string, string> = { system: 'system-ui, sans-serif', serif: 'Georgia, serif', mono: 'ui-monospace, monospace' };
    if (fields.font.value !== defaults.font) overrides['--sb-font-family-sans'] = fonts[fields.font.value] ?? 'system-ui, sans-serif';
    const scale = preset('typeScale', fields.typeScale.value);
    if (fields.typeScale.value !== defaults.typeScale) {
      ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'].forEach((name, index) => {
        const value = scale?.sizes?.[name] ?? Math.round((16 * (scale?.ratio ?? 1) ** (index - 2)) / 2) * 2;
        overrides[`--sb-font-size-${name}`] = `${value}px`;
      });
    }
    for (const name of applied) root.style.removeProperty(name);
    for (const [name, value] of Object.entries(overrides)) root.style.setProperty(name, value);
    applied = Object.keys(overrides);
    return overrides;
  };
  const save = (overrides: Record<string, string>) => {
    try {
      localStorage.setItem(key, JSON.stringify({ ...Object.fromEntries(names.map((name) => [name, fields[name].value])), radius: radius.value[0], overrides }));
    } catch (e) {} // eslint-disable-line no-empty -- storage may be unavailable
  };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? localStorage.getItem('sb-docs-playground') ?? 'null');
    if (saved && typeof saved === 'object') {
      const values = saved as Record<string, unknown>;
      if (values.overrides && typeof values.overrides === 'object') applied = Object.keys(values.overrides);
      for (const name of names) {
        const value = values[name];
        if (typeof value === 'string' && Array.from(fields[name].querySelectorAll('option')).some((option) => option.value === value)) fields[name].value = value;
      }
      if ('radius' in saved) {
        const value: unknown = Array.isArray(saved.radius) ? saved.radius[0] : saved.radius;
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 20) radius.value = [value];
      }
    }
  } catch (e) {} // eslint-disable-line no-empty -- unreadable saved state: keep defaults
  const groups = [...playground.querySelectorAll<HTMLDetailsElement>('.playground-control-group')];
  for (const group of groups) {
    group.addEventListener('toggle', () => {
      if (group.open) for (const other of groups) if (other !== group) other.open = false;
    });
  }
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !controls.querySelector('.playground-groups')?.contains(event.target)) {
      for (const group of groups) group.open = false;
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = groups.find((group) => group.open);
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  });
  for (const name of names) fields[name].addEventListener('change', () => save(apply()));
  radius.addEventListener('input', () => save(apply()));
  requiredElement('[data-reset]', playground).addEventListener('click', () => {
    for (const name of names) fields[name].value = defaults[name];
    radius.value = [8];
    apply();
    try {
      localStorage.removeItem(key);
      localStorage.removeItem('sb-docs-playground');
    } catch (e) {} // eslint-disable-line no-empty -- storage may be unavailable
  });
  const overrides = apply();
  // Upgrade the previous preview-only settings so they also apply on other Demo pages.
  if (Object.keys(overrides).length) save(overrides);
}
