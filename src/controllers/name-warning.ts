import type { LitElement, ReactiveController } from 'lit';

// Groups forward only aria-label to their inner group (ID references don't cross shadow roots, SB-0009),
// so a group without it is announced with no name. Warns once per element, in every build. A host named
// another way (a field set's legend) passes its own check and hint.
export class NameWarningController implements ReactiveController {
  readonly #host: LitElement;
  readonly #named: () => boolean;
  readonly #hint: string;
  #warned = false;

  constructor(host: LitElement, named = () => !!host.getAttribute('aria-label')?.trim(), hint = 'Set aria-label.') {
    this.#host = host;
    this.#named = named;
    this.#hint = hint;
    host.addController(this);
  }

  hostUpdated() {
    if (this.#warned) return;
    // Wait a frame so an aria-label set right after creation still counts.
    requestAnimationFrame(() => {
      if (this.#warned || this.#named()) return;
      this.#warned = true;
      console.warn(`<${this.#host.localName}> has no accessible name. ${this.#hint}`);
    });
  }
}
