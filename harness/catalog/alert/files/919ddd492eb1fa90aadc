import { html, LitElement } from 'lit';

import { alertStyles } from './Alert.styles';

const TAG = 'sb-alert-title';

export class SbAlertTitle extends LitElement {
  static override styles = alertStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAlertTitle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAlertTitle;
  }
}
