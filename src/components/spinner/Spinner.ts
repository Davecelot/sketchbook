import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { spinnerStyles } from './Spinner.styles';

const TAG = 'sb-spinner';

/** Shows that something is loading. Lucide `loader` icon (ISC). */
export class SbSpinner extends LitElement {
  static override styles = spinnerStyles;

  @property() label = 'Loading';

  @property({ type: Boolean, reflect: true }) decorative = false;

  // The host carries the semantics, set before the first render so a decorative spinner never
  // exposes a status, and a status is a live region from the moment it is inserted.
  protected override willUpdate() {
    if (this.decorative) {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    } else {
      this.setAttribute('role', 'status');
      this.setAttribute('aria-label', this.label);
      this.removeAttribute('aria-hidden');
    }
  }

  protected override render() {
    return html`${this.decorative ? nothing : html`<span part="label">${this.label}</span>`}<svg
      part="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSpinner);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSpinner;
  }
}
