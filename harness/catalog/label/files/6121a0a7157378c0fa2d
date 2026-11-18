import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { labelStyles } from './Label.styles';

const TAG = 'sb-label';

const LABELABLE = 'input:not([type="hidden"]), select, textarea, button, meter, progress, output';
const INTERACTIVE = 'a[href], button, input, select, textarea, label, summary, [role="button"], [role="link"]';
const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|datetime-local|month|week|time)$/;

let counter = 0;

const isLabelable = (el: Element) => el.matches(LABELABLE) || (el.constructor as { formAssociated?: boolean }).formAssociated === true;

/** A stand-alone label; see the contract for how it reaches its control. */
export class SbLabel extends LitElement {
  static override styles = labelStyles;

  @property({ attribute: 'for' }) htmlFor = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  #wired: Element | null = null;

  constructor() {
    super();
    this.addEventListener('click', this.#handleClick);
  }

  override connectedCallback() {
    super.connectedCallback();
    // The control may be parsed after the label, so resolve again once the document has settled.
    requestAnimationFrame(() => this.#wire());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#unwire();
  }

  #target() {
    if (this.htmlFor) {
      const root = this.getRootNode() as Document | ShadowRoot;
      return root.getElementById?.(this.htmlFor) ?? null;
    }
    return [...this.querySelectorAll('*')].find(isLabelable) ?? null;
  }

  #unwire() {
    if (!this.#wired) return;
    const rest = (this.#wired.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter((id) => id && id !== this.id);
    if (rest.length) this.#wired.setAttribute('aria-labelledby', rest.join(' '));
    else this.#wired.removeAttribute('aria-labelledby');
    this.#wired = null;
  }

  #wire() {
    if (!this.isConnected) return;
    const target = this.#target();
    if (target === this.#wired) return;
    this.#unwire();
    if (!target) return;
    if (!this.id) this.id = `${TAG}-${++counter}`;
    const ids = (target.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(this.id)) target.setAttribute('aria-labelledby', [...ids, this.id].join(' '));
    this.#wired = target;
  }

  #handleClick = (event: MouseEvent) => {
    if (this.disabled || event.defaultPrevented) return;
    const path = event.composedPath();
    const inner = path.slice(0, path.indexOf(this));
    if (inner.some((node) => node instanceof Element && node.matches(INTERACTIVE))) return;
    const target = this.#target() as HTMLElement | null;
    if (!target || (target as HTMLButtonElement).disabled || target.matches(':disabled')) return;
    this.#wire();
    target.focus();
    const textual =
      target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && TEXT_INPUT.test(target.type));
    if (!textual) target.click();
  };

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('htmlFor')) this.#wire();
  }

  protected override firstUpdated() {
    this.#wire();
  }

  protected override render() {
    return html`<span part="label"><slot @slotchange=${() => this.#wire()}></slot></span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbLabel);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbLabel;
  }
}
