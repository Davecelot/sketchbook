import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, PAGE_PARAMETERS } from './page';
import type { Token } from './tokens';
import { cssValue, foundation, pxRem, resolve } from './tokens';

const meta: Meta = { title: 'Foundations/Typography', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const STYLE = html`<style>
  .sbf .type-row { display: grid; grid-template-columns: minmax(9rem, 12rem) 1fr; gap: var(--sb-space-stack-md); align-items: baseline; padding-block: var(--sb-space-stack-sm); border-bottom: var(--sb-border-width-default) solid var(--sb-color-border); }
  .sbf .type-row p { margin: 0; max-width: none; overflow-wrap: anywhere; }
  .sbf .type-row .lh-sample { margin: 0; max-width: 18rem; background: var(--sb-color-muted); }
  .sbf .specimen { padding: var(--sb-space-inset-md); border: var(--sb-border-width-default) solid var(--sb-color-border); border-radius: var(--sb-radius-surface); }
  .sbf .specimen p { margin: 0 0 var(--sb-space-stack-md); }
</style>`;

const PANGRAM = 'Pack my box with five dozen liquor jugs.';
const value = (path: string) => {
  const r = resolve(path, null);
  return r.error ? undefined : cssValue(r.value, r.type);
};
const group = (name: string) => foundation.filter((t) => t.path.startsWith(`font.${name}.`));
const step = (t: Token) => t.path.split('.').pop()!;

const row = (t: Token, sample: unknown, extra = '') => html`<div class="type-row">
  <div class="label">
    <code>${t.path}</code>
    <span class="muted" data-type-size=${t.path}>${extra || cssValue(t.value, t.type)}</span>
  </div>
  ${sample}
</div>`;

// Each size with the line height of the same step when the scale pairs them.
const sizes = () =>
  group('size').map((t) => {
    const lh = value(`font.line-height.${step(t)}`);
    return row(t, html`<p data-type-sample=${t.path} style="font-size:${String(t.value)};${lh ? `line-height:${lh}` : ''}">${PANGRAM}</p>`, pxRem(String(t.value)) + (lh ? ` / ${lh}` : ''));
  });

const sample = (name: string, prop: string) =>
  group(name).map((t) => row(t, html`<p style="${prop}:${cssValue(t.value, t.type)}">${PANGRAM}</p>`));

const lineHeights = () =>
  group('line-height').map((t) =>
    row(t, html`<p class="lh-sample" style="line-height:${cssValue(t.value, t.type)}">Two lines of text show the space between baselines. ${PANGRAM}</p>`),
  );

// A short page set with the semantic roles (heading, lead, body, caption); missing roles fall back to inherited values.
const role = (size: string, weight?: string, lh?: string, tracking?: string, family?: string) =>
  [
    ['font-size', value(`font.size.${size}`)],
    ['font-weight', weight && value(`font.weight.${weight}`)],
    ['line-height', lh && value(`font.line-height.${lh}`)],
    ['letter-spacing', tracking && value(`font.letter-spacing.${tracking}`)],
    ['font-family', family && value(`font.family.${family}`)],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

const specimen = html`<div class="specimen">
  <p style=${role('heading-1', 'display', 'heading-1', 'heading')}>A first draft of a system</p>
  <p style=${role('lead', 'body', 'lead')} class="muted">Every value on this page comes from the token files, so the specimen changes as soon as they do.</p>
  <p style=${role('heading-3', 'heading', 'heading-3', 'heading')}>Reading comfort</p>
  <p style=${role('prose', 'body', 'body', 'body')}>
    Body text should sit at a size people can read for minutes without strain, with a line height near one and a half and lines short enough
    to find the start of the next one. Headings tighten their tracking and line height because they are read in a glance, not a sweep.
  </p>
  <p style=${role('caption', 'body', 'caption', 'body')} class="muted">Caption: secondary details, set smaller and quieter.</p>
  <p style=${role('body', 'body', 'body', 'body', 'code')}>const label = 'monospace for code';</p>
</div>`;

const section = (id: string, title: string, body: unknown) => html`<section aria-labelledby="sbf-${id}">
  <h2 id="sbf-${id}">${title}</h2>
  ${body}
</section>`;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'typography',
      configHint: 'typography',
      intro: html`<p>
        Typography is a family pair (text and code), a size scale, a few weights, line heights and letter spacing. The foundation holds the raw
        scale; the semantic layer gives sizes jobs (body, control, heading-1 to heading-4, caption) so a component asks for "a heading" rather than
        "24px". Sizes are shown in px and in rem against the 16px browser default.
      </p>`,
      samples: html`${STYLE} ${section('families', 'Families', sample('family', 'font-family'))} ${section('sizes', 'Size scale', sizes())}
      ${section('weights', 'Weights', sample('weight', 'font-weight'))} ${section('line-heights', 'Line heights', lineHeights())}
      ${section('tracking', 'Letter spacing', sample('letter-spacing', 'letter-spacing'))} ${section('specimen', 'Specimen', specimen)}`,
    }),
};
