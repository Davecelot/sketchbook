import { ContextProvider } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { avatarStyles } from './Avatar.styles';
import type { AvatarImageStatus } from './context';
import { avatarContext } from './context';

const TAG = 'sb-avatar';

export type AvatarSize = 'medium' | 'small' | 'large';

export class SbAvatar extends LitElement {
  static override styles = avatarStyles;

  @property({ reflect: true }) size: AvatarSize = 'medium';

  #report = (status: AvatarImageStatus) => {
    this.setAttribute('data-image-status', status);
    this.#provider.setValue({ status, report: this.#report }, true);
  };

  #provider = new ContextProvider(this, { context: avatarContext, initialValue: { status: 'idle', report: this.#report } });

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('data-image-status')) this.setAttribute('data-image-status', 'idle');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAvatar);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAvatar;
  }
}
