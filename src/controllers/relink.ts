import type { LitElement, ReactiveController } from 'lit';

// Parts that point at each other with element references (aria-controls, aria-labelledby across a
// shadow root) resolve those references in their own update. Content or triggers added, removed or
// re-valued later would leave them stale, so this asks the owned parts to update again.

export interface RelinkOptions {
  /** Selector of the parts that hold references. */
  selector: string;
  /** Whether a matching element belongs to this host (not to a nested one). */
  owns: (el: LitElement) => boolean;
  /** Also watch descendants, not only direct children. */
  subtree?: boolean;
  /** Attributes whose change changes the pairing (for example `value`). */
  attributes?: string[];
}

export class RelinkController implements ReactiveController {
  readonly #host: LitElement;
  readonly #options: RelinkOptions;
  #queued = false;

  readonly #observer = new MutationObserver(() => {
    if (this.#queued) return;
    this.#queued = true;
    queueMicrotask(() => {
      this.#queued = false;
      this.#host.querySelectorAll<LitElement>(this.#options.selector).forEach((el) => this.#options.owns(el) && el.requestUpdate());
    });
  });

  constructor(host: LitElement, options: RelinkOptions) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  hostConnected() {
    const { subtree = false, attributes } = this.#options;
    this.#observer.observe(this.#host, { childList: true, subtree, ...(attributes ? { attributes: true, attributeFilter: attributes } : {}) });
  }

  hostDisconnected() {
    this.#observer.disconnect();
  }
}
