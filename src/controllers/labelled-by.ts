import type { ReactiveController, ReactiveControllerHost } from 'lit';

// Names a host after another element. An element reference on the host's internals reaches across
// shadow roots where an ID can't (SB-0009). Without that property the source text is copied into
// aria-label and kept current while it changes. An author's aria-label or aria-labelledby wins.
export class LabelledByController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #internals: ElementInternals;
  readonly #find: () => HTMLElement | null | undefined;
  readonly #observer = new MutationObserver(() => this.#copy());
  #source: HTMLElement | null = null;
  #ownsLabel = false;

  constructor(host: ReactiveControllerHost & HTMLElement, internals: ElementInternals, find: () => HTMLElement | null | undefined) {
    this.#host = host;
    this.#internals = internals;
    this.#find = find;
    host.addController(this);
  }

  hostConnected() {
    this.sync();
  }

  hostUpdated() {
    this.sync();
  }

  hostDisconnected() {
    this.#observer.disconnect();
    this.#source = null;
  }

  sync() {
    const source = this.#find() ?? null;
    if ('ariaLabelledByElements' in this.#internals) {
      this.#internals.ariaLabelledByElements = source ? [source] : null;
      return;
    }
    if (source !== this.#source) {
      this.#observer.disconnect();
      this.#source = source;
      if (source) this.#observer.observe(source, { subtree: true, childList: true, characterData: true });
    }
    this.#copy();
  }

  #copy() {
    const host = this.#host;
    if (!this.#ownsLabel && (host.hasAttribute('aria-label') || host.hasAttribute('aria-labelledby'))) return;
    const text = this.#source?.textContent?.trim();
    if (text) host.setAttribute('aria-label', text);
    else if (this.#ownsLabel) host.removeAttribute('aria-label');
    this.#ownsLabel = !!text;
  }
}
