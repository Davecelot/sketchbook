import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-label';

export class SbFieldLabel extends LitElement {
  static override styles = fieldStyles;

  @property({ reflect: true }) for: string | null = null;

  constructor() {
    super();
    this.addEventListener('click', this.#forwardClick);
  }

  // The label can't be a native <label>: its `for` would be looked up inside this shadow root.
  #forwardClick = () => {
    const root = this.getRootNode() as Document | ShadowRoot;
    const control = this.for ? root.getElementById?.(this.for) : null;
    if (!(control instanceof HTMLElement) || (control as HTMLInputElement).disabled) return;
    if (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) control.click();
    else control.focus();
  };

  protected override render() {
    return html`<span part="label"><slot></slot></span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldLabel);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldLabel;
  }
}
