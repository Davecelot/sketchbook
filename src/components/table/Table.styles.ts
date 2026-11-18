// GENERATED from Table.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const tableStyles = css`
:host {
  display: block;
  font-family: var(--sb-table-font-family);
  font-size: var(--sb-table-font-size);
  line-height: var(--sb-table-line-height);
}

:host([hidden]) {
  display: none;
}

:host(sb-table) {
  display: table;
  width: 100%;
  border-collapse: collapse;
  caption-side: bottom;
}

:host(sb-table-header) {
  display: table-header-group;
}

:host(sb-table-body) {
  display: table-row-group;
}

:host(sb-table-footer) {
  display: table-footer-group;
  border-block-start: var(--sb-table-border-width) solid var(--sb-table-border);
  background: color-mix(in oklab, var(--sb-table-footer-bg) 50%, transparent);
  font-weight: var(--sb-table-footer-font-weight);
}

::slotted(sb-table-row) {
  border-block-end: var(--sb-table-border-width) solid var(--sb-table-border);
}

:host(sb-table-body) ::slotted(sb-table-row:last-child),
:host(sb-table-footer) ::slotted(sb-table-row:last-child) {
  border-block-end: 0;
}

:host(sb-table-row) {
  display: table-row;
  transition: background-color var(--sb-table-transition-duration) var(--sb-table-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  :host(sb-table-row) {
    transition: none;
  }
}

:host(sb-table-row:hover) {
  background: color-mix(in oklab, var(--sb-table-row-hover-bg) 50%, transparent);
}

:host(sb-table-row[selected]) {
  background: var(--sb-table-row-selected-bg);
  outline: var(--sb-table-border-width) solid var(--sb-table-row-selected-border);
  outline-offset: calc(-1 * var(--sb-table-border-width));
}
@media (forced-colors: active) {
  :host(sb-table-row[selected]) {
    outline: medium solid Highlight;
    /* sketchbook-allow-literal: inset by the outline's own width (medium = 3px) so the table edge doesn't clip its sides */
    outline-offset: -3px;
  }
}

:host(sb-table-head) {
  display: table-cell;
  height: var(--sb-table-head-height);
  padding-inline: var(--sb-table-head-padding-x);
  color: var(--sb-table-head-fg);
  font-weight: var(--sb-table-head-font-weight);
  text-align: start;
  vertical-align: middle;
  white-space: nowrap;
}

:host(sb-table-cell) {
  display: table-cell;
  padding: var(--sb-table-cell-padding);
  color: var(--sb-table-cell-fg);
  vertical-align: middle;
  white-space: nowrap;
}

:host(sb-table-caption) {
  display: table-caption;
  caption-side: bottom;
  padding-block-start: var(--sb-table-caption-margin);
  color: var(--sb-table-caption-fg);
  text-align: center;
}
`;
