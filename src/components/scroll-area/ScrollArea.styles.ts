// GENERATED from ScrollArea.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const scrollAreaStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=viewport] {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: inherit;
  overflow-x: hidden;
  overflow-y: hidden;
  border-radius: inherit;
  scrollbar-width: thin;
  scrollbar-color: var(--sb-scroll-area-thumb) transparent;
  outline: none;
}
[part=viewport]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-scroll-area-focus-ring-width) var(--sb-scroll-area-focus-ring-color);
}
@media (forced-colors: active) {
  [part=viewport]:focus-visible {
    outline: var(--sb-scroll-area-focus-ring-width) solid CanvasText;
  }
}

:host([data-axis-x]) [part=viewport] {
  overflow-x: auto;
}

:host([data-axis-y]) [part=viewport] {
  overflow-y: auto;
}

:host([data-axis-x]) [part=content] {
  width: max-content;
  min-width: 100%;
}

:host(sb-scroll-bar) {
  display: none;
}
`;
