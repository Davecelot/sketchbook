import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { safeHref } from '../../utils/safe-href';
import { itemStyles } from './Item.styles';

const TAG = 'sb-item';

export type ItemVariant = 'primary' | 'tertiary' | 'muted';
export type ItemSize = 'medium' | 'small';

export class SbItem extends LitElement {
  static override styles = itemStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property({ reflect: true }) variant: ItemVariant = 'primary';

  @property({ reflect: true }) size: ItemSize = 'medium';

  @property() href: string | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.#syncRole();
    // A description nested in a content block changes no slot assignment, so slotchange alone misses it.
    this.#content.observe(this, { childList: true, subtree: true });
    this.#syncContent();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#content.disconnect();
  }

  // The listitem role belongs to an item inside a group: set it on entering, drop it on leaving.
  // A role the author set is never touched.
  #autoRole = false;

  #syncRole() {
    const inGroup = this.parentElement?.localName === 'sb-item-group';
    if (inGroup && !this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
      this.#autoRole = true;
    } else if (!inGroup && this.#autoRole) {
      this.removeAttribute('role');
      this.#autoRole = false;
    }
  }

  #content = new MutationObserver(() => this.#syncContent());

  // Descendant and sibling rules do not cross shadow roots, so the item marks what its parts need.
  #syncContent = () => {
    this.toggleAttribute('data-has-description', this.querySelector('sb-item-description') !== null);
    for (const el of this.querySelectorAll(':scope > sb-item-content')) {
      el.toggleAttribute('data-fixed', el.previousElementSibling?.localName === 'sb-item-content');
    }
  };

  protected override render() {
    const content = html`<slot @slotchange=${this.#syncContent}></slot>`;
    return this.href
      ? html`<a part="item" href=${safeHref(this.href)}>${content}</a>`
      : html`<div part="item">${content}</div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItem;
  }
}
