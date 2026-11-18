// A native modal dialog lets Tab leave its last control for the browser's own UI; APG modals wrap instead.
const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

export const tabbables = (...roots: ParentNode[]) =>
  roots
    .flatMap((root) => [...root.querySelectorAll<HTMLElement>('*')])
    .filter((el) => (el.shadowRoot?.delegatesFocus || el.matches(FOCUSABLE)) && el.checkVisibility({ visibilityProperty: true }) && !el.closest('[inert]'));

const deepActive = () => {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

// Focus inside a component's shadow root counts as focus on its host.
const holds = (el: HTMLElement | undefined, active: Element | null) => {
  for (let n: Node | null = active; n && el; n = n.parentNode ?? (n instanceof ShadowRoot ? n.host : null)) if (n === el) return true;
  return false;
};

export function wrapTab(e: KeyboardEvent, items: HTMLElement[]) {
  if (e.key !== 'Tab' || e.defaultPrevented || !items.length) return;
  const active = deepActive();
  const [first, last] = [items[0], items.at(-1)];
  if (e.shiftKey && holds(first, active)) {
    e.preventDefault();
    last?.focus();
  } else if (!e.shiftKey && holds(last, active)) {
    e.preventDefault();
    first?.focus();
  }
}
