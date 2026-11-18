// GENERATED from Field.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const fieldStyles = css`
:host {
  display: block;
  font-family: var(--sb-field-font-family);
}

:host([hidden]),
:host(sb-field-error[data-empty]) {
  display: none;
}

[part=field] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-field-gap);
}

:host([orientation=horizontal]) [part=field] {
  flex-direction: row;
  align-items: flex-start;
}

[part=group] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-field-group-gap);
}

[part=fieldset] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-field-set-gap);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

[part=legend] {
  margin-bottom: var(--sb-field-legend-margin-bottom);
  padding: 0;
  color: var(--sb-field-legend-fg);
  font-size: var(--sb-field-legend-font-size);
  font-weight: var(--sb-field-legend-font-weight);
  line-height: var(--sb-field-legend-line-height);
}

:host(sb-field-label) {
  width: fit-content;
}

[part=label] {
  display: flex;
  color: var(--sb-field-label-fg);
  font-size: var(--sb-field-label-font-size);
  font-weight: var(--sb-field-label-font-weight);
  line-height: var(--sb-field-label-line-height);
}

:host(sb-field-label[data-invalid]) [part=label] {
  color: var(--sb-field-label-fg-invalid);
}

[part=title] {
  color: var(--sb-field-title-fg);
  font-size: var(--sb-field-title-font-size);
  font-weight: var(--sb-field-title-font-weight);
  line-height: var(--sb-field-title-line-height);
}

[part=description] {
  margin: 0;
  color: var(--sb-field-description-fg);
  font-size: var(--sb-field-description-font-size);
  line-height: var(--sb-field-description-line-height);
}

[part=error] {
  color: var(--sb-field-error-fg);
  font-size: var(--sb-field-error-font-size);
  font-weight: var(--sb-field-error-font-weight);
  line-height: var(--sb-field-error-line-height);
}

:host(sb-field-content) {
  flex: 1;
}

[part=content] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-field-content-gap);
}

[part=separator] {
  display: flex;
  align-items: center;
}

[part=line] {
  flex: 1;
  height: var(--sb-field-separator-thickness);
  background: var(--sb-field-separator-line);
}
@media (forced-colors: active) {
  [part=line] {
    background: CanvasText;
  }
}

[part=text] {
  display: none;
  padding-inline: var(--sb-field-separator-text-padding-x);
  background: var(--sb-field-separator-text-bg);
  color: var(--sb-field-separator-text-fg);
  font-size: var(--sb-field-separator-font-size);
  line-height: var(--sb-field-separator-line-height);
}

:host([data-has-text]) [part=text] {
  display: block;
}

:host(:not([data-has-text])) [part=line]:last-child {
  display: none;
}
`;
