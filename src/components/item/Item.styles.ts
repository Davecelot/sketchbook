// GENERATED from Item.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const itemStyles = css`
:host([hidden]) {
  display: none;
}

:host(sb-item) {
  display: block;
  font-family: var(--sb-item-font-family);
}

[part=item] {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sb-item-gap);
  padding: var(--sb-item-padding);
  border: var(--sb-item-border-width) solid transparent;
  border-radius: var(--sb-item-radius);
  background: transparent;
  color: var(--sb-item-fg);
  font-size: var(--sb-item-font-size);
  line-height: var(--sb-item-line-height);
  text-decoration: none;
  outline: none;
  transition-property: background-color, border-color, box-shadow;
  transition-duration: var(--sb-item-transition-duration);
  transition-timing-function: var(--sb-item-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=item] {
    transition: none;
    animation: none;
  }
}

:host(sb-item[variant=tertiary]) [part=item] {
  border-color: var(--sb-item-border);
}

:host(sb-item[variant=muted]) [part=item] {
  background: color-mix(in oklab, var(--sb-item-muted-bg) 50%, transparent);
}

:host(sb-item[size=small]) [part=item] {
  gap: var(--sb-item-gap-sm);
  padding: var(--sb-item-padding-block-sm) var(--sb-item-padding-inline-sm);
}

:host(sb-item) a[part=item]:hover {
  background: color-mix(in oklab, var(--sb-item-hover-bg) 50%, transparent);
}

:host(sb-item) a[part=item]:focus-visible {
  border-color: var(--sb-item-focus-ring-color);
  outline: none;
  box-shadow: 0 0 0 var(--sb-item-focus-ring-width) var(--sb-item-focus-ring-color);
}
@media (forced-colors: active) {
  :host(sb-item) a[part=item]:focus-visible {
    outline: var(--sb-item-focus-ring-width) solid CanvasText;
  }
}

:host(sb-item-group) {
  display: flex;
  flex-direction: column;
}

:host(sb-item-separator) {
  display: block;
  height: var(--sb-item-separator-height);
  margin: 0;
  background: var(--sb-item-separator-bg);
}
@media (forced-colors: active) {
  :host(sb-item-separator) {
    background: CanvasText;
  }
}

:host(sb-item-media) {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: var(--sb-item-media-gap);
}

:host(sb-item-media[variant=icon]) {
  box-sizing: border-box;
  width: var(--sb-item-media-icon-size);
  height: var(--sb-item-media-icon-size);
  border: var(--sb-item-border-width) solid var(--sb-item-media-icon-border);
  border-radius: var(--sb-item-media-icon-radius);
  background: var(--sb-item-media-icon-bg);
  color: var(--sb-item-media-icon-fg);
}

:host(sb-item-media[variant=icon]) ::slotted(svg) {
  width: var(--sb-item-media-icon-svg-size);
  height: var(--sb-item-media-icon-svg-size);
  pointer-events: none;
}

:host(sb-item-media[variant=image]) {
  width: var(--sb-item-media-image-size);
  height: var(--sb-item-media-image-size);
  overflow: hidden;
  border-radius: var(--sb-item-media-icon-radius);
}

:host(sb-item-media[variant=image]) ::slotted(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:host(sb-item[data-has-description]) ::slotted(sb-item-media) {
  align-self: flex-start;
  translate: 0 var(--sb-item-media-offset);
}

:host(sb-item-content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--sb-item-content-gap);
}

:host(sb-item-content[data-fixed]) {
  flex: none;
}

:host(sb-item-title) {
  display: flex;
  align-items: center;
  gap: var(--sb-item-title-gap);
  width: fit-content;
  font-weight: var(--sb-item-title-font-weight);
}

:host(sb-item-description) {
  display: block;
  color: var(--sb-item-description-fg);
  line-height: var(--sb-item-description-line-height);
  text-wrap: balance;
}

:host(sb-item-description) ::slotted(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: var(--sb-item-description-link-underline-offset);
}

:host(sb-item-description) ::slotted(a:hover) {
  color: var(--sb-item-description-link-hover-fg);
}

:host(sb-item-actions) {
  display: flex;
  align-items: center;
  gap: var(--sb-item-actions-gap);
}

:host(sb-item-header),
:host(sb-item-footer) {
  display: flex;
  flex-basis: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--sb-item-row-gap);
}
`;
