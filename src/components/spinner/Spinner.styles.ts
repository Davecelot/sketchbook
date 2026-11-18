// GENERATED from Spinner.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const spinnerStyles = css`
:host {
  display: inline-flex;
  flex-shrink: 0;
  width: var(--sb-spinner-size);
  height: var(--sb-spinner-size);
}

[part=icon] {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  animation: sb-spin var(--sb-spinner-duration) var(--sb-spinner-easing) infinite;
}

@media (prefers-reduced-motion: reduce) {
  [part=icon] {
    animation-duration: calc(var(--sb-spinner-duration) * 2);
  }
}
@keyframes sb-spin {
  to {
    transform: rotate(360deg);
  }
}
[part=label] {
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
