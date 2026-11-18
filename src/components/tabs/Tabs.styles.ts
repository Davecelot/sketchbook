// GENERATED from Tabs.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const tabsStyles = css`
:host {
  display: block;
  font-family: var(--sb-tabs-font-family);
}

:host([hidden]) {
  display: none;
}

[part=root] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-tabs-gap);
}

:host([orientation=vertical]) [part=root] {
  flex-direction: row;
}

:host(sb-tabs-list) {
  display: block;
  width: fit-content;
}

[part=list] {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--sb-tabs-list-height);
  padding: var(--sb-tabs-list-padding);
  border-radius: var(--sb-tabs-list-radius);
  background: var(--sb-tabs-list-bg);
  color: var(--sb-tabs-trigger-fg);
  --_active-bg: var(--sb-tabs-trigger-active-bg);
  --_active-border: var(--sb-tabs-trigger-active-border);
  --_active-shadow: var(--sb-tabs-trigger-active-shadow);
  --_active-fg: var(--sb-tabs-trigger-active-fg);
  --_indicator-color: transparent;
}
@media (forced-colors: active) {
  [part=list] {
    --_active-bg: Highlight;
    --_active-fg: HighlightText;
    --_active-border: Highlight;
    --_active-adjust: none;
  }
}

:host([data-orientation=vertical]) [part=list] {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  height: fit-content;
}

:host([variant=line]) [part=list] {
  gap: var(--sb-tabs-list-gap-line);
  border-radius: 0;
  background: transparent;
  --_active-bg: transparent;
  --_active-border: transparent;
  --_active-shadow: none;
  --_active-fg: var(--sb-tabs-trigger-active-fg);
  --_indicator-color: var(--sb-tabs-indicator-color);
}
@media (forced-colors: active) {
  :host([variant=line]) [part=list] {
    --_active-bg: transparent;
    --_indicator-color: Highlight;
    --_active-adjust: auto;
  }
}

:host(sb-tabs-trigger) {
  display: inline-flex;
  flex: 1;
  align-self: stretch;
}

[part=trigger] {
  position: relative;
  box-sizing: border-box;
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--sb-tabs-trigger-gap);
  margin: 0;
  padding-block: var(--sb-tabs-trigger-padding-y);
  padding-inline: var(--sb-tabs-trigger-padding-x);
  border: var(--sb-tabs-trigger-border-width) solid transparent;
  border-radius: var(--sb-tabs-trigger-radius);
  background: transparent;
  color: var(--sb-tabs-trigger-fg);
  font-family: var(--sb-tabs-font-family);
  font-size: var(--sb-tabs-font-size);
  font-weight: var(--sb-tabs-font-weight);
  line-height: var(--sb-tabs-line-height);
  white-space: nowrap;
  cursor: pointer;
  transition-property: color, background-color, box-shadow;
  transition-duration: var(--sb-tabs-transition-duration);
  transition-timing-function: var(--sb-tabs-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=trigger] {
    transition: none;
    animation: none;
  }
}
[part=trigger]::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: var(--sb-tabs-indicator-width);
  background: var(--_indicator-color);
  opacity: 0;
}
[part=trigger]:hover:not(:disabled) {
  color: var(--sb-tabs-trigger-active-fg);
}
[part=trigger]:disabled {
  opacity: var(--sb-tabs-disabled-opacity);
  cursor: not-allowed;
}
[part=trigger] ::slotted(svg) {
  flex-shrink: 0;
  width: var(--sb-tabs-trigger-icon-size);
  height: var(--sb-tabs-trigger-icon-size);
}

:host([data-orientation=vertical]) [part=trigger] {
  justify-content: flex-start;
}
:host([data-orientation=vertical]) [part=trigger]::after {
  inset-inline: auto 0;
  inset-block: 0;
  width: var(--sb-tabs-indicator-width);
  height: auto;
}

:host([data-state=active]) [part=trigger] {
  border-color: var(--_active-border);
  background: var(--_active-bg);
  color: var(--_active-fg);
  box-shadow: var(--_active-shadow);
}
@media (forced-colors: active) {
  :host([data-state=active]) [part=trigger] {
    forced-color-adjust: var(--_active-adjust, auto);
  }
}
:host([data-state=active]) [part=trigger]::after {
  opacity: 1;
}

:host([data-state]) [part=trigger]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-tabs-focus-ring-width) var(--sb-tabs-focus-ring-color);
}
@media (forced-colors: active) {
  :host([data-state]) [part=trigger]:focus-visible {
    outline: var(--sb-tabs-focus-ring-width) solid CanvasText;
  }
}

:host(sb-tabs-content) {
  flex: 1;
  border-radius: var(--sb-tabs-trigger-radius);
  outline: none;
}

:host(sb-tabs-content:not([data-state=active])) {
  display: none;
}

:host(sb-tabs-content:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 var(--sb-tabs-focus-ring-width) var(--sb-tabs-focus-ring-color);
}
@media (forced-colors: active) {
  :host(sb-tabs-content:focus-visible) {
    outline: var(--sb-tabs-focus-ring-width) solid CanvasText;
  }
}
`;
