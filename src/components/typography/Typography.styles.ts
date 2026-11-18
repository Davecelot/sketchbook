// GENERATED from Typography.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const typographyStyles = css`
:host {
  display: block;
  font-family: var(--sb-typography-font-family);
  color: var(--sb-typography-fg);
}

:host([hidden]) {
  display: none;
}

:host([kind=inline-code]),
:host([kind=small]) {
  display: inline;
}

[part=text] {
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
}

:host([kind=p]:not(:first-child)) {
  margin-top: var(--sb-typography-p-margin-top);
}

:host([kind=blockquote]:not(:first-child)) {
  margin-top: var(--sb-typography-blockquote-margin-top);
}

:host([kind=h2]:not(:first-child)) {
  margin-top: var(--sb-typography-h2-margin-top);
}

:host([kind=h3]:not(:first-child)) {
  margin-top: var(--sb-typography-h3-margin-top);
}

:host([kind=h1]) [part=text] {
  font-size: var(--sb-typography-h1-font-size);
  line-height: var(--sb-typography-h1-line-height);
  font-weight: var(--sb-typography-h1-font-weight);
  text-wrap: balance;
}

:host([kind=h2]) [part=text] {
  padding-bottom: var(--sb-typography-h2-padding-bottom);
  border-bottom: var(--sb-typography-h2-border-width) solid var(--sb-typography-h2-border-color);
  font-size: var(--sb-typography-h2-font-size);
  line-height: var(--sb-typography-h2-line-height);
  font-weight: var(--sb-typography-h2-font-weight);
}

:host([kind=h3]) [part=text] {
  font-size: var(--sb-typography-h3-font-size);
  line-height: var(--sb-typography-h3-line-height);
  font-weight: var(--sb-typography-h3-font-weight);
}

:host([kind=h4]) [part=text] {
  font-size: var(--sb-typography-h4-font-size);
  line-height: var(--sb-typography-h4-line-height);
  font-weight: var(--sb-typography-h4-font-weight);
}

:host([kind=p]) [part=text] {
  font-size: var(--sb-typography-p-font-size);
  line-height: var(--sb-typography-p-line-height);
}

:host([kind=blockquote]) [part=text] {
  padding-inline-start: var(--sb-typography-blockquote-padding-start);
  border-inline-start: var(--sb-typography-blockquote-border-width) solid var(--sb-typography-blockquote-border-color);
  font-size: var(--sb-typography-p-font-size);
  line-height: var(--sb-typography-p-line-height);
  font-style: italic;
}

:host([kind=list]) {
  margin-block: var(--sb-typography-list-margin-block);
}

:host([kind=list]) [part=text] {
  margin-inline-start: var(--sb-typography-list-margin-start);
  list-style: disc;
  font-size: var(--sb-typography-p-font-size);
  line-height: var(--sb-typography-p-line-height);
}

::slotted(li) {
  margin-top: var(--sb-typography-list-item-gap);
}

:host([kind=inline-code]) [part=text] {
  padding: var(--sb-typography-code-padding-y) var(--sb-typography-code-padding-x);
  border-radius: var(--sb-typography-code-radius);
  background: var(--sb-typography-code-bg);
  font-family: var(--sb-typography-code-font-family);
  font-size: var(--sb-typography-code-font-size);
  line-height: var(--sb-typography-code-line-height);
  font-weight: var(--sb-typography-code-font-weight);
}

:host([kind=lead]) [part=text] {
  color: var(--sb-typography-muted-fg);
  font-size: var(--sb-typography-lead-font-size);
  line-height: var(--sb-typography-lead-line-height);
}

:host([kind=large]) [part=text] {
  font-size: var(--sb-typography-large-font-size);
  line-height: var(--sb-typography-large-line-height);
  font-weight: var(--sb-typography-large-font-weight);
}

:host([kind=small]) [part=text] {
  font-size: var(--sb-typography-small-font-size);
  line-height: var(--sb-typography-small-line-height);
  font-weight: var(--sb-typography-small-font-weight);
}

:host([kind=muted]) [part=text] {
  color: var(--sb-typography-muted-fg);
  font-size: var(--sb-typography-muted-font-size);
  line-height: var(--sb-typography-muted-line-height);
}

:host([kind=h1]) [part=text],
:host([kind=h2]) [part=text],
:host([kind=h3]) [part=text],
:host([kind=h4]) [part=text] {
  letter-spacing: var(--sb-typography-heading-letter-spacing);
}
`;
