import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { avatarStyles } from './Avatar.styles';

const TAG = 'sb-avatar-group-count';

export class SbAvatarGroupCount extends LitElement {
  static override styles = avatarStyles;

  @property() label: string | null = null;

  #namesHost = false;

  // Host ARIA is set before the first render so the name is never missing.
  protected override willUpdate() {
    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
      this.#namesHost = true;
    } else if (this.#namesHost) {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.#namesHost = false;
    }
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAvatarGroupCount);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAvatarGroupCount;
  }
}
