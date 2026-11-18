import { html, LitElement } from 'lit';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card-header';

export class SbCardHeader extends LitElement {
  static override styles = cardStyles;

  // Shadow DOM has no has-data-[slot] sibling selector, so the header marks itself for CSS.
  #syncAction = (event: Event) => {
    const assigned = (event.target as HTMLSlotElement).assignedElements();
    this.toggleAttribute('data-has-action', assigned.some((el) => el.localName === 'sb-card-action'));
  };

  protected override render() {
    return html`<slot @slotchange=${this.#syncAction}></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCardHeader);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCardHeader;
  }
}
