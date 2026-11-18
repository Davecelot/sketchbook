// GENERATED from Accordion.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const accordionStyles = css`
:host {
  display: block;
  font-family: var(--sb-accordion-font-family);
  font-size: var(--sb-accordion-font-size);
  color: var(--sb-accordion-fg);
}

:host([hidden]) {
  display: none;
}

:host(sb-accordion-item) {
  border-block-end: var(--sb-accordion-border-width) solid var(--sb-accordion-border);
}
:host(sb-accordion-item):last-child {
  border-block-end: 0;
}

[part=header] {
  display: flex;
  margin: 0;
}

[part=trigger] {
  display: flex;
  flex: 1;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sb-accordion-trigger-gap);
  box-sizing: border-box;
  margin: 0;
  padding-block: var(--sb-accordion-trigger-padding-y);
  padding-inline: 0;
  border: 0;
  border-radius: var(--sb-accordion-radius);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: var(--sb-accordion-trigger-font-weight);
  line-height: var(--sb-accordion-trigger-line-height);
  text-align: start;
  cursor: pointer;
}
[part=trigger]:hover:not(:disabled) {
  text-decoration: underline;
}
[part=trigger]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-accordion-focus-ring-width) var(--sb-accordion-focus-ring-color);
}
@media (forced-colors: active) {
  [part=trigger]:focus-visible {
    outline: var(--sb-accordion-focus-ring-width) solid CanvasText;
  }
}
[part=trigger]:disabled {
  opacity: var(--sb-accordion-disabled-opacity);
  cursor: not-allowed;
}

[part=chevron] {
  flex-shrink: 0;
  width: var(--sb-accordion-chevron-size);
  height: var(--sb-accordion-chevron-size);
  color: var(--sb-accordion-chevron-color);
  transition: transform var(--sb-accordion-transition-duration) var(--sb-accordion-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=chevron] {
    transition: none;
    animation: none;
  }
}
@media (forced-colors: active) {
  [part=chevron] {
    color: ButtonText;
  }
}

:host([data-state=open]) [part=chevron] {
  transform: rotate(180deg);
}

:host(sb-accordion-content) {
  visibility: hidden;
  transition: visibility var(--sb-accordion-transition-duration) var(--sb-accordion-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  :host(sb-accordion-content) {
    transition: none;
    animation: none;
  }
}

:host(sb-accordion-content[data-state=open]) {
  visibility: visible;
}

[part=content] {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--sb-accordion-transition-duration) var(--sb-accordion-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=content] {
    transition: none;
    animation: none;
  }
}

:host([data-state=open]) [part=content] {
  grid-template-rows: 1fr;
}

[part=inner] {
  min-height: 0;
  overflow: hidden;
}

[part=body] {
  padding-block-end: var(--sb-accordion-content-padding-bottom);
  line-height: var(--sb-accordion-content-line-height);
}
`;
