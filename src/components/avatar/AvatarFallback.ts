import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { avatarStyles } from './Avatar.styles';
import { avatarContext } from './context';

const TAG = 'sb-avatar-fallback';

export class SbAvatarFallback extends LitElement {
  static override styles = avatarStyles;

  @property() label: string | null = null;

  #avatar = new ContextConsumer(this, { context: avatarContext, subscribe: true });

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

  protected override updated() {
    this.toggleAttribute('hidden', this.#avatar.value?.status === 'loaded');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAvatarFallback);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAvatarFallback;
  }
}
