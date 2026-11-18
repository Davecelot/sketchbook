// GENERATED from Switch.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const switchStyles = css`
:host {
  display: block;
  --_width: var(--sb-switch-width);
  --_height: var(--sb-switch-height);
  --_thumb: var(--sb-switch-thumb-size);
}

:host([size=small]) {
  --_width: var(--sb-switch-sm-width);
  --_height: var(--sb-switch-sm-height);
  --_thumb: var(--sb-switch-sm-thumb-size);
}

:host([hidden]) {
  display: none;
}

[part=field] {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: var(--sb-switch-gap);
  row-gap: var(--sb-switch-content-gap);
  align-items: start;
  font-family: var(--sb-switch-font-family);
}

[part=control] {
  position: relative;
  display: inline-flex;
  grid-column: 1;
  grid-row: 1;
  margin-block: calc((var(--sb-switch-label-font-size) * var(--sb-switch-label-line-height) - var(--_height)) / 2);
}

[part=input] {
  appearance: none;
  box-sizing: border-box;
  width: var(--_width);
  height: var(--_height);
  margin: 0;
  border: var(--sb-switch-border-width) solid var(--sb-switch-border);
  border-radius: var(--sb-switch-radius);
  background: var(--sb-switch-track-bg);
  box-shadow: var(--sb-switch-shadow);
  cursor: pointer;
  transition-property: background-color, border-color, box-shadow;
  transition-duration: var(--sb-switch-transition-duration);
  transition-timing-function: var(--sb-switch-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=input] {
    transition: none;
    animation: none;
  }
}
[part=input]:checked {
  border-color: var(--sb-switch-checked-bg);
  background: var(--sb-switch-checked-bg);
}
[part=input]:focus-visible {
  border-color: var(--sb-switch-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-switch-focus-ring-width) var(--sb-switch-focus-ring-color);
}
@media (forced-colors: active) {
  [part=input]:focus-visible {
    outline: var(--sb-switch-focus-ring-width) solid CanvasText;
  }
}
[part=input][aria-invalid=true] {
  border-color: var(--sb-switch-border-invalid);
}
[part=input][aria-invalid=true]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-switch-focus-ring-width) var(--sb-switch-border-invalid);
}
@media (forced-colors: active) {
  [part=input][aria-invalid=true]:focus-visible {
    outline: var(--sb-switch-focus-ring-width) solid CanvasText;
  }
}
[part=input]:disabled {
  opacity: var(--sb-switch-disabled-opacity);
  cursor: not-allowed;
}
[part=input]:checked ~ [part=thumb] {
  transform: translateX(calc(var(--_width) - var(--_thumb) - 2 * var(--sb-switch-inset)));
  background: var(--sb-switch-thumb-checked-bg);
}
[part=input]:disabled ~ [part=thumb] {
  opacity: var(--sb-switch-disabled-opacity);
}

[part=thumb] {
  position: absolute;
  top: calc((var(--_height) - var(--_thumb)) / 2);
  left: var(--sb-switch-inset);
  width: var(--_thumb);
  height: var(--_thumb);
  border-radius: var(--sb-switch-radius);
  background: var(--sb-switch-thumb-bg);
  pointer-events: none;
  transition: transform var(--sb-switch-transition-duration) var(--sb-switch-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=thumb] {
    transition: none;
    animation: none;
  }
}

[part=label] {
  grid-column: 2;
  grid-row: 1;
  color: var(--sb-switch-label-fg);
  font-size: var(--sb-switch-label-font-size);
  font-weight: var(--sb-switch-label-font-weight);
  line-height: var(--sb-switch-label-line-height);
  cursor: pointer;
}

:host(:disabled) [part=label] {
  opacity: var(--sb-switch-disabled-opacity);
  cursor: not-allowed;
}

:host([hide-label]) [part=label] {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

[part=description],
[part=error] {
  grid-column: 2;
  margin: 0;
  font-size: var(--sb-switch-description-font-size);
  line-height: var(--sb-switch-description-line-height);
}

[part=description] {
  grid-row: 2;
  color: var(--sb-switch-description-fg);
}

[part=error] {
  grid-row: auto;
  color: var(--sb-switch-error-fg);
}

[part=error]:empty {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (forced-colors: active) {
  [part=thumb] {
    background: CanvasText;
  }
  [part=input]:checked {
    background: Highlight;
  }
  [part=input]:checked ~ [part=thumb] {
    background: HighlightText;
  }
}
`;
