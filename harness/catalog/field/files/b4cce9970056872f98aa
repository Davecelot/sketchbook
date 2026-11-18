import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { NameWarningController } from '../../controllers/name-warning';
import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-set';

export class SbFieldSet extends LitElement {
  static override styles = fieldStyles;

  @property({ reflect: true }) legend = '';

  constructor() {
    super();
    new NameWarningController(this, () => !!this.legend.trim(), 'Set legend.');
  }

  // The fieldset sits in the shadow root; an element reference may point out to the light DOM, an ID may not (SB-0009).
  #describe = () => {
    const fieldset = this.shadowRoot?.querySelector('fieldset');
    if (fieldset) fieldset.ariaDescribedByElements = [...this.querySelectorAll<HTMLElement>(':scope > sb-field-description')];
  };

  protected override render() {
    return html`<fieldset part="fieldset">
      ${this.legend ? html`<legend part="legend">${this.legend}</legend>` : nothing}
      <slot @slotchange=${this.#describe}></slot>
    </fieldset>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldSet);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldSet;
  }
}
