// GENERATED from Sidebar.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const sidebarStyles = css`
:host([hidden]) {
  display: none;
}

:host(sb-sidebar-provider) {
  display: flex;
  min-height: 100svh;
}

[part=wrapper] {
  display: flex;
  flex: 1;
  min-width: 0;
}

:host(sb-sidebar-provider) ::slotted(:not(sb-sidebar)) {
  flex: 1;
  min-width: 0;
}

:host(sb-sidebar) {
  display: flex;
  flex: none;
  justify-content: flex-end;
  width: var(--sb-sidebar-width);
  overflow: clip;
  font-family: var(--sb-sidebar-font-family);
  transition: width var(--sb-sidebar-transition-duration) var(--sb-sidebar-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  :host(sb-sidebar) {
    transition: none;
    animation: none;
  }
}

:host(sb-sidebar[data-state=collapsed]) {
  width: 0;
}

@media (width < 768px) {
  :host(sb-sidebar) {
    width: 0;
  }
}
[part=root] {
  box-sizing: border-box;
  position: sticky;
  top: 0;
  display: flex;
  flex: none;
  flex-direction: column;
  width: var(--sb-sidebar-width);
  height: 100svh;
  border-inline-end: var(--sb-sidebar-border-width) solid var(--sb-sidebar-border-color);
  background: var(--sb-sidebar-bg);
  color: var(--sb-sidebar-fg);
  transition: visibility var(--sb-sidebar-transition-duration);
}
@media (prefers-reduced-motion: reduce) {
  [part=root] {
    transition: none;
    animation: none;
  }
}

:host([data-state=collapsed]) [part=root] {
  visibility: hidden;
}

[part=nav] {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

[part=drawer] {
  box-sizing: border-box;
  inset-block: 0;
  inset-inline-start: 0;
  inset-inline-end: auto;
  width: var(--sb-sidebar-drawer-width);
  max-width: 100%;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: var(--sb-sidebar-bg);
  color: var(--sb-sidebar-fg);
  box-shadow: var(--sb-sidebar-drawer-shadow);
  transition: translate var(--sb-sidebar-transition-duration) var(--sb-sidebar-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=drawer] {
    transition: none;
    animation: none;
  }
}
[part=drawer][open] {
  display: flex;
  flex-direction: column;
}
@starting-style {
  [part=drawer][open] {
    translate: -100% 0;
  }
}
[part=drawer]::backdrop {
  background: var(--sb-sidebar-backdrop);
}

@starting-style {
  :host(:dir(rtl)) [part=drawer][open] {
    translate: 100% 0;
  }
}

:host(sb-sidebar-header),
:host(sb-sidebar-footer),
:host(sb-sidebar-group),
:host(sb-sidebar-group-label),
:host(sb-sidebar-menu),
:host(sb-sidebar-menu-item),
:host(sb-sidebar-menu-button) {
  display: block;
}

[part=header],
[part=footer],
[part=content] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-sidebar-gap);
}

[part=header],
[part=footer],
[part=group] {
  padding: var(--sb-sidebar-padding);
}

:host(sb-sidebar-content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
}

[part=group] {
  display: flex;
  flex-direction: column;
}

[part=label] {
  display: flex;
  align-items: center;
  min-height: var(--sb-sidebar-group-label-height);
  padding-inline: var(--sb-sidebar-group-label-padding-x);
  color: var(--sb-sidebar-group-label-fg);
  font-size: var(--sb-sidebar-group-label-font-size);
  font-weight: var(--sb-sidebar-group-label-font-weight);
  line-height: var(--sb-sidebar-group-label-line-height);
}

[part=menu] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-sidebar-menu-gap);
}

[part=button] {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--sb-sidebar-menu-button-gap);
  width: 100%;
  min-height: var(--sb-sidebar-menu-button-height);
  margin: 0;
  padding-block: calc((var(--sb-sidebar-menu-button-height) - 1lh) / 2);
  padding-inline: var(--sb-sidebar-menu-button-padding);
  border: 0;
  border-radius: var(--sb-sidebar-menu-button-radius);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--sb-sidebar-menu-button-font-size);
  font-weight: var(--sb-sidebar-menu-button-font-weight);
  line-height: var(--sb-sidebar-menu-button-line-height);
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}
[part=button]:hover {
  background: var(--sb-sidebar-menu-button-hover-bg);
  color: var(--sb-sidebar-menu-button-hover-fg);
}
[part=button]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-sidebar-focus-ring-width) var(--sb-sidebar-focus-ring-color);
}
@media (forced-colors: active) {
  [part=button]:focus-visible {
    outline: var(--sb-sidebar-focus-ring-width) solid CanvasText;
  }
}

:host(sb-sidebar-menu-button) ::slotted(svg) {
  flex: none;
  width: var(--sb-sidebar-menu-button-icon-size);
  height: var(--sb-sidebar-menu-button-icon-size);
}

:host([active]) a[part=button] {
  background: var(--sb-sidebar-menu-button-active-bg);
  color: var(--sb-sidebar-menu-button-active-fg);
  font-weight: var(--sb-sidebar-menu-button-active-font-weight);
}
@media (forced-colors: active) {
  :host([active]) a[part=button] {
    forced-color-adjust: none;
    background: Highlight;
    color: HighlightText;
  }
}

:host(sb-sidebar-trigger) {
  display: inline-block;
}

:host(sb-sidebar-trigger[data-hidden]) {
  display: none;
}

[part=trigger] {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--sb-sidebar-trigger-size);
  height: var(--sb-sidebar-trigger-size);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--sb-sidebar-trigger-radius);
  background: transparent;
  color: var(--sb-sidebar-trigger-fg);
  cursor: pointer;
}
[part=trigger]:hover {
  background: var(--sb-sidebar-trigger-hover-bg);
}
[part=trigger]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--sb-sidebar-focus-ring-width) var(--sb-sidebar-focus-ring-color);
}
@media (forced-colors: active) {
  [part=trigger]:focus-visible {
    outline: var(--sb-sidebar-focus-ring-width) solid CanvasText;
  }
}

[part=icon] {
  width: var(--sb-sidebar-trigger-icon-size);
  height: var(--sb-sidebar-trigger-icon-size);
}
`;
