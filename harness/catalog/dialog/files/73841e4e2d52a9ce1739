import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { RelinkController } from '../../controllers/relink';
import { dialogContext } from './context';
import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog';

// A native modal dialog does not stop the page behind from scrolling. Counted so nested dialogs keep
// the lock until the last one closes; the author's own inline values come back afterwards.
let locks = 0;
let saved = { overflow: '', scrollbarGutter: '' };

const lockScroll = () => {
  if (locks++ > 0) return;
  const { style } = document.documentElement;
  saved = { overflow: style.overflow, scrollbarGutter: style.scrollbarGutter };
  style.overflow = 'hidden';
  style.scrollbarGutter = 'stable';
};

const unlockScroll = () => {
  if (--locks > 0) return;
  const { style } = document.documentElement;
  style.overflow = saved.overflow;
  style.scrollbarGutter = saved.scrollbarGutter;
};

export class SbDialog extends LitElement {
  static override styles = dialogStyles;

  @property({ type: Boolean, reflect: true }) open = false;

  readonly #provider = new ContextProvider(this, { context: dialogContext });

  #locked = false;

  // The content links its title and description by element reference: re-resolve when either is added or removed.
  constructor() {
    super();
    new RelinkController(this, {
      selector: 'sb-dialog-content',
      owns: (el) => el.closest(TAG) === this,
      subtree: true,
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.#setLock(this.open);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#setLock(false);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('open') || !this.#provider.value) {
      this.#provider.setValue({ open: this.open, setOpen: this.#setOpen, dismiss: this.#dismiss }, true);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has('open')) return;
    this.#setLock(this.open && this.isConnected);
    if (changed.get('open') !== undefined) this.dispatchEvent(new Event('sb-toggle', { bubbles: true, composed: true }));
  }

  #setLock(lock: boolean) {
    if (lock === this.#locked) return;
    this.#locked = lock;
    if (lock) lockScroll();
    else unlockScroll();
  }

  #setOpen = (open: boolean) => {
    this.open = open;
  };

  #dismiss = () => {
    if (this.dispatchEvent(new Event('sb-cancel', { bubbles: true, composed: true, cancelable: true }))) this.open = false;
  };

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialog);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialog;
  }
}
