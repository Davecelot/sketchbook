// GENERATED from Progress.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const progressStyles = css`
@keyframes slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(250%);
  }
}
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=track] {
  box-sizing: border-box;
  width: 100%;
  height: var(--sb-progress-height);
  overflow: hidden;
  border-radius: var(--sb-progress-radius);
  background: color-mix(in oklab, var(--sb-progress-track-bg) 20%, transparent);
}
@media (forced-colors: active) {
  [part=track] {
    outline: thin solid CanvasText;
  }
}

[part=indicator] {
  width: var(--_fill, 0%);
  height: 100%;
  border-radius: inherit;
  background: var(--sb-progress-indicator-bg);
  transition: width var(--sb-progress-transition-duration) var(--sb-progress-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=indicator] {
    transition: none;
  }
}
@media (forced-colors: active) {
  [part=indicator] {
    background: Highlight;
  }
}

:host([data-indeterminate]) [part=indicator] {
  width: 40%;
  transition: none;
  animation: slide var(--sb-progress-loop-duration) var(--sb-progress-transition-easing) infinite;
}
@media (prefers-reduced-motion: reduce) {
  :host([data-indeterminate]) [part=indicator] {
    animation: none;
  }
}
`;
