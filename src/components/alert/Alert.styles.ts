// GENERATED from Alert.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const alertStyles = css`
:host([hidden]) {
  display: none;
}

:host(sb-alert) {
  --_cols: 0 1fr;
  display: grid;
  grid-template-columns: var(--_cols);
  align-items: start;
  box-sizing: border-box;
  width: 100%;
  row-gap: var(--sb-alert-row-gap);
  padding: var(--sb-alert-padding-y) var(--sb-alert-padding-x);
  border: var(--sb-alert-border-width) solid var(--sb-alert-border);
  border-radius: var(--sb-alert-radius);
  background: var(--sb-alert-bg);
  color: var(--sb-alert-fg);
  font-family: var(--sb-alert-font-family);
  font-size: var(--sb-alert-font-size);
  line-height: var(--sb-alert-line-height);
}

:host(sb-alert[data-has-icon]) {
  --_cols: var(--sb-alert-icon-size) 1fr;
  column-gap: var(--sb-alert-column-gap);
}

:host(sb-alert[data-has-action]) {
  --_cols: 0 1fr auto;
}

:host(sb-alert[data-has-action]:not([data-has-icon])) ::slotted(sb-alert-action) {
  margin-inline-start: var(--sb-alert-column-gap);
}

:host(sb-alert[data-has-icon][data-has-action]) {
  --_cols: var(--sb-alert-icon-size) 1fr auto;
}

:host(sb-alert[feedback=danger]) {
  --_description-fg: var(--sb-alert-destructive-fg);
  color: var(--sb-alert-destructive-fg);
}

::slotted([slot=icon]) {
  grid-column: 1;
  grid-row: 1;
  width: var(--sb-alert-icon-size);
  height: var(--sb-alert-icon-size);
  margin-top: var(--sb-alert-icon-offset);
  color: currentcolor;
}

::slotted(sb-alert-title),
::slotted(sb-alert-description) {
  grid-column: 2;
}

::slotted(sb-alert-action) {
  grid-column: 3;
  grid-row: 1/span 2;
  align-self: start;
}

:host(sb-alert-title) {
  display: block;
  font-weight: var(--sb-alert-title-font-weight);
}

:host(sb-alert-description) {
  display: grid;
  justify-items: start;
  gap: var(--sb-alert-description-gap);
  color: var(--_description-fg, var(--sb-alert-description-fg));
}

:host(sb-alert-action) {
  display: block;
}
`;
