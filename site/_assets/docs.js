const root = document.documentElement;
const $ = (selector) => document.querySelector(selector);

const themeButton = $('.theme-btn');
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

$('.search-btn kbd').textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

const sidebar = $('#sidebar');
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

const menuButton = $('.menu-btn');
const backdrop = $('.backdrop');
const behindDrawer = ['main', '.toc', '.brand', '.tabs', '.search-btn', '.theme-btn'].map($);
const setMenu = (open) => {
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
  const stops = [menuButton, ...[...sidebar.querySelectorAll('a')].filter((link) => !link.closest('details:not([open])'))];
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const dialog = $('#search');
const input = $('#q');
const results = $('#results');
const status = $('#status');
let index;

const loadIndex = async () => {
  if (index) return index;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/assets/minisearch.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  const docs = await (await fetch('/search.json')).json();
  index = new MiniSearch({
    fields: ['title', 'section', 'text'],
    storeFields: ['title', 'section', 'url'],
    searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 }
  });
  index.addAll(docs);
  return index;
};

const render = async () => {
  const query = input.value.trim();
  results.replaceChildren();
  if (!query) {
    status.textContent = '';
    return;
  }
  if (!index) status.textContent = 'Searching…';
  let hits;
  try {
    hits = (await loadIndex()).search(query).slice(0, 8);
  } catch {
    status.textContent = 'Search could not load. Reload the page and try again.';
    return;
  }
  if (input.value.trim() !== query) return;
  for (const hit of hits) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = hit.url;
    link.textContent = hit.title;
    const section = document.createElement('span');
    section.textContent = hit.section;
    link.append(section);
    item.append(link);
    results.append(item);
  }
  status.textContent = hits.length
    ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}`
    : 'No results. Try a command name such as check or tokens.';
};

const openSearch = () => {
  dialog.showModal();
  input.select();
};
$('.search-btn').addEventListener('click', openSearch);
addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
  }
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
input.addEventListener('input', render);
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
  const at = links.indexOf(document.activeElement);
  const next = event.key === 'ArrowDown' ? at + 1 : at - 1;
  if (next < 0) input.focus();
  else links[Math.min(next, links.length - 1)]?.focus();
});

const tocLinks = [...document.querySelectorAll('.toc a')];
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
  for (const id of byId.keys()) observer.observe(document.getElementById(id));
}

const copyStatus = document.createElement('p');
copyStatus.className = 'sr';
copyStatus.setAttribute('role', 'status');
document.body.append(copyStatus);

for (const code of document.querySelectorAll('.code')) {
  const pre = code.querySelector('pre');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', `Copy ${pre.innerText.trim().split('\n')[0].slice(0, 40)}`);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText);
      button.textContent = 'Copied';
      copyStatus.textContent = 'Copied to clipboard';
    } catch {
      getSelection().selectAllChildren(pre);
      button.textContent = 'Selected';
      copyStatus.textContent = 'Copy failed. The code is selected; press copy.';
    }
    setTimeout(() => {
      button.textContent = 'Copy';
      copyStatus.textContent = '';
    }, 2000);
  });
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

const playground = $('[data-playground]');
if (playground) {
  const color = playground.querySelector('[data-control="primary"]');
  const radius = playground.querySelector('[data-control="radius"]');
  const output = playground.querySelector('[data-output="radius"]');
  const RADIUS_SCALE = { sm: 0.75, md: 1, lg: 1.25, xl: 1.5 };
  const token = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const readable = (hex) => {
    const l = luminance(hex);
    return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? token('--sb-color-black') : token('--sb-color-white');
  };
  const showRadius = () => {
    output.textContent = `${radius.value}px`;
    radius.setAttribute('aria-valuetext', `${radius.value} pixels`);
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
      root.style.setProperty(`--sb-radius-${name}`, `${Math.round(Number(radius.value) * factor)}px`);
    }
    persist();
  });
  playground.querySelector('[data-reset]').addEventListener('click', () => {
    const touched = ['--sb-color-primary', '--sb-color-primary-foreground', ...Object.keys(RADIUS_SCALE).map((n) => `--sb-radius-${n}`)];
    for (const property of touched) root.style.removeProperty(property);
    radius.value = '8';
    color.value = color.getAttribute('value');
    showRadius();
    try {
      localStorage.removeItem(KEY);
    } catch (e) {} // eslint-disable-line no-empty -- storage can be unavailable
  });
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) {
      color.value = saved.primary;
      radius.value = saved.radius;
    }
  } catch (e) {} // eslint-disable-line no-empty -- unreadable saved state: keep the defaults
  showRadius();
}
