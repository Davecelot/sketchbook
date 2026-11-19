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
const backdrop = requiredElement('.backdrop');
const behindDrawer = ['main', '.toc', '.brand', '.tabs', '.search-btn', '.theme-btn'].map((selector) => requiredElement(selector));
const setMenu = (open: boolean) => {
  const wasOpen = sidebar.hasAttribute('data-open');
  sidebar.toggleAttribute('data-open', open);
  for (const element of behindDrawer) element.inert = open;
  backdrop.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (open) sidebar.querySelector('a')?.focus();
  else if (wasOpen) menuButton.focus();
};
menuButton.addEventListener('click', () => setMenu(!sidebar.hasAttribute('data-open')));
backdrop.addEventListener('click', () => setMenu(false));
addEventListener('keydown', (event) => {
  if (!sidebar.hasAttribute('data-open')) return;
  if (event.key === 'Escape') setMenu(false);
  if (event.key !== 'Tab') return;
  const links = [...sidebar.querySelectorAll('a')].filter((link) => !link.closest('details:not([open])'));
  const last = links.at(-1) ?? menuButton;
  if (event.shiftKey && document.activeElement === menuButton) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    menuButton.focus();
  }
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
  const color = requiredElement<HTMLElement & { value: string }>('[data-control="primary"]', playground);
  const radius = requiredElement<HTMLElement & { value: number[] }>('[data-control="radius"]', playground);
  const output = requiredElement('[data-output="radius"]', playground);
  const RADIUS_SCALE = { sm: 0.75, md: 1, lg: 1.25, xl: 1.5 };
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
  const radiusValue = () => radius.value[0] ?? 8;

  const luminance = (hex: string) => {
    const channel = (i: number) => {
      const value = parseInt(hex.slice(i, i + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };
  const readable = (hex: string) => {
    const l = luminance(hex);
    return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? token('--sb-color-black') : token('--sb-color-white');
  };
  const showRadius = () => {
    const pixels = radiusValue();
    output.textContent = `${pixels}px`;
    radius.setAttribute('aria-valuetext', `${pixels} pixels`);
  };

  const KEY = 'sb-docs-playground';
  const persist = () => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          primary: color.value,
          primaryForeground: root.style.getPropertyValue('--sb-color-primary-foreground'),
          radius: radius.value
        })
      );
    } catch (e) {} // eslint-disable-line no-empty -- storage can be unavailable (private mode); the playground still works
  };
  const applyColor = () => {
    root.style.setProperty('--sb-color-primary', color.value);
    root.style.setProperty('--sb-color-primary-foreground', readable(color.value));
    persist();
  };
  color.addEventListener('change', applyColor);
  radius.addEventListener('input', () => {
    showRadius();
    for (const [name, factor] of Object.entries(RADIUS_SCALE)) {
      root.style.setProperty(`--sb-radius-${name}`, `${Math.round(radiusValue() * factor)}px`);
    }
    persist();
  });
  requiredElement('[data-reset]', playground).addEventListener('click', () => {
    const touched = ['--sb-color-primary', '--sb-color-primary-foreground', ...Object.keys(RADIUS_SCALE).map((n) => `--sb-radius-${n}`)];
    for (const property of touched) root.style.removeProperty(property);
    radius.value = [8];
    color.value = color.getAttribute('value') ?? '';
    showRadius();
    try {
      localStorage.removeItem(KEY);
    } catch (e) {} // eslint-disable-line no-empty -- storage can be unavailable
  });
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if ('primary' in saved && typeof saved.primary === 'string') color.value = saved.primary;
      if ('radius' in saved) {
        const value: unknown = Array.isArray(saved.radius) ? saved.radius[0] : saved.radius;
        const pixels = typeof value === 'string' ? Number(value) : value;
        if (typeof pixels === 'number' && Number.isFinite(pixels)) radius.value = [pixels];
      }
    }
  } catch (e) {} // eslint-disable-line no-empty -- unreadable saved state: keep the defaults
  showRadius();
}
