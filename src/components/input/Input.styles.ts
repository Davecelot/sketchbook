// GENERATED from Input.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const inputStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=field] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-input-gap);
}

[part=label] {
  color: var(--sb-input-label-fg);
  font-family: var(--sb-input-font-family);
  font-size: var(--sb-input-label-font-size);
  font-weight: var(--sb-input-label-font-weight);
  line-height: var(--sb-input-label-line-height);
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

[part=input] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--sb-input-height);
  margin: 0;
  padding: var(--sb-input-padding-y) var(--sb-input-padding-x);
  border: var(--sb-input-border-width) solid var(--sb-input-border);
  border-radius: var(--sb-input-radius);
  background: var(--sb-input-bg);
  color: var(--sb-input-fg);
  font-family: var(--sb-input-font-family);
  font-size: var(--sb-input-font-size);
  line-height: var(--sb-input-line-height);
  box-shadow: var(--sb-input-shadow);
  transition-property: color, border-color, box-shadow;
  transition-duration: var(--sb-input-transition-duration);
  transition-timing-function: var(--sb-input-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=input] {
    transition: none;
    animation: none;
  }
}
[part=input]::placeholder {
  color: var(--sb-input-placeholder);
  opacity: 1;
}
[part=input]:focus-visible {
  border-color: var(--sb-input-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-input-focus-ring-width) var(--sb-input-focus-ring-color);
}
@media (forced-colors: active) {
  [part=input]:focus-visible {
    outline: var(--sb-input-focus-ring-width) solid CanvasText;
  }
}
[part=input][aria-invalid=true] {
  border-color: var(--sb-input-border-invalid);
}
[part=input][aria-invalid=true]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-input-focus-ring-width) var(--sb-input-border-invalid);
}
@media (forced-colors: active) {
  [part=input][aria-invalid=true]:focus-visible {
    outline: var(--sb-input-focus-ring-width) solid CanvasText;
  }
}
[part=input]:disabled {
  opacity: var(--sb-input-disabled-opacity);
  cursor: not-allowed;
}

[part=description],
[part=error] {
  margin: 0;
  font-family: var(--sb-input-font-family);
  font-size: var(--sb-input-description-font-size);
  line-height: var(--sb-input-description-line-height);
}

[part=description] {
  color: var(--sb-input-description-fg);
}

[part=error] {
  color: var(--sb-input-error-fg);
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
