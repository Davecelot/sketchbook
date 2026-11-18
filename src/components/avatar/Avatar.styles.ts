// GENERATED from Avatar.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const avatarStyles = css`
:host([hidden]) {
  display: none;
}

:host(sb-avatar) {
  --_size: var(--sb-avatar-size);
  --_font-size: var(--sb-avatar-fallback-font-size);
  position: relative;
  display: flex;
  flex-shrink: 0;
  box-sizing: border-box;
  width: var(--_size);
  height: var(--_size);
  border-radius: var(--sb-avatar-radius);
  font-family: var(--sb-avatar-font-family);
  user-select: none;
}

:host(sb-avatar[size=small]) {
  --_size: var(--sb-avatar-size-sm);
  --_font-size: var(--sb-avatar-fallback-font-size-sm);
  --_badge-icon-display: none;
}

:host(sb-avatar[size=large]) {
  --_size: var(--sb-avatar-size-lg);
}

:host(sb-avatar-image) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--sb-avatar-radius);
}

[part=image] {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

:host(sb-avatar-fallback),
:host(sb-avatar-group-count) {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: var(--sb-avatar-radius);
  background: var(--sb-avatar-fallback-bg);
  color: var(--sb-avatar-fallback-fg);
  font-family: var(--sb-avatar-font-family);
  font-size: var(--_font-size, var(--sb-avatar-fallback-font-size));
}

:host(sb-avatar-fallback) {
  width: 100%;
  height: 100%;
}

:host(sb-avatar-badge) {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--_size, var(--sb-avatar-size)) * 0.3);
  height: calc(var(--_size, var(--sb-avatar-size)) * 0.3);
  border-radius: var(--sb-avatar-radius);
  background: var(--sb-avatar-badge-bg);
  color: var(--sb-avatar-badge-fg);
  box-shadow: 0 0 0 var(--sb-avatar-badge-ring-width) var(--sb-avatar-badge-ring-color);
  user-select: none;
}

:host(sb-avatar-badge) ::slotted(svg) {
  display: var(--_badge-icon-display, block);
  width: 80%;
  height: 80%;
}

:host(sb-avatar-group) {
  --_size: var(--sb-avatar-size);
  --_font-size: var(--sb-avatar-fallback-font-size);
  --_icon-size: var(--sb-avatar-icon-size);
  display: flex;
}

:host(sb-avatar-group[data-size=small]) {
  --_size: var(--sb-avatar-size-sm);
  --_font-size: var(--sb-avatar-fallback-font-size-sm);
  --_icon-size: var(--sb-avatar-icon-size-sm);
}

:host(sb-avatar-group[data-size=large]) {
  --_size: var(--sb-avatar-size-lg);
  --_icon-size: var(--sb-avatar-icon-size-lg);
}

:host(sb-avatar-group) ::slotted(:not(:first-child)) {
  margin-inline-start: calc(-1 * var(--sb-avatar-group-overlap));
}

:host(sb-avatar-group) ::slotted(sb-avatar) {
  box-shadow: 0 0 0 var(--sb-avatar-group-ring-width) var(--sb-avatar-group-ring-color);
}

:host(sb-avatar-group-count) {
  position: relative;
  width: var(--_size, var(--sb-avatar-size));
  height: var(--_size, var(--sb-avatar-size));
  background: var(--sb-avatar-count-bg);
  color: var(--sb-avatar-count-fg);
  box-shadow: 0 0 0 var(--sb-avatar-group-ring-width) var(--sb-avatar-group-ring-color);
}

:host(sb-avatar-group-count) ::slotted(svg) {
  width: var(--_icon-size, var(--sb-avatar-icon-size));
  height: var(--_icon-size, var(--sb-avatar-icon-size));
}

@media (forced-colors: active) {
  :host(sb-avatar-fallback),
  :host(sb-avatar-group-count) {
    outline: thin solid CanvasText;
  }
  :host(sb-avatar-badge) {
    background: CanvasText;
  }
}
`;
