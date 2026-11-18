// GENERATED from Breadcrumb.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const breadcrumbStyles = css`
:host([hidden]) {
  display: none;
}

:host(sb-breadcrumb) {
  display: block;
  font-family: var(--sb-breadcrumb-font-family);
}

:host(sb-breadcrumb-list) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sb-breadcrumb-gap);
  color: var(--sb-breadcrumb-fg);
  font-size: var(--sb-breadcrumb-font-size);
  font-weight: var(--sb-breadcrumb-font-weight);
  line-height: var(--sb-breadcrumb-line-height);
  overflow-wrap: break-word;
}
@media (min-width: 40em) {
  :host(sb-breadcrumb-list) {
    gap: var(--sb-breadcrumb-gap-wide);
  }
}

:host(sb-breadcrumb-item) {
  display: inline-flex;
  align-items: center;
  gap: var(--sb-breadcrumb-gap);
}

:host(sb-breadcrumb-separator) {
  display: inline-flex;
  align-items: center;
}

:host(sb-breadcrumb-separator) svg:dir(rtl) {
  transform: scaleX(-1);
}

:host(sb-breadcrumb-separator) ::slotted(svg),
:host(sb-breadcrumb-separator) svg {
  width: var(--sb-breadcrumb-separator-size);
  height: var(--sb-breadcrumb-separator-size);
}

[part=link] {
  border-radius: var(--sb-breadcrumb-focus-ring-radius);
  color: inherit;
  text-decoration: none;
  transition-property: color, box-shadow;
  transition-duration: var(--sb-breadcrumb-transition-duration);
  transition-timing-function: var(--sb-breadcrumb-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=link] {
    transition: none;
    animation: none;
  }
}
[part=link]:hover {
  color: var(--sb-breadcrumb-link-fg-hover);
}
[part=link]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-breadcrumb-focus-ring-width) var(--sb-breadcrumb-focus-ring-color);
}
@media (forced-colors: active) {
  [part=link]:focus-visible {
    outline: var(--sb-breadcrumb-focus-ring-width) solid CanvasText;
  }
}

[part=page] {
  color: var(--sb-breadcrumb-fg-current);
}

:host(sb-breadcrumb-ellipsis) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--sb-breadcrumb-ellipsis-size);
  height: var(--sb-breadcrumb-ellipsis-size);
}

[part=icon] {
  display: inline-flex;
  width: var(--sb-breadcrumb-ellipsis-icon-size);
  height: var(--sb-breadcrumb-ellipsis-icon-size);
}

[part=icon] svg {
  width: 100%;
  height: 100%;
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
