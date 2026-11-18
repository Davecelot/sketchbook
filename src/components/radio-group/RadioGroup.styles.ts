// GENERATED from RadioGroup.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const radioGroupStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=group] {
  display: grid;
  gap: var(--sb-radio-group-gap);
}

:host([orientation=horizontal]) [part=group] {
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: var(--sb-radio-group-gap-horizontal);
}

:host(sb-radio-group-item) {
  display: block;
}

[part=root] {
  display: inline-flex;
  align-items: center;
  gap: var(--sb-radio-group-item-gap);
  min-height: var(--sb-radio-group-size);
  color: var(--sb-radio-group-label-fg);
  font-family: var(--sb-radio-group-label-font-family);
  font-size: var(--sb-radio-group-label-font-size);
  font-weight: var(--sb-radio-group-label-font-weight);
  line-height: var(--sb-radio-group-label-line-height);
  cursor: pointer;
}

[part=control] {
  appearance: none;
  box-sizing: border-box;
  display: grid;
  flex-shrink: 0;
  place-content: center;
  width: var(--sb-radio-group-size);
  height: var(--sb-radio-group-size);
  margin: 0;
  border: var(--sb-radio-group-border-width) solid var(--sb-radio-group-border);
  border-radius: var(--sb-radio-group-radius);
  background: var(--sb-radio-group-bg);
  box-shadow: var(--sb-radio-group-shadow);
  cursor: inherit;
  transition-property: box-shadow, opacity;
  transition-duration: var(--sb-radio-group-transition-duration);
  transition-timing-function: var(--sb-radio-group-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=control] {
    transition: none;
    animation: none;
  }
}
[part=control]::before {
  content: "";
  width: 50%;
  height: 50%;
  min-width: 50%;
  min-height: 50%;
  border-radius: inherit;
  background: transparent;
}
[part=control]:checked::before {
  background: var(--sb-radio-group-dot);
}
@media (forced-colors: active) {
  [part=control]:checked::before {
    background: CanvasText;
  }
}
[part=control]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-radio-group-focus-ring-width) var(--sb-radio-group-focus-ring-color);
}
@media (forced-colors: active) {
  [part=control]:focus-visible {
    outline: var(--sb-radio-group-focus-ring-width) solid CanvasText;
  }
}
[part=control]:disabled {
  cursor: not-allowed;
}

[part=root]:has([part=control]:disabled) {
  opacity: var(--sb-radio-group-disabled-opacity);
  cursor: not-allowed;
}
`;
