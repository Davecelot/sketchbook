// GENERATED from Skeleton.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const skeletonStyles = css`
:host {
  display: block;
  flex-shrink: 0;
}

:host([hidden]) {
  display: none;
}

[part=block] {
  width: 100%;
  height: 100%;
  border-radius: var(--sb-skeleton-radius);
  background: var(--sb-skeleton-bg);
  animation: sb-skeleton-pulse calc(var(--sb-skeleton-duration) * 2) var(--sb-skeleton-easing) infinite;
}
@media (prefers-reduced-motion: reduce) {
  [part=block] {
    transition: none;
    animation: none;
  }
}
@media (forced-colors: active) {
  [part=block] {
    background: GrayText;
  }
}

@keyframes sb-skeleton-pulse {
  50% {
    opacity: var(--sb-skeleton-pulse-opacity);
  }
}
`;
