import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { avatarStyles } from './Avatar.styles';

const TAG = 'sb-avatar-badge';

export class SbAvatarBadge extends LitElement {
  static override styles = avatarStyles;

  @property() label: string | null = null;

  protected override willUpdate() {
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAvatarBadge);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAvatarBadge;
  }
}
