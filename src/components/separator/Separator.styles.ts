// GENERATED from Separator.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const separatorStyles = css`
:host {
  display: block;
  flex-shrink: 0;
  width: 100%;
  height: var(--sb-separator-thickness);
}

:host([hidden]) {
  display: none;
}

:host([orientation=vertical]) {
  align-self: stretch;
  width: var(--sb-separator-thickness);
  height: 100%;
}

[part=line] {
  width: 100%;
  height: 100%;
  background: var(--sb-separator-color);
}
@media (forced-colors: active) {
  [part=line] {
    background: CanvasText;
  }
}
`;
