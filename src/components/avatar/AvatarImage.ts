import { ContextConsumer } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { avatarStyles } from './Avatar.styles';
import { avatarContext } from './context';

const TAG = 'sb-avatar-image';

export class SbAvatarImage extends LitElement {
  static override styles = avatarStyles;

  @property({ reflect: true }) src: string | null = null;

  @property() alt = '';

  #avatar = new ContextConsumer(this, { context: avatarContext, subscribe: true });

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#avatar.value?.report('idle');
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('src') && this.#avatar.value && this.#avatar.value.status !== 'idle') this.#avatar.value.report('idle');
  }

  protected override updated() {
    const state = this.#avatar.value;
    this.toggleAttribute('hidden', !!state && state.status !== 'loaded');
    const img = this.shadowRoot?.querySelector('img');
    // A cached image can finish before the load listener is attached.
    if (img?.complete && img.naturalWidth > 0 && state?.status === 'idle') state.report('loaded');
  }

  // With an empty alt the avatar would lose its name once the image replaces the fallback, so the fallback's label names the image.
  get #accessibleName() {
    if (this.alt) return this.alt;
    return this.parentElement?.querySelector<HTMLElement & { label: string | null }>(':scope > sb-avatar-fallback')?.label ?? '';
  }

  protected override render() {
    if (!this.src) return nothing;
    return html`<img
      part="image"
      src=${this.src}
      alt=${this.#accessibleName}
      @load=${() => this.#avatar.value?.report('loaded')}
      @error=${() => this.#avatar.value?.report('error')}
    />`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAvatarImage);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAvatarImage;
  }
}
