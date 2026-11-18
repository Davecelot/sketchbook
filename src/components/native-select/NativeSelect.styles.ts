// GENERATED from NativeSelect.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const nativeSelectStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=field] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-native-select-gap);
}

[part=label] {
  color: var(--sb-native-select-label-fg);
  font-family: var(--sb-native-select-font-family);
  font-size: var(--sb-native-select-label-font-size);
  font-weight: var(--sb-native-select-label-font-weight);
  line-height: var(--sb-native-select-label-line-height);
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

[part=control] {
  position: relative;
  display: flex;
}

[part=select] {
  appearance: none;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--sb-native-select-height);
  margin: 0;
  padding: var(--sb-native-select-padding-y) calc(var(--sb-native-select-padding-x) * 2 + var(--sb-native-select-icon-size)) var(--sb-native-select-padding-y) var(--sb-native-select-padding-x);
  border: var(--sb-native-select-border-width) solid var(--sb-native-select-border);
  border-radius: var(--sb-native-select-radius);
  background: var(--sb-native-select-bg);
  color: var(--sb-native-select-fg);
  font-family: var(--sb-native-select-font-family);
  font-size: var(--sb-native-select-font-size);
  line-height: var(--sb-native-select-line-height);
  box-shadow: var(--sb-native-select-shadow);
  cursor: pointer;
  text-overflow: ellipsis;
  transition-property: color, border-color, box-shadow;
  transition-duration: var(--sb-native-select-transition-duration);
  transition-timing-function: var(--sb-native-select-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=select] {
    transition: none;
    animation: none;
  }
}
[part=select]:focus-visible {
  border-color: var(--sb-native-select-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-native-select-focus-ring-width) var(--sb-native-select-focus-ring-color);
}
@media (forced-colors: active) {
  [part=select]:focus-visible {
    outline: var(--sb-native-select-focus-ring-width) solid CanvasText;
  }
}
[part=select][aria-invalid=true] {
  border-color: var(--sb-native-select-border-invalid);
}
[part=select][aria-invalid=true]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-native-select-focus-ring-width) var(--sb-native-select-border-invalid);
}
@media (forced-colors: active) {
  [part=select][aria-invalid=true]:focus-visible {
    outline: var(--sb-native-select-focus-ring-width) solid CanvasText;
  }
}
[part=select]:disabled {
  opacity: var(--sb-native-select-disabled-opacity);
  cursor: not-allowed;
}
[part=select] option,
[part=select] optgroup {
  background: var(--sb-native-select-option-bg);
  color: var(--sb-native-select-option-fg);
}

:host([size=small]) [part=select] {
  height: var(--sb-native-select-height-sm);
}

[part=icon] {
  position: absolute;
  top: 50%;
  right: var(--sb-native-select-padding-x);
  width: var(--sb-native-select-icon-size);
  height: var(--sb-native-select-icon-size);
  transform: translateY(-50%);
  pointer-events: none;
  fill: none;
  stroke: var(--sb-native-select-icon-fg);
  stroke-linecap: round;
  stroke-linejoin: round;
  /* sketchbook-allow-literal: stroke width is in svg user units, not a CSS length */
  stroke-width: 1.5;
}

[part=description],
[part=error] {
  margin: 0;
  font-family: var(--sb-native-select-font-family);
  font-size: var(--sb-native-select-description-font-size);
  line-height: var(--sb-native-select-description-line-height);
}

[part=description] {
  color: var(--sb-native-select-description-fg);
}

[part=error] {
  color: var(--sb-native-select-error-fg);
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
