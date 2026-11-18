import { html, LitElement } from 'lit';

import { alertStyles } from './Alert.styles';

const TAG = 'sb-alert-action';

export class SbAlertAction extends LitElement {
  static override styles = alertStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAlertAction);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAlertAction;
  }
}
