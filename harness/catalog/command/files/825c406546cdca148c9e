import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import { commandStyles } from './Command.styles';
import type { SbCommandItem } from './CommandItem';
import { chooseItem, itemValue } from './CommandItem';
import type { CommandState } from './context';
import { commandContext } from './context';

const TAG = 'sb-command';
// 500 ms: contract.md, Accessibility (typing pause before the result count is announced).
const ANNOUNCE_DELAY_MS = 500;

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** A search field that filters a list of actions or destinations. */
export class SbCommand extends LitElement {
  static override styles = commandStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property() label = '';

  @property({ reflect: true }) filter: 'auto' | 'manual' = 'auto';

  @property({ type: Boolean, reflect: true }) loop = false;

  @property({ attribute: 'results-label' }) resultsLabel = '{count} results';

  @state() private status = '';

  #search = '';
  #active: HTMLElement | null = null;
  #announceTimer?: ReturnType<typeof setTimeout>;
  #labelCheck?: number;

  #state(): CommandState {
    return {
      label: this.label,
      active: this.#active,
      list: this.#owned<HTMLElement>('sb-command-list')[0] ?? null,
      search: this.#searchFor,
      activate: this.#activate,
    };
  }

  #owned<T extends HTMLElement>(tag: string) {
    return [...this.querySelectorAll<T>(tag)].filter((el) => el.closest(TAG) === this);
  }

  #enabled() {
    return this.#owned<SbCommandItem>('sb-command-item').filter((item) => !item.hidden && !item.disabled);
  }

  #searchFor = (text: string) => {
    const changed = text !== this.#search;
    this.#search = text;
    this.#refresh(true);
    if (!changed) return;
    clearTimeout(this.#announceTimer);
    this.#announceTimer = setTimeout(this.#announce, ANNOUNCE_DELAY_MS);
  };

  #activate = (item: HTMLElement) => {
    if (item !== this.#active && this.#enabled().includes(item as SbCommandItem)) this.#setActive(item);
  };

  // After the arrow functions above: the initial value hands them to the parts.
  readonly #provider = new ContextProvider(this, { context: commandContext, initialValue: this.#state() });

  readonly #observer = new MutationObserver(() => this.#refresh(false));

  #refresh(resetActive: boolean) {
    const items = this.#owned<SbCommandItem>('sb-command-item');
    const terms = this.filter === 'auto' ? normalize(this.#search).split(/\s+/).filter(Boolean) : [];
    for (const item of items) {
      const haystack = normalize(`${itemValue(item)} ${item.keywords ?? ''}`);
      item.hidden = !terms.every((term) => haystack.includes(term));
    }
    for (const group of this.#owned('sb-command-group')) {
      group.hidden = terms.length > 0 && ![...group.querySelectorAll<HTMLElement>('sb-command-item')].some((item) => !item.hidden);
    }
    for (const separator of this.#owned('sb-command-separator')) separator.hidden = terms.length > 0;
    const anyVisible = items.some((item) => !item.hidden);
    for (const empty of this.#owned('sb-command-empty')) empty.hidden = anyVisible;
    const enabled = this.#enabled();
    const keep = !resetActive && this.#active && enabled.includes(this.#active as SbCommandItem);
    this.#setActive(keep ? this.#active : (enabled[0] ?? null));
  }

  #setActive(item: HTMLElement | null, scroll = false) {
    this.#active = item;
    for (const el of this.#owned('sb-command-item')) {
      if (el === item) el.setAttribute('aria-selected', 'true');
      else el.removeAttribute('aria-selected');
    }
    const next = this.#state();
    const shared = this.#provider.value;
    if (next.active !== shared.active || next.list !== shared.list) this.#provider.setValue(next, true);
    if (scroll) item?.scrollIntoView({ block: 'nearest' });
  }

  #announce = () => {
    const count = this.#enabled().length;
    const empty = this.#owned('sb-command-empty').find((el) => !el.hidden);
    this.status = count === 0 && empty ? (empty.textContent ?? '').trim() : this.resultsLabel.replace('{count}', String(count));
  };

  #move(step: 1 | -1) {
    const enabled = this.#enabled();
    if (!enabled.length) return;
    const index = enabled.indexOf(this.#active as SbCommandItem);
    let next = index === -1 ? (step > 0 ? 0 : enabled.length - 1) : index + step;
    if (next < 0 || next >= enabled.length) {
      if (!this.loop) return;
      next = (next + enabled.length) % enabled.length;
    }
    const item = enabled[next];
    if (item) this.#setActive(item, true);
  }

  #onKeydown = (e: KeyboardEvent) => {
    const source = e.target as Element;
    if (source.localName !== 'sb-command-input' || source.closest(TAG) !== this) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.#move(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      if (this.#active) chooseItem(this.#active as SbCommandItem);
    }
  };

  constructor() {
    super();
    this.addEventListener('keydown', this.#onKeydown);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'value', 'keywords'], characterData: true });
    if (this.hasUpdated) this.#refresh(false);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
    clearTimeout(this.#announceTimer);
    if (this.#labelCheck !== undefined) cancelAnimationFrame(this.#labelCheck);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (this.hasUpdated && changed.has('filter')) this.#refresh(true);
    if (this.#provider.value.label !== this.label) this.#provider.setValue(this.#state(), true);
  }

  protected override firstUpdated() {
    this.#refresh(true);
    // A frame later, so a label set right after creation still counts.
    this.#labelCheck = requestAnimationFrame(() => {
      if (!this.label.trim()) console.warn(`<${TAG}> has no accessible name. Set label.`);
    });
  }

  protected override render() {
    return html`<div part="root"><slot></slot><div class="status" role="status">${this.status}</div></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommand);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommand;
  }
}
