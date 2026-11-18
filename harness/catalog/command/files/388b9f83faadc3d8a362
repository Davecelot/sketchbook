import { html, LitElement } from 'lit';

import { commandStyles } from './Command.styles';

const TAG = 'sb-command-shortcut';

/** A keyboard shortcut hint at the end of a command item. */
export class SbCommandShortcut extends LitElement {
  static override styles = commandStyles;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute('aria-hidden', 'true');
  }

  protected override render() {
    return html`<span part="shortcut"><slot></slot></span>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandShortcut);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandShortcut;
  }
}
