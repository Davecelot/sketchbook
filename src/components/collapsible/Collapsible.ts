import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { RelinkController } from '../../controllers/relink';
import { collapsibleStyles } from './Collapsible.styles';
import { collapsibleContext } from './context';

const TAG = 'sb-collapsible';

/** Owns the expanded state shared by a trigger and its content. */
export class SbCollapsible extends LitElement {
  static override styles = collapsibleStyles;

  @property({ type: Boolean, reflect: true }) expanded = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #provider = new ContextProvider(this, { context: collapsibleContext });

  // The trigger's aria-controls points at the content: re-resolve when either is added or removed.
  constructor() {
    super();
    new RelinkController(this, {
      selector: 'sb-collapsible-trigger',
      owns: (el) => el.closest(TAG) === this,
      subtree: true,
    });
  }

  // The first content that belongs to this collapsible, not to one nested inside it.
  #content = () =>
    [...this.querySelectorAll<HTMLElement>('sb-collapsible-content')].find((el) => el.closest(TAG) === this) ?? null;

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('expanded') || changed.has('disabled') || !this.#provider.value) {
      this.#provider.setValue({ expanded: this.expanded, disabled: this.disabled, toggle: this.#toggle, content: this.#content }, true);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('expanded') && changed.get('expanded') !== undefined) {
      this.dispatchEvent(new Event('sb-toggle', { bubbles: true, composed: true }));
    }
  }

  #toggle = () => {
    if (!this.disabled) this.expanded = !this.expanded;
  };

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCollapsible);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCollapsible;
  }
}
