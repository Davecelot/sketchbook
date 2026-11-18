import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { typographyStyles } from './Typography.styles';

const TAG = 'sb-typography';

export type TypographyKind =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'blockquote'
  | 'list'
  | 'inline-code'
  | 'lead'
  | 'large'
  | 'small'
  | 'muted';

const slot = html`<slot></slot>`;

const TEMPLATES: Record<TypographyKind, () => unknown> = {
  h1: () => html`<h1 part="text">${slot}</h1>`,
  h2: () => html`<h2 part="text">${slot}</h2>`,
  h3: () => html`<h3 part="text">${slot}</h3>`,
  h4: () => html`<h4 part="text">${slot}</h4>`,
  p: () => html`<p part="text">${slot}</p>`,
  blockquote: () => html`<blockquote part="text">${slot}</blockquote>`,
  list: () => html`<ul part="text">${slot}</ul>`,
  'inline-code': () => html`<code part="text">${slot}</code>`,
  lead: () => html`<p part="text">${slot}</p>`,
  large: () => html`<div part="text">${slot}</div>`,
  small: () => html`<small part="text">${slot}</small>`,
  muted: () => html`<p part="text">${slot}</p>`,
};

/** Styled text; the kind picks the native element. */
export class SbTypography extends LitElement {
  static override styles = typographyStyles;

  @property({ reflect: true }) kind: TypographyKind = 'p';

  protected override render() {
    return (TEMPLATES[this.kind] ?? TEMPLATES.p)();
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTypography);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTypography;
  }
}
