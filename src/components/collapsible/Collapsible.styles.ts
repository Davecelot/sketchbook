// GENERATED from Collapsible.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const collapsibleStyles = css`
:host {
  display: block;
  color: var(--sb-collapsible-fg);
}

:host([hidden]) {
  display: none;
}

:host(sb-collapsible-trigger) {
  display: inline-block;
}

[part=trigger] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: var(--sb-collapsible-trigger-min-size);
  min-height: var(--sb-collapsible-trigger-min-size);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--sb-collapsible-radius);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
[part=trigger]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-collapsible-focus-ring-width) var(--sb-collapsible-focus-ring-color);
}
@media (forced-colors: active) {
  [part=trigger]:focus-visible {
    outline: var(--sb-collapsible-focus-ring-width) solid CanvasText;
  }
}
[part=trigger]:disabled {
  opacity: var(--sb-collapsible-disabled-opacity);
  cursor: not-allowed;
}

[part=content] {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition-property: grid-template-rows, visibility;
  transition-duration: var(--sb-collapsible-transition-duration);
  transition-timing-function: var(--sb-collapsible-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=content] {
    transition: none;
    animation: none;
  }
}

:host([data-state=open]) [part=content] {
  grid-template-rows: 1fr;
  visibility: visible;
}

[part=inner] {
  min-height: 0;
  overflow: hidden;
}
`;
