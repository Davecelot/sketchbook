import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { fieldStyles } from './Field.styles';
import './FieldContent';
import './FieldDescription';
import './FieldError';
import './FieldGroup';
import './FieldLabel';
import './FieldSeparator';
import './FieldSet';
import './FieldTitle';

const TAG = 'sb-field';

let nextId = 0;
const ensureId = (el: Element, prefix: string) => {
  if (!el.id) el.id = `${prefix}-${++nextId}`;
  return el.id;
};

// Replaces the ids this field wrote last time with the current ones, keeping any the author set.
const merge = (el: Element, attr: string, previous: string[], next: string[]) => {
  const kept = (el.getAttribute(attr) ?? '').split(/\s+/).filter((id) => id && !previous.includes(id) && !next.includes(id));
  const all = [...kept, ...next];
  if (all.length) el.setAttribute(attr, all.join(' '));
  else el.removeAttribute(attr);
  return next;
};

export class SbField extends LitElement {
  static override styles = fieldStyles;

  @property({ reflect: true }) orientation: 'vertical' | 'horizontal' = 'vertical';

  @property({ reflect: true }) validation: 'none' | 'error' = 'none';

  readonly #observer = new MutationObserver(() => this.#wire());

  override connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this, { subtree: true, childList: true, characterData: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  // ID references can't cross shadow roots, so the field wires its own native control: the label,
  // description and error are light-DOM siblings in the same tree as the control.
  #wire = () => {
    const part = (tag: string) => this.querySelector<HTMLElement>(tag);
    for (const el of this.querySelectorAll('sb-field-label, sb-field-description, sb-field-error, sb-field-title')) el.toggleAttribute('data-invalid', this.validation === 'error');
    const control = part('input, select, textarea');
    if (!control) return;
    const label = part('sb-field-label');
    if (label) label.setAttribute('for', ensureId(control, 'sb-field-control'));
    this.#ownedLabel = merge(control, 'aria-labelledby', this.#ownedLabel, label ? [ensureId(label, 'sb-field-label')] : []);
    const error = part('sb-field-error');
    const described = [part('sb-field-description'), error?.textContent?.trim() ? error : null].filter((el): el is HTMLElement => !!el);
    this.#ownedDescription = merge(control, 'aria-describedby', this.#ownedDescription, described.map((el) => ensureId(el, 'sb-field-text')));
    if (this.validation === 'error' && !control.hasAttribute('aria-invalid')) {
      control.setAttribute('aria-invalid', 'true');
      this.#ownsInvalid = true;
    } else if (this.validation !== 'error' && this.#ownsInvalid) {
      control.removeAttribute('aria-invalid');
      this.#ownsInvalid = false;
    }
  };

  // What the field itself wrote, so an author's own references and aria-invalid survive a rewire.
  #ownedLabel: string[] = [];

  #ownedDescription: string[] = [];

  #ownsInvalid = false;

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('validation') || !changed.size || changed.has('orientation')) this.#wire();
  }

  protected override render() {
    return html`<div part="field"><slot @slotchange=${this.#wire}></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbField);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbField;
  }
}
