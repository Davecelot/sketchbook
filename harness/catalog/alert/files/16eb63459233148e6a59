import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { alertStyles } from './Alert.styles';

const TAG = 'sb-alert';

export type AlertFeedback = 'neutral' | 'danger';

export class SbAlert extends LitElement {
  static override styles = alertStyles;

  @property({ reflect: true }) feedback: AlertFeedback = 'neutral';

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  #syncSlots = () => {
    const assigned = (name: string) => this.shadowRoot?.querySelector<HTMLSlotElement>(`slot${name}`)?.assignedElements() ?? [];
    this.toggleAttribute('data-has-icon', assigned('[name="icon"]').length > 0);
    this.toggleAttribute('data-has-action', assigned(':not([name])').some((el) => el.localName === 'sb-alert-action'));
  };

  // The live region must exist, with its role, before content changes, so the role is set before first render.
  protected override willUpdate(changed: PropertyValues<this>) {
    this.#managesRole ??= !this.hasAttribute('role');
    if (this.#managesRole && changed.has('feedback')) this.setAttribute('role', this.feedback === 'danger' ? 'alert' : 'status');
  }

  protected override render() {
    return html`<slot name="icon" @slotchange=${this.#syncSlots}></slot><slot @slotchange=${this.#syncSlots}></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAlert);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAlert;
  }
}
