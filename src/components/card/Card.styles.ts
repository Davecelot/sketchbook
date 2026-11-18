// GENERATED from Card.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const cardStyles = css`
:host([hidden]) {
  display: none;
}

:host(sb-card) {
  --_inset: var(--sb-card-padding);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  gap: var(--sb-card-gap);
  padding-block: var(--sb-card-padding);
  border: var(--sb-card-border-width) solid var(--sb-card-border);
  border-radius: var(--sb-card-radius);
  background: var(--sb-card-bg);
  color: var(--sb-card-fg);
  font-family: var(--sb-card-font-family);
  box-shadow: var(--sb-card-shadow);
}

:host(sb-card[size=small]) {
  --_inset: var(--sb-card-padding-sm);
  gap: var(--sb-card-gap-sm);
  padding-block: var(--sb-card-padding-sm);
}

:host(sb-card-header),
:host(sb-card-content),
:host(sb-card-footer) {
  padding-inline: var(--_inset, var(--sb-card-padding));
}

:host(sb-card-header) {
  display: grid;
  grid-template-rows: auto auto;
  grid-auto-rows: min-content;
  align-items: start;
  gap: var(--sb-card-header-gap);
}

:host(sb-card-header[data-has-action]) {
  grid-template-columns: 1fr auto;
}

::slotted(sb-card-action) {
  grid-column: 2;
  grid-row: 1/span 2;
  align-self: start;
  justify-self: end;
}

:host(sb-card-title) {
  display: block;
  font-size: var(--sb-card-title-font-size);
  font-weight: var(--sb-card-title-font-weight);
  line-height: var(--sb-card-title-line-height);
}

:host(sb-card-description) {
  display: block;
  color: var(--sb-card-description-fg);
  font-size: var(--sb-card-description-font-size);
  line-height: var(--sb-card-description-line-height);
}

:host(sb-card-action),
:host(sb-card-content) {
  display: block;
}

:host(sb-card-footer) {
  display: flex;
  align-items: center;
}
`;
