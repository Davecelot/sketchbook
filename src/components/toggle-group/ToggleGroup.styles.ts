// GENERATED from ToggleGroup.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const toggleGroupStyles = css`
:host {
  display: inline-flex;
}

:host([hidden]) {
  display: none;
}

[part=group] {
  display: flex;
  flex-direction: row;
  gap: calc(var(--sb-toggle-group-spacing-unit) * var(--_spacing, 0));
  border-radius: var(--sb-toggle-group-radius);
}
[part=group][data-orientation=vertical] {
  flex-direction: column;
}
[part=group][data-joined][data-variant=tertiary] {
  box-shadow: var(--sb-toggle-group-outline-shadow);
}

:host(sb-toggle-group-item) {
  display: flex;
}

:host(sb-toggle-group-item:focus-within) {
  position: relative;
}

[part=button] {
  box-sizing: border-box;
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--sb-toggle-group-gap);
  height: var(--sb-toggle-group-height-default);
  min-width: var(--sb-toggle-group-height-default);
  margin: 0;
  padding-block: 0;
  padding-inline: var(--sb-toggle-group-padding-x-default);
  border: var(--sb-toggle-group-border-width) solid transparent;
  border-radius: var(--sb-toggle-group-radius);
  background: transparent;
  color: var(--sb-toggle-group-fg);
  font-family: var(--sb-toggle-group-font-family);
  font-size: var(--sb-toggle-group-font-size);
  font-weight: var(--sb-toggle-group-font-weight);
  line-height: var(--sb-toggle-group-line-height);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition-property: background-color, color, box-shadow, opacity;
  transition-duration: var(--sb-toggle-group-transition-duration);
  transition-timing-function: var(--sb-toggle-group-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=button] {
    transition: none;
    animation: none;
  }
}
[part=button]:hover:not(:disabled) {
  background: var(--sb-toggle-group-hover-bg);
  color: var(--sb-toggle-group-hover-fg);
}
[part=button]:disabled {
  opacity: var(--sb-toggle-group-disabled-opacity);
  cursor: not-allowed;
}
[part=button][data-size=small] {
  height: var(--sb-toggle-group-height-sm);
  min-width: var(--sb-toggle-group-height-sm);
  padding-inline: var(--sb-toggle-group-padding-x-sm);
}
[part=button][data-size=large] {
  height: var(--sb-toggle-group-height-lg);
  min-width: var(--sb-toggle-group-height-lg);
  padding-inline: var(--sb-toggle-group-padding-x-lg);
}
[part=button][data-variant=tertiary] {
  border-color: var(--sb-toggle-group-outline-border);
}
[part=button][data-variant=tertiary]:hover:not(:disabled) {
  background: var(--sb-toggle-group-outline-bg-hover);
  color: var(--sb-toggle-group-outline-fg-hover);
}
[part=button][data-variant=tertiary]:not([data-joined]) {
  box-shadow: var(--sb-toggle-group-outline-shadow);
}
[part=button][data-joined] {
  border-radius: 0;
}

:host([data-pressed]) [part=button],
:host([data-pressed]) [part=button]:hover:not(:disabled) {
  border-color: var(--sb-toggle-group-on-border);
  background: var(--sb-toggle-group-on-bg);
  color: var(--sb-toggle-group-on-fg);
}
@media (forced-colors: active) {
  :host([data-pressed]) [part=button],
  :host([data-pressed]) [part=button]:hover:not(:disabled) {
    forced-color-adjust: none;
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }
}

::slotted(svg) {
  flex-shrink: 0;
  width: var(--sb-toggle-group-icon-size);
  height: var(--sb-toggle-group-icon-size);
}

:host(:not([data-position=first], [data-position=only])) [part=button][data-joined][data-variant=tertiary] {
  border-inline-start-width: 0;
}

:host(:not([data-position=first], [data-position=only])) [part=button][data-joined][data-variant=tertiary][data-orientation=vertical] {
  border-inline-start-width: var(--sb-toggle-group-border-width);
  border-block-start-width: 0;
}

:host([data-position=first]) [part=button][data-joined],
:host([data-position=only]) [part=button][data-joined] {
  border-start-start-radius: var(--sb-toggle-group-radius);
}

:host([data-position=last]) [part=button][data-joined],
:host([data-position=only]) [part=button][data-joined] {
  border-end-end-radius: var(--sb-toggle-group-radius);
}

:host([data-position=first]) [part=button][data-joined]:not([data-orientation=vertical]),
:host([data-position=only]) [part=button][data-joined] {
  border-end-start-radius: var(--sb-toggle-group-radius);
}

:host([data-position=last]) [part=button][data-joined]:not([data-orientation=vertical]),
:host([data-position=only]) [part=button][data-joined] {
  border-start-end-radius: var(--sb-toggle-group-radius);
}

:host([data-position=first]) [part=button][data-joined][data-orientation=vertical],
:host([data-position=only]) [part=button][data-joined] {
  border-start-end-radius: var(--sb-toggle-group-radius);
}

:host([data-position=last]) [part=button][data-joined][data-orientation=vertical],
:host([data-position=only]) [part=button][data-joined] {
  border-end-start-radius: var(--sb-toggle-group-radius);
}

[part=button]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-toggle-group-focus-ring-width) var(--sb-toggle-group-focus-ring-color);
}
@media (forced-colors: active) {
  [part=button]:focus-visible {
    outline: var(--sb-toggle-group-focus-ring-width) solid CanvasText;
  }
}

[part=button][data-variant=tertiary]:not([data-joined]):focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-toggle-group-focus-ring-width) var(--sb-toggle-group-focus-ring-color);
}
@media (forced-colors: active) {
  [part=button][data-variant=tertiary]:not([data-joined]):focus-visible {
    outline: var(--sb-toggle-group-focus-ring-width) solid CanvasText;
  }
}
`;
