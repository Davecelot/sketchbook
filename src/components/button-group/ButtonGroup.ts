import type { PropertyValues } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { NameWarningController } from '../../controllers/name-warning';
import { buttonGroupStyles } from './ButtonGroup.styles';
import './ButtonGroupSeparator';
import './ButtonGroupText';

const TAG = 'sb-button-group';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

export class SbButtonGroup extends LitElement {
  static override styles = buttonGroupStyles;

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  constructor() {
    super();
    new NameWarningController(this);
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  #syncChildren = () => {
    const children = [...this.children];
    children.forEach((child, i) => {
      const separator = (el?: Element) => el?.localName === 'sb-button-group-separator';
      child.setAttribute('data-position', children.length === 1 ? 'only' : i === 0 ? 'first' : i === children.length - 1 ? 'last' : 'middle');
      child.setAttribute('data-orientation', this.orientation);
      child.toggleAttribute('data-overlap', i > 0 && !separator(child) && !separator(children[i - 1]));
    });
  };

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('orientation')) this.#syncChildren();
  }

  protected override render() {
    return html`<div part="group" role="group" aria-label=${this.getAttribute('aria-label') ?? nothing} data-orientation=${this.orientation}>
      <slot @slotchange=${this.#syncChildren}></slot>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbButtonGroup;
  }
}
