import { html, LitElement } from 'lit';

import { alertStyles } from './Alert.styles';

const TAG = 'sb-alert-description';

export class SbAlertDescription extends LitElement {
  static override styles = alertStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAlertDescription);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAlertDescription;
  }
}
