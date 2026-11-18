import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { aspectRatioStyles } from './AspectRatio.styles';

const TAG = 'sb-aspect-ratio';

// Accepts 1.5 or 16/9; anything that isn't a positive finite ratio becomes 1.
const parseRatio = (value: unknown) => {
  const [width, height = '1'] = String(value).split('/');
  const ratio = Number(width) / Number(height);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
};

/** Keeps its content at a fixed width-to-height ratio. */
export class SbAspectRatio extends LitElement {
  static override styles = aspectRatioStyles;

  @property({ converter: { fromAttribute: parseRatio } }) ratio = 1;

  protected override render() {
    return html`<div part="frame" style=${styleMap({ aspectRatio: String(parseRatio(this.ratio)) })}><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAspectRatio);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAspectRatio;
  }
}
