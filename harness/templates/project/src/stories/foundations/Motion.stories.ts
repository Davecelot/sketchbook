import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, PAGE_PARAMETERS, pageTokens, resolvedText } from './page';
import type { Token } from './tokens';
import { cssValue, resolve, toMs } from './tokens';

const meta: Meta = { title: 'Foundations/Motion', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const STYLE = html`<style>
  .sbf .demo { display: grid; grid-template-columns: minmax(0, 14rem) auto minmax(var(--sb-size-control-lg), 1fr); gap: var(--sb-space-stack-md); align-items: center; padding-block: var(--sb-space-stack-sm); border-bottom: var(--sb-border-width-default) solid var(--sb-color-border); }
  .sbf .track { position: relative; height: var(--sb-size-control-sm); border: var(--sb-border-width-default) solid var(--sb-color-border); border-radius: var(--sb-radius-pill); background: var(--sb-color-muted); }
  .sbf .marker { position: absolute; inset-block: var(--sb-space-inset-track); inset-inline-start: var(--sb-space-inset-track); aspect-ratio: 1; border-radius: var(--sb-radius-pill); }
  .sbf .play { font: inherit; font-weight: var(--sb-font-weight-control); color: var(--sb-color-secondary-foreground); background: var(--sb-color-secondary); border: var(--sb-border-width-default) solid var(--sb-color-border); border-radius: var(--sb-radius-control); padding: var(--sb-space-stack-xs) var(--sb-space-control-padding-x-sm); cursor: pointer; }
  .sbf .play:focus-visible { outline: var(--sb-focus-ring-width) solid var(--sb-color-ring); outline-offset: var(--sb-focus-ring-offset); }
  .sbf .curve { width: var(--sb-size-control-lg); height: var(--sb-size-control-lg); color: var(--sb-color-muted-foreground); }
  .sbf [data-reduced-note] { display: none; }
  @media (prefers-reduced-motion: reduce) { .sbf [data-reduced-note] { display: block; } }
</style>`;

const durationOf = (t: Token) => toMs(resolvedText(t));
const easingOf = (t: Token) => resolvedText(t);

// Easing demos run at the longest duration up to 500ms (long enough to see the curve), and duration demos use the standard easing.
function defaults(tokens: Token[]) {
  const durations = tokens.map(durationOf).filter((n): n is number => n !== undefined);
  const showcase = Math.max(0, ...durations.filter((n) => n <= 500)) || 300;
  const standard = resolve('motion.easing.standard', null);
  return { showcase, easing: standard.error ? 'ease' : cssValue(standard.value, standard.type) };
}

// Moves the marker to the other end of its track with the demo's timing. With reduced motion the move takes no time.
function play(event: Event) {
  const demo = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-motion-demo]')!;
  const track = demo.querySelector<HTMLElement>('.track')!;
  const marker = demo.querySelector<HTMLElement>('.marker')!;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduce ? 0 : Number(demo.dataset.duration);
  const distance = track.clientWidth - marker.offsetWidth - 2 * marker.offsetLeft;
  const back = demo.dataset.atEnd === 'true';
  const [from, to] = back ? [distance, 0] : [0, distance];
  marker.getAnimations().forEach((a) => a.cancel());
  marker.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration, easing: demo.dataset.easing, fill: 'forwards' });
  demo.dataset.atEnd = String(!back);
  demo.dataset.played = 'true';
  demo.dataset.playedDuration = String(duration);
}

// A cubic-bezier drawn as a curve from (0,0) to (1,1); other easings get no drawing.
function curve(easing: string) {
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(easing);
  if (!m) return html`<span></span>`;
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = m[1]?.split(',').map(Number) ?? [];
  const p = (x: number, y: number) => `${x * 40 + 4} ${44 - y * 40}`;
  return html`<svg class="curve" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M${p(0, 0)} C${p(x1, y1)} ${p(x2, y2)} ${p(1, 1)}" />
  </svg>`;
}

const demo = (t: Token, duration: number, easing: string, extra: unknown) => html`<li class="demo" data-motion-demo=${t.path} data-duration=${duration} data-easing=${easing}>
  <div class="label">
    <code>${t.path}</code>
    <span class="muted">${resolvedText(t)}</span>
  </div>
  <button type="button" class="play" aria-label="Play ${t.path}" @click=${play}>Play</button>
  <div class="row">${extra}<div class="track" style="flex:1"><div class="marker fill"></div></div></div>
</li>`;

export const Page: StoryObj = {
  render: () => {
    const tokens = pageTokens('motion');
    const { showcase, easing } = defaults(tokens);
    const durations = tokens.filter((t) => durationOf(t) !== undefined);
    const easings = tokens.filter((t) => /^cubic-bezier|^ease|^linear|^steps/.test(easingOf(t)));
    return foundationPage({
      id: 'motion',
      intro: html`<p>
          Motion is a handful of durations and easing curves. Short durations suit small feedback (a hover, a toggle); longer ones suit larger
          movement (a panel sliding in). Easing shapes the speed over time: things that enter slow down at the end, things that leave speed up.
          Press Play to compare them.
        </p>
        <p>
          People can ask their system for reduced motion. Components then drop movement and keep only the change of state; these demos do the same and
          jump straight to their end position.
        </p>
        <p data-reduced-note><strong>Reduced motion is on:</strong> the demos below jump to their end state.</p>`,
      samples: html`${STYLE}
        <section aria-labelledby="sbf-durations">
          <h2 id="sbf-durations">Durations</h2>
          <p class="muted">Each runs with <code>${easing}</code>.</p>
          <ul class="plain">
            ${durations.map((t) => demo(t, durationOf(t)!, easing, ''))}
          </ul>
        </section>
        <section aria-labelledby="sbf-easings">
          <h2 id="sbf-easings">Easings</h2>
          <p class="muted">Each runs for ${showcase}ms.</p>
          <ul class="plain">
            ${easings.map((t) => demo(t, showcase, easingOf(t), curve(easingOf(t))))}
          </ul>
        </section>`,
    });
  },
};
