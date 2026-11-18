import type { ReactiveController, ReactiveControllerHost } from 'lit';

// One tab stop for a group of items, moved with the arrow keys (WAI-ARIA APG "roving tabindex").
// Generalized from a name-based radio-group navigateGroup/isTabStop: RTL-aware, skips disabled items,
// and can activate the item it moves to (selection follows focus for radios and tabs).

export type Orientation = 'horizontal' | 'vertical' | 'both';

export interface RovingFocusOptions {
  /** Items in DOM order. */
  items: () => HTMLElement[];
  orientation?: () => Orientation;
  /** Wrap from the last item to the first and back. Default true. */
  loop?: boolean;
  /** The item that should own the tab stop (e.g. the selected one); defaults to the first enabled. */
  current?: () => HTMLElement | null | undefined;
  isDisabled?: (item: HTMLElement) => boolean;
  /** Called after focus moves to an item by keyboard. */
  onMove?: (item: HTMLElement, event: KeyboardEvent) => void;
}

const isRtl = (el: Element) => getComputedStyle(el).direction === 'rtl';

export class RovingFocusController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #options: RovingFocusOptions;

  constructor(host: ReactiveControllerHost & HTMLElement, options: RovingFocusOptions) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  hostConnected() {
    this.#host.addEventListener('keydown', this.#onKeydown);
  }

  hostDisconnected() {
    this.#host.removeEventListener('keydown', this.#onKeydown);
  }

  hostUpdated() {
    this.sync();
  }

  get #enabled() {
    const disabled = this.#options.isDisabled ?? ((el: HTMLElement) => el.hasAttribute('disabled'));
    return this.#options.items().filter((el) => !disabled(el));
  }

  /** Puts the single tab stop on the current item (or the first enabled one). */
  sync() {
    const items = this.#options.items();
    const enabled = this.#enabled;
    const current = this.#options.current?.();
    const stop = current && enabled.includes(current) ? current : enabled[0];
    for (const item of items) item.tabIndex = item === stop ? 0 : -1;
  }

  focus(item: HTMLElement) {
    for (const el of this.#options.items()) el.tabIndex = el === item ? 0 : -1;
    item.focus();
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const enabled = this.#enabled;
    const from = enabled.find((el) => el === event.target || el.contains(event.target as Node) || el.shadowRoot?.contains(event.target as Node));
    if (!from) return;
    const orientation = this.#options.orientation?.() ?? 'horizontal';
    const rtl = isRtl(this.#host);
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    let step = 0;
    if ((event.key === next && orientation !== 'vertical') || (event.key === 'ArrowDown' && orientation !== 'horizontal')) step = 1;
    else if ((event.key === prev && orientation !== 'vertical') || (event.key === 'ArrowUp' && orientation !== 'horizontal')) step = -1;
    let target: HTMLElement | undefined;
    if (step) {
      const i = enabled.indexOf(from) + step;
      target = this.#options.loop === false ? enabled[Math.max(0, Math.min(enabled.length - 1, i))] : enabled.at(i % enabled.length);
    } else if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled.at(-1);
    if (!target) return;
    event.preventDefault();
    this.focus(target);
    this.#options.onMove?.(target, event);
  };
}
