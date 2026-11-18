// GENERATED from Toggle.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const toggleStyles = css`
:host {
  display: inline-flex;
  vertical-align: middle;
}

:host([hidden]) {
  display: none;
}

[part=button] {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: var(--sb-toggle-gap);
  height: var(--sb-toggle-height-default);
  min-width: var(--sb-toggle-height-default);
  margin: 0;
  padding-block: 0;
  padding-inline: var(--sb-toggle-padding-x-default);
  border: var(--sb-toggle-border-width) solid transparent;
  border-radius: var(--sb-toggle-radius);
  background: transparent;
  color: var(--sb-toggle-fg);
  font-family: var(--sb-toggle-font-family);
  font-size: var(--sb-toggle-font-size);
  font-weight: var(--sb-toggle-font-weight);
  line-height: var(--sb-toggle-line-height);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition-property: background-color, color, box-shadow, opacity;
  transition-duration: var(--sb-toggle-transition-duration);
  transition-timing-function: var(--sb-toggle-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=button] {
    transition: none;
    animation: none;
  }
}
[part=button]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-toggle-focus-ring-width) var(--sb-toggle-focus-ring-color);
}
@media (forced-colors: active) {
  [part=button]:focus-visible {
    outline: var(--sb-toggle-focus-ring-width) solid CanvasText;
  }
}
[part=button]:hover:not(:disabled) {
  background: var(--sb-toggle-hover-bg);
  color: var(--sb-toggle-hover-fg);
}
[part=button]:disabled {
  opacity: var(--sb-toggle-disabled-opacity);
  cursor: not-allowed;
}

::slotted(svg) {
  flex-shrink: 0;
  width: var(--sb-toggle-icon-size);
  height: var(--sb-toggle-icon-size);
}

:host([variant=tertiary]) [part=button] {
  border-color: var(--sb-toggle-outline-border);
  box-shadow: var(--sb-toggle-outline-shadow);
}

:host([variant=tertiary]) [part=button]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-toggle-focus-ring-width) var(--sb-toggle-focus-ring-color);
}
@media (forced-colors: active) {
  :host([variant=tertiary]) [part=button]:focus-visible {
    outline: var(--sb-toggle-focus-ring-width) solid CanvasText;
  }
}

:host([variant=tertiary]) [part=button]:hover:not(:disabled) {
  background: var(--sb-toggle-outline-bg-hover);
  color: var(--sb-toggle-outline-fg-hover);
}

:host([selected]) [part=button],
:host([selected]) [part=button]:hover:not(:disabled) {
  border-color: var(--sb-toggle-on-border);
  background: var(--sb-toggle-on-bg);
  color: var(--sb-toggle-on-fg);
}
@media (forced-colors: active) {
  :host([selected]) [part=button],
  :host([selected]) [part=button]:hover:not(:disabled) {
    forced-color-adjust: none;
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }
}

:host([size=small]) [part=button] {
  height: var(--sb-toggle-height-sm);
  min-width: var(--sb-toggle-height-sm);
  padding-inline: var(--sb-toggle-padding-x-sm);
}

:host([size=large]) [part=button] {
  height: var(--sb-toggle-height-lg);
  min-width: var(--sb-toggle-height-lg);
  padding-inline: var(--sb-toggle-padding-x-lg);
}
`;
