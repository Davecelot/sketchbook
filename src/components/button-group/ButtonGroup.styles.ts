// GENERATED from ButtonGroup.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const buttonGroupStyles = css`
:host {
  display: inline-flex;
}

:host([hidden]) {
  display: none;
}

[part=group] {
  --_r: var(--sb-button-group-radius);
  display: flex;
  flex-direction: row;
  align-items: stretch;
}
[part=group][data-orientation=vertical] {
  flex-direction: column;
}

::slotted(*) {
  --_radius: var(--_r);
  --sb-button-radius: var(--_radius);
}

::slotted([data-position=middle]) {
  --_radius: 0;
}

::slotted([data-position=first]) {
  --_radius: var(--_r) 0 0 var(--_r);
}

::slotted([data-position=last]) {
  --_radius: 0 var(--_r) var(--_r) 0;
}

:host(:dir(rtl)) ::slotted([data-position=first]) {
  --_radius: 0 var(--_r) var(--_r) 0;
}

:host(:dir(rtl)) ::slotted([data-position=last]) {
  --_radius: var(--_r) 0 0 var(--_r);
}

[part=group][data-orientation=vertical] ::slotted([data-position=first]) {
  --_radius: var(--_r) var(--_r) 0 0;
}

[part=group][data-orientation=vertical] ::slotted([data-position=last]) {
  --_radius: 0 0 var(--_r) var(--_r);
}

::slotted(sb-button[variant=tertiary][data-overlap]),
::slotted(sb-button-group-text[data-overlap]) {
  margin-inline-start: calc(-1 * var(--sb-button-group-border-width));
}

[part=group][data-orientation=vertical] ::slotted(sb-button[variant=tertiary][data-overlap]),
[part=group][data-orientation=vertical] ::slotted(sb-button-group-text[data-overlap]) {
  margin-inline-start: 0;
  margin-block-start: calc(-1 * var(--sb-button-group-border-width));
}

::slotted(:focus-within) {
  position: relative;
}

:host(sb-button-group-separator) {
  display: block;
  align-self: stretch;
}

[part=separator] {
  width: var(--sb-button-group-border-width);
  height: 100%;
  background: var(--sb-button-group-separator-bg);
}
@media (forced-colors: active) {
  [part=separator] {
    background: CanvasText;
  }
}

:host(sb-button-group-separator[data-orientation=vertical]) [part=separator] {
  width: 100%;
  height: var(--sb-button-group-border-width);
}

:host(sb-button-group-text) {
  display: inline-flex;
}

[part=text] {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--sb-button-group-text-gap);
  height: var(--sb-button-group-text-height);
  padding-inline: var(--sb-button-group-text-padding-x);
  border: var(--sb-button-group-border-width) solid var(--sb-button-group-text-border);
  border-radius: var(--_radius, var(--sb-button-group-radius));
  background: var(--sb-button-group-text-bg);
  color: var(--sb-button-group-text-fg);
  box-shadow: var(--sb-button-group-text-shadow);
  font-family: var(--sb-button-group-text-font-family);
  font-size: var(--sb-button-group-text-font-size);
  font-weight: var(--sb-button-group-text-font-weight);
  line-height: var(--sb-button-group-text-line-height);
  white-space: nowrap;
}

::slotted(svg) {
  flex-shrink: 0;
  width: var(--sb-button-group-text-icon-size);
  height: var(--sb-button-group-text-icon-size);
}
`;
