// GENERATED from InputGroup.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const inputGroupStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=group] {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--sb-input-group-height);
  border: var(--sb-input-group-border-width) solid var(--sb-input-group-border);
  border-radius: var(--sb-input-group-radius);
  background: var(--sb-input-group-bg);
  box-shadow: var(--sb-input-group-shadow);
  transition-property: border-color, box-shadow;
  transition-duration: var(--sb-input-group-transition-duration);
  transition-timing-function: var(--sb-input-group-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=group] {
    transition: none;
    animation: none;
  }
}
[part=group][data-focused] {
  border-color: var(--sb-input-group-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-input-group-focus-ring-width) var(--sb-input-group-focus-ring-color);
}
@media (forced-colors: active) {
  [part=group][data-focused] {
    outline: var(--sb-input-group-focus-ring-width) solid CanvasText;
  }
}
[part=group][data-invalid] {
  border-color: var(--sb-input-group-border-invalid);
}
[part=group][data-invalid][data-focused] {
  outline: none;
  box-shadow: 0 0 0 var(--sb-input-group-focus-ring-width) var(--sb-input-group-border-invalid);
}
@media (forced-colors: active) {
  [part=group][data-invalid][data-focused] {
    outline: var(--sb-input-group-focus-ring-width) solid CanvasText;
  }
}

[part=group][data-block] {
  flex-direction: column;
  align-items: stretch;
}

::slotted(sb-input-group-addon[align$=-start]) {
  order: -1;
}

::slotted(sb-input-group-addon[align$=-end]) {
  order: 1;
}

::slotted(sb-input) {
  --sb-input-border: transparent;
  --sb-input-border-invalid: transparent;
  --sb-input-bg: transparent;
  --sb-input-shadow: none;
  --sb-input-radius: 0;
  --sb-input-focus-ring-color: transparent;
  --sb-input-focus-ring-width: 0;
  --sb-input-height: calc(var(--sb-input-group-height) - 2 * var(--sb-input-group-border-width));
  flex: 1;
  min-width: 0;
}

::slotted(sb-textarea) {
  --sb-textarea-border: transparent;
  --sb-textarea-border-invalid: transparent;
  --sb-textarea-bg: transparent;
  --sb-textarea-shadow: none;
  --sb-textarea-radius: 0;
  --sb-textarea-focus-ring-color: transparent;
  --sb-textarea-focus-ring-width: 0;
  --sb-textarea-padding-x: var(--sb-input-group-input-padding-x);
  --sb-textarea-padding-y: var(--sb-input-group-addon-block-padding);
  flex: 1;
  min-width: 0;
}

::slotted(input),
::slotted(textarea) {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  margin: 0;
  padding-block: var(--sb-input-group-input-padding-y);
  padding-inline: var(--sb-input-group-input-padding-x);
  border: 0;
  border-radius: 0;
  outline: none;
  background: transparent;
  color: var(--sb-input-group-input-fg);
  font-family: var(--sb-input-group-input-font-family);
  font-size: var(--sb-input-group-input-font-size);
  line-height: var(--sb-input-group-input-line-height);
  box-shadow: none;
}

::slotted(input) {
  height: calc(var(--sb-input-group-height) - 2 * var(--sb-input-group-border-width));
}

::slotted(input:disabled),
::slotted(textarea:disabled) {
  opacity: var(--sb-input-group-disabled-opacity);
  cursor: not-allowed;
}

::slotted(textarea) {
  padding-block: var(--sb-input-group-addon-block-padding);
  resize: none;
}

:host(sb-input-group-addon) {
  display: flex;
}

[part=addon] {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: var(--sb-input-group-addon-gap);
  padding-block: var(--sb-input-group-addon-padding-y);
  color: var(--sb-input-group-addon-fg);
  font-family: var(--sb-input-group-addon-font-family);
  font-size: var(--sb-input-group-addon-font-size);
  font-weight: var(--sb-input-group-addon-font-weight);
  line-height: var(--sb-input-group-addon-line-height);
  cursor: text;
  user-select: none;
}

:host([align=inline-start]) [part=addon] {
  padding-inline-start: var(--sb-input-group-addon-padding-x);
}

:host([align=inline-end]) [part=addon] {
  padding-inline-end: var(--sb-input-group-addon-padding-x);
}

:host([align^=block-]) [part=addon] {
  justify-content: space-between;
  padding-inline: var(--sb-input-group-addon-padding-x);
}

:host([align=block-start]) [part=addon] {
  padding-block-start: var(--sb-input-group-addon-block-padding);
}

:host([align=block-end]) [part=addon] {
  padding-block-end: var(--sb-input-group-addon-block-padding);
}

::slotted(svg) {
  flex-shrink: 0;
  width: var(--sb-input-group-icon-size);
  height: var(--sb-input-group-icon-size);
}

:host(sb-input-group-text),
:host(sb-input-group-button) {
  display: inline-flex;
}

[part=text] {
  display: flex;
  align-items: center;
  gap: var(--sb-input-group-addon-gap);
  color: var(--sb-input-group-addon-fg);
}
`;
