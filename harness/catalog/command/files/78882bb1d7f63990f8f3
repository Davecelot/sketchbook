import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { commandStyles } from './Command.styles';

const TAG = 'sb-command-group';

/** A titled group of command items. */
export class SbCommandGroup extends LitElement {
  static override styles = commandStyles;

  @property() label = '';

  protected override willUpdate() {
    this.setAttribute('role', 'group');
    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
  }

  protected override render() {
    return html`<div part="group">
      ${this.label ? html`<div part="heading" aria-hidden="true">${this.label}</div>` : nothing}
      <slot></slot>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandGroup;
  }
}
