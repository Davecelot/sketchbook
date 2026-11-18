import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { scrollAreaStyles } from './ScrollArea.styles';

const TAG = 'sb-scroll-area';

/** A region that scrolls natively, with themed scrollbars and keyboard access. */
export class SbScrollArea extends LitElement {
  static override styles = scrollAreaStyles;

  @property() label = '';

  @state() private scrollable = false;

  #warnedNoLabel = false;

  readonly #resize = new ResizeObserver(() => this.#measure());

  readonly #mutations = new MutationObserver(() => {
    this.#readAxes();
    this.#measure();
  });

  override connectedCallback() {
    super.connectedCallback();
    this.#readAxes();
    this.#mutations.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['orientation'] });
    // After a move the shadow tree is kept but firstUpdated does not run again.
    if (this.hasUpdated) this.#observeSizes();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#mutations.disconnect();
  }

  // Without sb-scroll-bar children the area scrolls vertically; with them, on exactly the axes they name.
  #readAxes() {
    const bars = [...this.querySelectorAll<HTMLElement>(':scope > sb-scroll-bar')];
    const horizontal = bars.some((bar) => bar.getAttribute('orientation') === 'horizontal');
    const vertical = !bars.length || bars.some((bar) => bar.getAttribute('orientation') !== 'horizontal');
    this.toggleAttribute('data-axis-x', horizontal);
    this.toggleAttribute('data-axis-y', vertical);
  }

  #measure() {
    const viewport = this.shadowRoot?.querySelector<HTMLElement>('[part="viewport"]');
    if (!viewport) return;
    const y = this.hasAttribute('data-axis-y') && viewport.scrollHeight > viewport.clientHeight;
    const x = this.hasAttribute('data-axis-x') && viewport.scrollWidth > viewport.clientWidth;
    this.scrollable = x || y;
  }

  #observeSizes() {
    const root = this.shadowRoot!;
    this.#resize.observe(root.querySelector('[part="viewport"]')!);
    this.#resize.observe(root.querySelector('[part="content"]')!);
  }

  protected override firstUpdated() {
    this.#observeSizes();
    this.#measure();
  }

  protected override updated() {
    if (this.scrollable && !this.label && !this.#warnedNoLabel) {
      this.#warnedNoLabel = true;
      console.warn(`<${TAG}> scrolls but has no label. Add label so keyboard users know what the region holds.`);
    }
  }

  protected override render() {
    const named = this.scrollable && this.label;
    return html`<div
      part="viewport"
      tabindex=${this.scrollable ? '0' : nothing}
      role=${named ? 'region' : nothing}
      aria-label=${named ? this.label : nothing}
    >
      <div part="content"><slot @slotchange=${() => this.#measure()}></slot></div>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbScrollArea);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbScrollArea;
  }
}
