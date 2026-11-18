import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { progressStyles } from './Progress.styles';

const TAG = 'sb-progress';

/** A bar that shows how far a task has come, or that work is under way. */
export class SbProgress extends LitElement {
  static override styles = progressStyles;

  // An empty attribute is "no value" (indeterminate), not 0.
  @property({
    converter: { fromAttribute: (v: string | null) => (v === null || v.trim() === '' ? null : Number(v)) },
  })
  value: number | null = null;

  @property({ type: Number }) max = 100;

  @property() label = '';

  #warnedNoName = false;

  // The author's own aria-label, put back when label is cleared; null while label has not been applied.
  #authorLabel: string | null | undefined;

  get #max() {
    return this.max > 0 ? this.max : 100;
  }

  get #clamped() {
    return this.value === null || Number.isNaN(this.value) ? null : Math.min(Math.max(this.value, 0), this.#max);
  }

  // The host carries the semantics, set before the first render so the bar is never exposed unnamed or value-less.
  protected override willUpdate(_changed: PropertyValues<this>) {
    const value = this.#clamped;
    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(this.#max));
    if (value === null) this.removeAttribute('aria-valuenow');
    else this.setAttribute('aria-valuenow', String(value));
    this.toggleAttribute('data-indeterminate', value === null);
    if (this.label) {
      if (this.#authorLabel === undefined) this.#authorLabel = this.getAttribute('aria-label');
      this.setAttribute('aria-label', this.label);
    } else if (this.#authorLabel !== undefined) {
      if (this.#authorLabel === null) this.removeAttribute('aria-label');
      else this.setAttribute('aria-label', this.#authorLabel);
      this.#authorLabel = undefined;
    }
    this.style.setProperty('--_fill', `${value === null ? 0 : (value / this.#max) * 100}%`);
  }

  protected override firstUpdated() {
    requestAnimationFrame(() => {
      if (this.#warnedNoName || this.label || this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby')) return;
      this.#warnedNoName = true;
      console.warn(`<${TAG}> has no accessible name. Add label, aria-label or aria-labelledby.`);
    });
  }

  protected override render() {
    return html`<div part="track"><div part="indicator"></div></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbProgress);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbProgress;
  }
}
