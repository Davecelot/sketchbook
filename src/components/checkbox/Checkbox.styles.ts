// GENERATED from Checkbox.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const checkboxStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=field] {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: var(--sb-checkbox-gap);
  row-gap: var(--sb-checkbox-content-gap);
  align-items: start;
  font-family: var(--sb-checkbox-font-family);
}

[part=control] {
  position: relative;
  display: inline-flex;
  grid-column: 1;
  grid-row: 1;
  margin-block: calc((var(--sb-checkbox-label-font-size) * var(--sb-checkbox-label-line-height) - var(--sb-checkbox-size)) / 2);
  color: var(--sb-checkbox-checked-fg);
}

[part=input] {
  appearance: none;
  box-sizing: border-box;
  width: var(--sb-checkbox-size);
  height: var(--sb-checkbox-size);
  margin: 0;
  border: var(--sb-checkbox-border-width) solid var(--sb-checkbox-border);
  border-radius: var(--sb-checkbox-radius);
  background: var(--sb-checkbox-bg);
  box-shadow: var(--sb-checkbox-shadow);
  cursor: pointer;
  transition-property: color, background-color, border-color, box-shadow;
  transition-duration: var(--sb-checkbox-transition-duration);
  transition-timing-function: var(--sb-checkbox-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=input] {
    transition: none;
    animation: none;
  }
}
[part=input]:checked, [part=input]:indeterminate {
  border-color: var(--sb-checkbox-checked-border);
  background: var(--sb-checkbox-checked-bg);
}
[part=input]:focus-visible {
  border-color: var(--sb-checkbox-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-checkbox-focus-ring-width) var(--sb-checkbox-focus-ring-color);
}
@media (forced-colors: active) {
  [part=input]:focus-visible {
    outline: var(--sb-checkbox-focus-ring-width) solid CanvasText;
  }
}
[part=input][aria-invalid=true] {
  border-color: var(--sb-checkbox-border-invalid);
}
[part=input][aria-invalid=true]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-checkbox-focus-ring-width) var(--sb-checkbox-border-invalid);
}
@media (forced-colors: active) {
  [part=input][aria-invalid=true]:focus-visible {
    outline: var(--sb-checkbox-focus-ring-width) solid CanvasText;
  }
}
[part=input]:disabled {
  opacity: var(--sb-checkbox-disabled-opacity);
  cursor: not-allowed;
}
[part=input]:checked:not(:indeterminate) ~ [data-icon=check], [part=input]:indeterminate ~ [data-icon=indeterminate] {
  display: block;
}

[data-icon] {
  position: absolute;
  inset: 0;
  display: none;
  width: 100%;
  height: 100%;
  pointer-events: none;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  /* sketchbook-allow-literal: stroke width is in svg user units, not CSS length */
  stroke-width: 2;
}

[part=label] {
  grid-column: 2;
  grid-row: 1;
  color: var(--sb-checkbox-label-fg);
  font-size: var(--sb-checkbox-label-font-size);
  font-weight: var(--sb-checkbox-label-font-weight);
  line-height: var(--sb-checkbox-label-line-height);
  cursor: pointer;
}

:host(:disabled) [part=label] {
  opacity: var(--sb-checkbox-disabled-opacity);
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
  font-size: var(--sb-checkbox-description-font-size);
  line-height: var(--sb-checkbox-description-line-height);
}

[part=description] {
  grid-row: 2;
  color: var(--sb-checkbox-description-fg);
}

[part=error] {
  grid-row: auto;
  color: var(--sb-checkbox-error-fg);
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
`;
