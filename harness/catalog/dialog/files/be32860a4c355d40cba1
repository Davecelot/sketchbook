import { ContextConsumer } from '@lit/context';
import { html, LitElement, nothing, svg } from 'lit';
import { property } from 'lit/decorators.js';

import '../button/Button';
import { dialogContext } from './context';
import { tabbables, wrapTab } from '../../utils/focus-wrap';
import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-content';

const FORWARDED_ARIA = ['aria-label'];

// Lucide "x" (ISC), decorative: the button is named by closeLabel.
const x = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>`;

const linksByElement = 'ariaLabelledByElements' in Element.prototype;

export class SbDialogContent extends LitElement {
  static override styles = dialogStyles;

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ type: Boolean, reflect: true, attribute: 'hide-close-button' }) hideCloseButton = false;

  @property({ attribute: 'close-label' }) closeLabel = 'Close';

  readonly #state = new ContextConsumer(this, { context: dialogContext, subscribe: true });

  #warned = false;

  #pressedOutside = false;

  readonly #titleObserver = new MutationObserver(() => this.requestUpdate());

  #watched: HTMLElement | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#titleObserver.disconnect();
    this.#watched = null;
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  #own = (tag: string) => [...this.querySelectorAll<HTMLElement>(tag)].find((el) => el.closest(TAG) === this) ?? null;

  get #dialog() {
    return this.shadowRoot!.querySelector('dialog')!;
  }

  protected override updated() {
    const dialog = this.#dialog;
    // An ID reference can't leave this shadow root; an element reference to the light DOM above it can (SB-0009).
    if (linksByElement) {
      const title = this.#own('sb-dialog-title');
      const description = this.#own('sb-dialog-description');
      dialog.ariaLabelledByElements = title ? [title] : null;
      dialog.ariaDescribedByElements = description ? [description] : null;
    } else {
      // The title text is copied into aria-label here, so it is re-copied whenever that text changes.
      const title = this.#own('sb-dialog-title');
      if (title !== this.#watched) {
        this.#titleObserver.disconnect();
        this.#watched = title;
        if (title) this.#titleObserver.observe(title, { subtree: true, childList: true, characterData: true });
      }
    }
    const open = !!this.#state.value?.open && this.isConnected;
    // Removing a modal dialog from the document drops its modality but keeps its open attribute.
    if (open && dialog.open && !dialog.matches(':modal')) {
      dialog.close();
      dialog.showModal();
      this.#own('[autofocus]')?.focus();
    } else if (open && !dialog.open) {
      dialog.showModal();
      // The platform looks for autofocus in the dialog's own tree, which doesn't include slotted content.
      this.#own('[autofocus]')?.focus();
      this.#warnIfNameless();
    } else if (!open && dialog.open && this.isConnected) {
      // A render while detached must not close for real; re-attaching restores modality above.
      dialog.close();
    }
  }

  #warnIfNameless() {
    if (this.#warned || this.#own('sb-dialog-title') || this.getAttribute('aria-label')?.trim()) return;
    this.#warned = true;
    console.warn(`<${TAG}> has no accessible name. Add sb-dialog-title, or aria-label.`);
  }

  #name() {
    const title = this.#own('sb-dialog-title');
    if (!title) return this.getAttribute('aria-label') ?? nothing;
    return linksByElement ? nothing : (title.textContent?.trim() ?? nothing);
  }

  // Escape is handled on keydown so a control inside that uses Escape itself can keep it with preventDefault,
  // and so a prevented sb-cancel holds on every press (the platform's cancel event is cancelable only once
  // per user activation).
  #onKeydown = (e: KeyboardEvent) => {
    // Own slotted content first, then the close button, which renders after the slot.
    wrapTab(e, tabbables(this, this.shadowRoot!).filter((el) => el.getRootNode() === this.shadowRoot || el.closest(TAG) === this));
    if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
    e.preventDefault();
    this.#state.value?.dismiss();
  };

  #onCancel = (e: Event) => {
    e.preventDefault();
    this.#state.value?.dismiss();
  };

  // The platform can still close the dialog on its own (a close request that could not be cancelled).
  // The close event is queued, so one from a re-open above arrives with the dialog open again.
  #onClose = () => {
    if (!this.#dialog.open && this.#state.value?.open) this.#state.value.setOpen(false);
  };

  // Clicks on the backdrop reach the dialog element with coordinates outside its box.
  #outside = (e: MouseEvent) => {
    const dialog = this.#dialog;
    if (e.target !== dialog) return false;
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  #onPointerdown = (e: PointerEvent) => {
    this.#pressedOutside = this.#outside(e);
  };

  #onClick = (e: MouseEvent) => {
    const dismiss = this.#pressedOutside && this.#outside(e);
    this.#pressedOutside = false;
    if (dismiss) this.#state.value?.dismiss();
  };

  protected override render() {
    return html`<dialog
      part="dialog"
      aria-label=${this.#name()}
      @keydown=${this.#onKeydown}
      @cancel=${this.#onCancel}
      @close=${this.#onClose}
      @pointerdown=${this.#onPointerdown}
      @click=${this.#onClick}
    >
      <slot></slot>
      ${this.hideCloseButton
        ? nothing
        : html`<sb-button part="close" variant="ghost" size="icon-small" aria-label=${this.closeLabel} @click=${() => this.#state.value?.setOpen(false)}
            >${x}</sb-button
          >`}
    </dialog>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogContent;
  }
}
