import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { RelinkController } from '../../controllers/relink';
import { tabsContext } from './context';
import { tabsStyles } from './Tabs.styles';

const TAG = 'sb-tabs';

/** Switches between panels of related content with a list of tabs. */
export class SbTabs extends LitElement {
  static override styles = tabsStyles;

  @property({ reflect: true }) value = '';

  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ reflect: true }) activation: 'automatic' | 'manual' = 'automatic';

  readonly #provider = new ContextProvider(this, { context: tabsContext });

  #owned = (tag: string, value: string) =>
    [...this.querySelectorAll<HTMLElement>(tag)].find((el) => el.closest('sb-tabs') === this && el.getAttribute('value') === value) ?? null;

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('value') || changed.has('orientation') || changed.has('activation') || !this.#provider.value) {
      this.#provider.setValue(
        {
          value: this.value,
          orientation: this.orientation,
          activation: this.activation,
          select: this.#select,
          trigger: (v) => this.#owned('sb-tabs-trigger', v),
          panel: (v) => this.#owned('sb-tabs-content', v),
        },
        true,
      );
    }
  }

  #select = (value: string) => {
    if (value === this.value) return;
    this.value = value;
    this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
  };

  // A value that names no enabled tab (empty, unknown or disabled) falls back to the first enabled tab.
  #selectFirst = () => {
    const enabled = [...this.querySelectorAll<HTMLElement>('sb-tabs-trigger')].filter((el) => el.closest(TAG) === this && !el.hasAttribute('disabled'));
    if (enabled.some((el) => el.getAttribute('value') === this.value)) return;
    if (enabled[0]) this.value = enabled[0].getAttribute('value') ?? '';
  };

  // Tabs and panels point at each other with element references: re-resolve when they change.
  constructor() {
    super();
    new RelinkController(this, {
      selector: 'sb-tabs-trigger, sb-tabs-content',
      owns: (el) => el.closest(TAG) === this,
      subtree: true,
      attributes: ['value'],
    });
  }

  protected override firstUpdated() {
    this.#selectFirst();
  }

  protected override render() {
    return html`<div part="root"><slot @slotchange=${this.#selectFirst}></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTabs);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTabs;
  }
}
