import { html, LitElement } from 'lit';

import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-description';

export class SbDialogDescription extends LitElement {
  static override styles = dialogStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogDescription);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogDescription;
  }
}
