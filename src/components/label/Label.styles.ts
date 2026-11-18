// GENERATED from Label.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const labelStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=label] {
  display: flex;
  align-items: center;
  gap: var(--sb-label-gap);
  color: var(--sb-label-fg);
  font-family: var(--sb-label-font-family);
  font-size: var(--sb-label-font-size);
  font-weight: var(--sb-label-font-weight);
  line-height: var(--sb-label-line-height);
  user-select: none;
}

::slotted(svg) {
  flex-shrink: 0;
}

:host([disabled]) [part=label] {
  opacity: var(--sb-label-disabled-opacity);
  cursor: not-allowed;
}
`;
