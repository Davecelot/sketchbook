import { html, LitElement } from 'lit';

import { avatarStyles } from './Avatar.styles';

const TAG = 'sb-avatar-group';

export class SbAvatarGroup extends LitElement {
  static override styles = avatarStyles;

  #sizes = new MutationObserver(() => this.#syncSize());

  #syncSize = () => {
    const sizes = [...this.children].filter((el) => el.localName === 'sb-avatar').map((el) => el.getAttribute('size') ?? 'medium');
    this.setAttribute('data-size', sizes.includes('large') ? 'large' : sizes.includes('small') ? 'small' : 'medium');
  };

  override connectedCallback() {
    super.connectedCallback();
    // Avatars reflect size asynchronously, so changes are watched as well as slotchange.
    this.#sizes.observe(this, { attributes: true, attributeFilter: ['size'], subtree: true });
    this.#syncSize();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#sizes.disconnect();
  }

  protected override render() {
    return html`<slot @slotchange=${this.#syncSize}></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAvatarGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAvatarGroup;
  }
}
