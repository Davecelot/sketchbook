import { html, LitElement } from 'lit';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-group';

export class SbFieldGroup extends LitElement {
  static override styles = fieldStyles;

  protected override render() {
    return html`<div part="group"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldGroup;
  }
}
