// GENERATED from Button.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const buttonStyles = css`
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
  gap: var(--sb-button-gap-default);
  height: var(--sb-button-height-default);
  margin: 0;
  padding-block: 0;
  padding-inline: var(--sb-button-padding-x-default);
  border: var(--sb-button-border-width) solid transparent;
  border-radius: var(--sb-button-radius);
  background: transparent;
  color: inherit;
  font-family: var(--sb-button-font-family);
  font-size: var(--sb-button-font-size);
  font-weight: var(--sb-button-font-weight);
  line-height: var(--sb-button-line-height);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition-property: background-color, color, box-shadow, opacity;
  transition-duration: var(--sb-button-transition-duration);
  transition-timing-function: var(--sb-button-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=button] {
    transition: none;
    animation: none;
  }
}
[part=button]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-button-focus-ring-width) var(--sb-button-focus-ring-color);
}
@media (forced-colors: active) {
  [part=button]:focus-visible {
    outline: var(--sb-button-focus-ring-width) solid CanvasText;
  }
}

[part=leading-icon],
[part=label],
[part=trailing-icon] {
  display: contents;
}

::slotted(svg),
sb-spinner {
  flex-shrink: 0;
  width: var(--sb-button-icon-size);
  height: var(--sb-button-icon-size);
  --sb-spinner-size: var(--sb-button-icon-size);
}

:host([variant=primary]) [part=button] {
  background: var(--sb-button-default-bg);
  color: var(--sb-button-default-fg);
}

:host([variant=primary]) [part=button]:hover:not(:disabled, [aria-disabled=true]) {
  background: color-mix(in oklab, var(--sb-button-default-bg) 90%, transparent);
}

:host([variant=destructive]) [part=button] {
  background: var(--sb-button-destructive-bg);
  color: var(--sb-button-destructive-fg);
}

:host([variant=destructive]) [part=button]:hover:not(:disabled, [aria-disabled=true]) {
  background: color-mix(in oklab, var(--sb-button-destructive-bg) 90%, transparent);
}

:host([variant=secondary]) [part=button] {
  background: var(--sb-button-secondary-bg);
  color: var(--sb-button-secondary-fg);
}

:host([variant=secondary]) [part=button]:hover:not(:disabled, [aria-disabled=true]) {
  background: color-mix(in oklab, var(--sb-button-secondary-bg) 80%, transparent);
}

:host([variant=tertiary]) [part=button] {
  border-color: var(--sb-button-outline-border);
  background: var(--sb-button-outline-bg);
  color: var(--sb-button-outline-fg);
  box-shadow: var(--sb-button-outline-shadow);
}

:host([variant=tertiary]) [part=button]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-button-focus-ring-width) var(--sb-button-focus-ring-color);
}
@media (forced-colors: active) {
  :host([variant=tertiary]) [part=button]:focus-visible {
    outline: var(--sb-button-focus-ring-width) solid CanvasText;
  }
}

:host([variant=tertiary]) [part=button]:hover:not(:disabled, [aria-disabled=true]) {
  background: var(--sb-button-outline-bg-hover);
  color: var(--sb-button-outline-fg-hover);
}

:host([variant=ghost]) [part=button] {
  color: var(--sb-button-ghost-fg);
}

:host([variant=ghost]) [part=button]:hover:not(:disabled, [aria-disabled=true]) {
  background: var(--sb-button-ghost-bg-hover);
  color: var(--sb-button-ghost-fg-hover);
}

:host([variant=link]) [part=button] {
  color: var(--sb-button-link-fg);
  text-underline-offset: var(--sb-button-link-underline-offset);
}

:host([variant=link]) [part=button]:hover:not(:disabled, [aria-disabled=true]) {
  text-decoration-line: underline;
}

:host([size=tiny]) [part=button] {
  gap: var(--sb-button-gap-xs);
  height: var(--sb-button-height-xs);
  padding-inline: var(--sb-button-padding-x-xs);
  font-size: var(--sb-button-font-size-xs);
}

:host([size=small]) [part=button] {
  gap: var(--sb-button-gap-sm);
  height: var(--sb-button-height-sm);
  padding-inline: var(--sb-button-padding-x-sm);
}

:host([size=large]) [part=button] {
  height: var(--sb-button-height-lg);
  padding-inline: var(--sb-button-padding-x-lg);
}

:host([data-has-icon]) [part=button] {
  padding-inline: var(--sb-button-padding-x-icon-default);
}

:host([data-has-icon][size=tiny]) [part=button] {
  padding-inline: var(--sb-button-padding-x-icon-xs);
}

:host([data-has-icon][size=small]) [part=button] {
  padding-inline: var(--sb-button-padding-x-icon-sm);
}

:host([data-has-icon][size=large]) [part=button] {
  padding-inline: var(--sb-button-padding-x-icon-lg);
}

:host([size=tiny]),
:host([size=icon-tiny]) {
  --sb-button-icon-size: var(--sb-button-icon-size-xs);
}

:host([size^=icon]) [part=button] {
  width: var(--sb-button-height-default);
  height: var(--sb-button-height-default);
  padding: 0;
}

:host([size=icon-tiny]) [part=button] {
  width: var(--sb-button-height-xs);
  height: var(--sb-button-height-xs);
}

:host([size=icon-small]) [part=button] {
  width: var(--sb-button-height-sm);
  height: var(--sb-button-height-sm);
}

:host([size=icon-large]) [part=button] {
  width: var(--sb-button-height-lg);
  height: var(--sb-button-height-lg);
}

:host([disabled]) [part=button],
:host([loading]) [part=button] {
  opacity: var(--sb-button-disabled-opacity);
}

:host([disabled]) [part=button] {
  cursor: not-allowed;
}

:host([loading]:not([disabled])) [part=button] {
  cursor: progress;
}
`;
