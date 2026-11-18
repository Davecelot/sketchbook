// GENERATED from Textarea.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const textareaStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=field] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-textarea-gap);
}

[part=label] {
  color: var(--sb-textarea-label-fg);
  font-family: var(--sb-textarea-font-family);
  font-size: var(--sb-textarea-label-font-size);
  font-weight: var(--sb-textarea-label-font-weight);
  line-height: var(--sb-textarea-label-line-height);
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

[part=textarea] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: block;
  min-height: var(--sb-textarea-min-height);
  resize: vertical;
  margin: 0;
  padding: var(--sb-textarea-padding-y) var(--sb-textarea-padding-x);
  border: var(--sb-textarea-border-width) solid var(--sb-textarea-border);
  border-radius: var(--sb-textarea-radius);
  background: var(--sb-textarea-bg);
  color: var(--sb-textarea-fg);
  font-family: var(--sb-textarea-font-family);
  font-size: var(--sb-textarea-font-size);
  line-height: var(--sb-textarea-line-height);
  box-shadow: var(--sb-textarea-shadow);
  transition-property: color, border-color, box-shadow;
  transition-duration: var(--sb-textarea-transition-duration);
  transition-timing-function: var(--sb-textarea-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=textarea] {
    transition: none;
    animation: none;
  }
}
[part=textarea]::placeholder {
  color: var(--sb-textarea-placeholder);
  opacity: 1;
}
[part=textarea]:focus-visible {
  border-color: var(--sb-textarea-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-textarea-focus-ring-width) var(--sb-textarea-focus-ring-color);
}
@media (forced-colors: active) {
  [part=textarea]:focus-visible {
    outline: var(--sb-textarea-focus-ring-width) solid CanvasText;
  }
}
[part=textarea][aria-invalid=true] {
  border-color: var(--sb-textarea-border-invalid);
}
[part=textarea][aria-invalid=true]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-textarea-focus-ring-width) var(--sb-textarea-border-invalid);
}
@media (forced-colors: active) {
  [part=textarea][aria-invalid=true]:focus-visible {
    outline: var(--sb-textarea-focus-ring-width) solid CanvasText;
  }
}
[part=textarea]:disabled {
  opacity: var(--sb-textarea-disabled-opacity);
  cursor: not-allowed;
}

[part=description],
[part=error] {
  margin: 0;
  font-family: var(--sb-textarea-font-family);
  font-size: var(--sb-textarea-description-font-size);
  line-height: var(--sb-textarea-description-line-height);
}

[part=description] {
  color: var(--sb-textarea-description-fg);
}

[part=error] {
  color: var(--sb-textarea-error-fg);
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
