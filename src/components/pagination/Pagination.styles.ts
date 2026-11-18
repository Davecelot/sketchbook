// GENERATED from Pagination.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const paginationStyles = css`
:host {
  display: block;
  font-family: var(--sb-pagination-font-family);
}

:host([hidden]) {
  display: none;
}

[part=nav] {
  display: flex;
  justify-content: center;
  width: 100%;
}

:host(sb-pagination-content) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--sb-pagination-gap);
}

:host(sb-pagination-item),
:host(sb-pagination-link),
:host(sb-pagination-previous),
:host(sb-pagination-next),
:host(sb-pagination-ellipsis) {
  display: block;
}

[part=link] {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sb-pagination-link-gap);
  min-width: var(--sb-pagination-link-size);
  height: var(--sb-pagination-link-size);
  margin: 0;
  padding: 0;
  border: var(--sb-pagination-link-border-width) solid transparent;
  border-radius: var(--sb-pagination-link-radius);
  background: transparent;
  color: var(--sb-pagination-link-fg);
  font-size: var(--sb-pagination-font-size);
  font-weight: var(--sb-pagination-font-weight);
  line-height: var(--sb-pagination-line-height);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition-property: background-color, color, box-shadow;
  transition-duration: var(--sb-pagination-transition-duration);
  transition-timing-function: var(--sb-pagination-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=link] {
    transition: none;
    animation: none;
  }
}
[part=link]:hover {
  background: var(--sb-pagination-link-hover-bg);
  color: var(--sb-pagination-link-hover-fg);
}
[part=link]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-pagination-focus-ring-width) var(--sb-pagination-focus-ring-color);
}
@media (forced-colors: active) {
  [part=link]:focus-visible {
    outline: var(--sb-pagination-focus-ring-width) solid CanvasText;
  }
}

:host([size=medium]) [part=link],
:host(sb-pagination-previous) [part=link],
:host(sb-pagination-next) [part=link] {
  padding-inline: var(--sb-pagination-link-padding-x);
}

:host([active]) [part=link] {
  border-color: var(--sb-pagination-link-active-border);
  background: var(--sb-pagination-link-active-bg);
  box-shadow: var(--sb-pagination-link-active-shadow);
}
@media (forced-colors: active) {
  :host([active]) [part=link] {
    forced-color-adjust: none;
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }
}
:host([active]) [part=link]:hover {
  background: var(--sb-pagination-link-hover-bg);
}
:host([active]) [part=link]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-pagination-focus-ring-width) var(--sb-pagination-focus-ring-color);
}
@media (forced-colors: active) {
  :host([active]) [part=link]:focus-visible {
    outline: var(--sb-pagination-focus-ring-width) solid CanvasText;
  }
}

[part=icon] {
  display: inline-flex;
  flex-shrink: 0;
  width: var(--sb-pagination-link-icon-size);
  height: var(--sb-pagination-link-icon-size);
}
[part=icon]:dir(rtl) {
  transform: scaleX(-1);
}
[part=icon] svg {
  width: 100%;
  height: 100%;
}

:host(sb-pagination-ellipsis) {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sb-pagination-link-size);
  height: var(--sb-pagination-link-size);
  color: var(--sb-pagination-link-fg);
}

[part=text] {
  display: inline;
}

:host(sb-pagination-ellipsis) [part=text] {
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
