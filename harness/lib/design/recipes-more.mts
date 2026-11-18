// Recipes for the display, surface and navigation components (same tree shape as recipes.mjs, every value a contract token).
import type { ComboContext } from '../api.mjs';
import type { Binding, Recipe, RecipeHelpers, RecipeNode } from './library.mjs';
import { textOf, focusRing } from './recipes.mjs';

const TRACK_ALPHA = 0.2;
const DETERMINATE_SAMPLE = 50;
const INDETERMINATE_SHARE = 40;
const pick = (map: Record<string, string>, key: string | null): string | undefined => map[String(key)];
const tok = (list: Binding[]): Binding[] => list.filter(([t]) => t);

function separator(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const vertical = ctx.codes.orientation === 'vertical';
  return { p: 'line', k: 'b', d: 'r', v: 1, ...(vertical ? { fh: 1 } : { fw: 1 }), b: tok([[h.first('color'), 'fill'], [h.first('thickness'), vertical ? 'w' : 'h']]) };
}

function skeleton(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return { p: 'block', k: 'b', d: 'r', v: 1, fw: 1, fh: 1, b: tok([[h.first('bg'), 'fill'], [h.first('radius'), 'radius']]) };
}

function kbd(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return {
    p: 'key', k: 'b', d: 'r', v: 1, al: 'ctr',
    b: tok([[h.first('height'), 'h'], [h.first('min-width'), 'minw'], [h.first('padding-x'), 'padx'], [h.first('gap'), 'gap'], [h.first('radius'), 'radius'], [h.first('bg'), 'fill']]),
    kids: [textOf(h, 'label', 'K', 'font-size', 'fg')],
  };
}

function progress(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const bar = ctx.on.has('indeterminate');
  const radius = h.first('radius');
  return {
    p: 'track', k: 'b', d: 'r', v: 1, fw: 1, b: tok([[h.first('height'), 'h'], [radius, 'radius']]),
    kids: [
      { p: 'track-bg', k: 'b', d: 'r', v: 1, abs: 1, op: TRACK_ALPHA, b: tok([[h.first('track.bg'), 'fill'], [radius, 'radius']]) },
      { p: 'indicator', k: 'b', d: 'r', v: 1, pw: bar ? INDETERMINATE_SHARE : DETERMINATE_SAMPLE, b: tok([[h.first('indicator.bg'), 'fill'], [radius, 'radius'], [h.first('height'), 'h']]) },
    ],
  };
}

// The box and the content filling it: a slot cannot be a component's top layer.
const filling = (): RecipeNode => ({ p: 'content', k: 'b', d: 'r', v: 1, grow: 1, st: 1, b: [] });

function aspectRatio(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return { p: 'frame', k: 'b', d: 'r', v: 1, fw: 1, rt: h.props.ratio?.default ?? 1, b: [], kids: [filling()] };
}

function direction(): RecipeNode {
  return { p: 'root', k: 'b', d: 'r', v: 1, fw: 1, fh: 1, b: [], kids: [filling()] };
}

const HOVER_FILL = 0.9;
const SOFT_FILL = 0.5;
const text = (p: string, x: string, style: string | null, fg: string | null, extra: Partial<RecipeNode> = {}): RecipeNode => ({ p, k: 't', d: 'r', v: 1, x, s: style, b: tok([[fg, 'fills']]), ...extra });

// A badge is a pill: its border (transparent except for outline) is part of the box, as in the styles.
function badge(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const v = ctx.variant;
  const hover = ctx.state === 'hover';
  const ring = ctx.state === 'focus-visible';
  const fill = pick({ primary: 'default.bg', secondary: 'secondary.bg', destructive: 'destructive.bg' }, v);
  const hoverFill = pick({ tertiary: 'outline.bg-hover', ghost: 'ghost.bg-hover' }, v);
  const fg = pick({ primary: 'default.fg', secondary: 'secondary.fg', destructive: 'destructive.fg', tertiary: hover ? 'outline.fg-hover' : 'outline.fg', ghost: hover ? 'ghost.fg-hover' : 'ghost.fg', link: 'link.fg' }, v);
  const b: Binding[] = [[h.first('padding-x'), 'padx'], [h.first('padding-y'), 'pady'], [h.first('gap'), 'gap'], [h.first('radius'), 'radius'], [h.first('outline.border'), 'strokeIn'], [h.first('border-width'), 'sw']];
  if (v !== 'tertiary') b.push([h.first('outline.border'), 'strokeTr']);
  if (hover && hoverFill) b.push([h.first(hoverFill), 'fill']);
  else if (fill) b.push([h.first(fill), hover ? `fill:${HOVER_FILL}` : 'fill']);
  const slot = h.slot('default');
  const kids: RecipeNode[] = [];
  if (slot) kids.push({ p: 'icon', k: 'i', v: 0, i: h.iconSet('circle'), sw: slot.icon?.swap, sh: slot.icon?.visible, b: tok([[h.first('icon-size'), 'wh'], [h.first(fg), 'strokeOfVector']]) });
  const under = slot?.text.underline && h.first(`${v}.underline-offset`);
  // Where the underlined label shows, it carries the Label switch; a layer bound to a boolean shows whatever the property says.
  kids.push(text('label', 'Badge', h.style('font-size'), h.first(fg), { ...(slot ? { tp: slot.text.name, sh: slot.text.visible } : {}), ...(under && hover ? { v: 0, sh: null } : {}) }));
  if (under) kids.push(text('label-underline', 'Badge', h.style('font-size'), h.first(fg), { tp: slot?.text.underline, ul: 1, ...(hover ? { v: 1, sh: slot?.text.visible } : { v: 0 }) }));
  if (ring) kids.push(focusRing(h.first, { radius: h.first('radius') }));
  return { p: 'badge', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok(b), kids };
}

function avatar(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const rel = pick({ medium: '', small: '-sm', large: '-lg' }, ctx.size ?? 'medium');
  const font = ctx.size === 'small' ? 'fallback.font-size-sm' : 'fallback.font-size';
  const radius = h.first('radius');
  return {
    p: 'root', k: 'b', d: 'r', v: 1, b: tok([[h.first(`size${rel}`), 'wh'], [radius, 'radius']]),
    kids: [{ p: 'fallback', k: 'b', d: 'r', v: 1, abs: 1, al: 'ctr', b: tok([[h.first('fallback.bg'), 'fill'], [radius, 'radius']]), kids: [text('initials', 'AB', h.style(font), h.first('fallback.fg'))] }],
  };
}

function card(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const sm = ctx.size === 'small';
  const inset = h.first(sm ? 'padding-sm' : 'padding');
  const part = (p: string, kids: RecipeNode[], extra: Binding[] = []): RecipeNode => ({ p, k: 'b', d: 'c', v: 1, b: tok([[inset, 'padx'], ...extra]), kids });
  return {
    p: 'root', k: 'b', d: 'c', v: 1,
    b: tok([[h.first(sm ? 'gap-sm' : 'gap'), 'gap'], [inset, 'pady'], [h.first('radius'), 'radius'], [h.first('border'), 'strokeIn'], [h.first('border-width'), 'sw'], [h.first('bg'), 'fill'], [h.first('shadow'), 'effect']]),
    kids: [
      part('header', [{
        p: 'header-row', k: 'b', d: 'r', v: 1, fw: 1, b: [],
        kids: [
          { p: 'header-text', k: 'b', d: 'c', v: 1, grow: 1, b: tok([[h.first('header-gap'), 'gap']]), kids: [text('title', 'Title', h.style('title.font-size'), h.first('fg')), text('description', 'Description', h.style('description.font-size'), h.first('description.fg'))] },
          { p: 'action', k: 'b', d: 'r', v: 0, b: [] },
        ],
      }], [[h.first('header-gap'), 'gap']]),
      part('content', [text('content-text', 'Content', h.style('description.font-size'), h.first('fg'))]),
      { ...part('footer', [text('footer-text', 'Footer', h.style('description.font-size'), h.first('fg'))]), d: 'r', cal: 'ctr' },
    ],
  };
}

function alert(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const bad = ctx.codes.feedback === 'danger';
  const fg = h.first(bad ? 'destructive.fg' : 'fg');
  return {
    p: 'root', k: 'b', d: 'r', v: 1, fw: 1, cal: 'min',
    b: tok([[h.first('padding-x'), 'padx'], [h.first('padding-y'), 'pady'], [h.first('column-gap'), 'gap'], [h.first('radius'), 'radius'], [h.first('border'), 'strokeIn'], [h.first('border-width'), 'sw'], [h.first('bg'), 'fill']]),
    kids: [
      { p: 'icon-slot', k: 'b', d: 'r', v: 1, b: tok([[h.first('icon-offset'), 'padt']]), kids: [{ p: 'icon', k: 'i', v: 1, i: h.iconSet('circle'), b: tok([[h.first('icon-size'), 'wh'], [fg, 'strokeOfVector']]) }] },
      {
        p: 'content', k: 'b', d: 'c', v: 1, grow: 1, b: tok([[h.first('row-gap'), 'gap']]),
        kids: [text('title', 'Title', 'font.size.control', fg), text('description', 'Description', h.style('font-size'), h.first(bad ? 'destructive.fg' : 'description.fg'))],
      },
    ],
  };
}

function empty(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return {
    p: 'root', k: 'b', d: 'c', v: 1, al: 'ctr', cal: 'ctr', fw: 1,
    b: tok([[h.first('gap'), 'gap'], [h.first('padding'), 'padx'], [h.first('padding'), 'pady'], [h.first('radius'), 'radius']]),
    kids: [
      {
        p: 'header', k: 'b', d: 'c', v: 1, cal: 'ctr', b: tok([[h.first('header.gap'), 'gap']]),
        kids: [
          {
            p: 'media', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok([[h.first('media.margin-bottom'), 'padb']]),
            kids: [{ p: 'icon-box', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok([[h.first('media.icon.size'), 'wh'], [h.first('media.icon.radius'), 'radius'], [h.first('media.icon.bg'), 'fill']]), kids: [{ p: 'icon', k: 'i', v: 1, i: h.iconSet('circle'), b: tok([[h.first('media.icon.svg-size'), 'wh'], [h.first('media.icon.fg'), 'strokeOfVector']]) }] }],
          },
          text('title', 'Title', h.style('title.font-size'), h.first('title.fg')),
          text('description', 'Description', h.style('description.font-size'), h.first('description.fg')),
        ],
      },
      { p: 'content', k: 'b', d: 'c', v: 1, b: tok([[h.first('content.gap'), 'gap']]), kids: [text('content-text', 'Content', h.style('content.font-size'), h.first('content.fg'))] },
    ],
  };
}

function item(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const sm = ctx.size === 'small';
  const hover = ctx.state === 'hover';
  const ring = ctx.state === 'focus-visible';
  const b: Binding[] = [[h.first(sm ? 'gap-sm' : 'gap'), 'gap'], [h.first('radius'), 'radius']];
  if (sm) b.push([h.first('padding-inline-sm'), 'padx'], [h.first('padding-block-sm'), 'pady']);
  else b.push([h.first('padding'), 'padx'], [h.first('padding'), 'pady']);
  b.push([h.first(ring ? 'focus-ring.color' : 'border'), 'strokeIn'], [h.first('border-width'), 'sw']);
  if (!ring && ctx.variant !== 'tertiary') b.push([h.first('border'), 'strokeTr']);
  if (hover) b.push([h.first('hover-bg'), `fill:${SOFT_FILL}`]);
  else if (ctx.variant === 'muted') b.push([h.first('muted-bg'), `fill:${SOFT_FILL}`]);
  const media: RecipeNode = { p: 'media', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok([[h.first('media.icon.size'), 'wh'], [h.first('media.icon.radius'), 'radius'], [h.first('media.icon.bg'), 'fill'], [h.first('media.icon.border'), 'strokeIn'], [h.first('border-width'), 'sw']]), kids: [{ p: 'icon', k: 'i', v: 1, i: h.iconSet('circle'), b: tok([[h.first('media.icon.svg-size'), 'wh'], [h.first('media.icon.fg'), 'strokeOfVector']]) }] };
  const content: RecipeNode = { p: 'content', k: 'b', d: 'c', v: 1, grow: 1, b: tok([[h.first('content.gap'), 'gap']]), kids: [text('title', 'Title', 'font.size.control', h.first('fg')), text('description', 'Description', h.style('font-size'), h.first('description.fg'))] };
  const actions: RecipeNode = { p: 'actions', k: 'b', d: 'r', v: 1, cal: 'ctr', b: tok([[h.first('actions.gap'), 'gap']]), kids: [{ p: 'button', k: 'c', c: 'button', v: 1, b: [], pr: { Variant: 'Tertiary', Size: 'Small', State: 'Rest', Disabled: 'False', 'Label text': 'Action' } }] };
  const avatar: RecipeNode = { p: 'avatar-media', k: 'c', c: 'avatar', v: 1, noex: 1, b: [], pr: { Size: 'Small' } };
  return { p: 'item', k: 'b', d: 'r', v: 1, fw: 1, cal: 'ctr', b: tok(b), kids: [media, avatar, content, actions, ...(ring ? [focusRing(h.first, { radius: h.first('radius') })] : [])] };
}

// Corners that touch a neighbour are square, as the joined group's styles make them (first, middle, last of a row or column).
const joined = (row: boolean, i: number, n: number): string[] => {
  const inner = row ? { first: ['topRightRadius', 'bottomRightRadius'], last: ['topLeftRadius', 'bottomLeftRadius'] } : { first: ['bottomLeftRadius', 'bottomRightRadius'], last: ['topLeftRadius', 'topRightRadius'] };
  return i === 0 ? inner.first : i === n - 1 ? inner.last : [...inner.first, ...inner.last];
};

// The list and its triggers. The line list has no fill or radius; its selected trigger keeps the text color and shows the
// indicator, an inside bottom edge (the styles' ::after, inset at the bottom, as high as the indicator width).
function tabsList(h: RecipeHelpers, { vertical, active, ring, disabled, line, third = false }: { vertical: boolean; active: number; ring: boolean; disabled: boolean; line: boolean; third?: boolean }): RecipeNode {
  const trigger = (p: string, x: string, index: number): RecipeNode => {
    const on = active === index;
    const ringed = ring && index === 1;
    // A line trigger has no fill, so its radius shows only as a bend in the indicator, which the styles draw straight.
    const b: Binding[] = [[h.first('trigger.padding-x'), 'padx'], [h.first('trigger.padding-y'), 'pady'], [h.first('trigger.gap'), 'gap'], ...(line ? [] : [[h.first('trigger.radius'), 'radius']])];
    if (on && !line) b.push([h.first('trigger.active.bg'), 'fill'], [h.first('trigger.active.border'), 'strokeIn'], [h.first('trigger.border-width'), 'sw']);
    if (on && !line && !ringed) b.push([h.first('trigger.active.shadow'), 'effect']);
    if (on && line) b.push([h.first('indicator.color'), 'strokeIn'], [h.first('indicator.width'), vertical ? 'swR' : 'swB']);
    if (disabled && index === 1) b.push([h.first('disabled-opacity'), 'opacity']);
    return {
      p, k: 'b', d: 'r', v: 1, al: vertical ? 'min' : 'ctr', b: tok(b),
      kids: [text(`${p}-label`, x, h.style('font-size'), h.first(on ? 'trigger.active.fg' : 'trigger.fg')), ...(ringed ? [focusRing(h.first, { radius: h.first('trigger.radius') })] : [])],
    };
  };
  const box: Binding[] = line ? [[h.first('list.gap-line'), 'gap']] : [[h.first('list.radius'), 'radius'], [h.first('list.bg'), 'fill']];
  return {
    p: 'list', k: 'b', d: vertical ? 'c' : 'r', v: 1, al: vertical ? 'min' : 'ctr',
    b: tok([[h.first('list.padding'), 'padx'], [h.first('list.padding'), 'pady'], ...box, ...(vertical ? [] : [[h.first('list.height'), 'h']])]),
    kids: [trigger('trigger', 'Tab 1', 1), trigger('trigger-other', 'Tab 2', 2), ...(third ? [trigger('trigger-third', 'Tab 3', 3)] : [])],
  };
}

// The tabs and their panel, the gap between them from the styles; the panel is content the person places.
function tabs(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const vertical = ctx.codes.orientation === 'vertical';
  const list = tabsList(h, { vertical, active: ctx.on.has('selected') ? 1 : 0, ring: ctx.state === 'focus-visible', disabled: ctx.disabled, line: false });
  const panel: RecipeNode = { p: 'panel', k: 'b', d: 'r', v: 1, b: [], kids: [text('panel-text', 'Content', h.style('font-size'), h.first('trigger.active.fg'))] };
  return { p: 'root', k: 'b', d: vertical ? 'r' : 'c', v: 1, hug: 1, b: tok([[h.first('gap'), 'gap']]), kids: [list, panel] };
}

function tabsListSet(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return tabsList(h, { vertical: false, active: Number(ctx.options.Active ?? 1), ring: false, disabled: false, line: ctx.variant === 'line', third: true });
}

function accordion(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const open = ctx.on.has('open');
  const ring = ctx.state === 'focus-visible';
  const trigger: RecipeNode = {
    // space-between with a gap, for a label and a chevron: the label fills the row (Figma drops a gap bound to auto spacing).
    p: 'trigger', k: 'b', d: 'r', v: 1, al: 'min', cal: 'min',
    b: tok([[h.first('trigger.padding-y'), 'pady'], [h.first('trigger.gap'), 'gap'], [h.first('radius'), 'radius'], ...(ctx.disabled ? [[h.first('disabled-opacity'), 'opacity']] : [])]),
    kids: [
      text('label', 'Question', 'font.size.control', h.first('fg'), { grow: 1 }),
      { p: 'chevron', k: 'i', v: 1, i: h.iconSet(open ? 'chevron-up' : 'chevron-down'), b: tok([[h.first('chevron.size'), 'wh'], [h.first('chevron.color'), 'strokeOfVector']]) },
      ...(ring ? [focusRing(h.first, { radius: h.first('radius') })] : []),
    ],
  };
  const body: RecipeNode = { p: 'content', k: 'b', d: 'c', v: 1, b: tok([[h.first('content.padding-bottom'), 'padb']]), kids: [text('content-text', 'Answer', h.style('font-size'), h.first('fg'))] };
  const line: RecipeNode = { p: 'border', k: 'b', d: 'r', v: 1, b: tok([[h.first('border-width'), 'h'], [h.first('border'), 'fill']]) };
  return { p: 'root', k: 'b', d: 'c', v: 1, kids: [trigger, ...(open ? [body] : []), line] };
}

function collapsible(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const open = ctx.on.has('open');
  const ring = ctx.state === 'focus-visible';
  const fg = h.first('fg');
  const trigger: RecipeNode = {
    p: 'trigger', k: 'b', d: 'r', v: 1, al: 'ctr',
    b: tok([[h.first('trigger-min-size'), 'minw'], [h.first('trigger-min-size'), 'h'], [h.first('radius'), 'radius'], ...(ctx.disabled ? [[h.first('disabled-opacity'), 'opacity']] : [])]),
    kids: [text('trigger-label', 'Toggle', 'font.size.control', fg), ...(ring ? [focusRing(h.first, { radius: h.first('radius') })] : [])],
  };
  const content: RecipeNode = { p: 'content', k: 'b', d: 'c', v: 1, b: [], kids: [text('content-text', 'Content', 'font.size.body', fg)] };
  return { p: 'root', k: 'b', d: 'c', v: 1, hug: 1, kids: [trigger, ...(open ? [content] : [])] };
}

function breadcrumb(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const style = h.style('font-size');
  const separator = (p: string): RecipeNode => ({ p, k: 'i', v: 1, i: h.iconSet('chevron-right'), b: tok([[h.first('separator.size'), 'wh'], [h.first('fg'), 'strokeOfVector']]) });
  return {
    p: 'nav', k: 'b', d: 'r', v: 1, hug: 1, b: tok([[h.first('gap'), 'gap']]),
    kids: [
      text('link', 'Home', style, h.first('fg')),
      separator('separator'),
      text('link-middle', 'Middle', style, h.first('fg')),
      separator('separator-mid'),
      { p: 'ellipsis', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok([[h.first('ellipsis.size'), 'wh']]), kids: [{ p: 'ellipsis-icon', k: 'i', v: 1, i: h.iconSet('ellipsis'), b: tok([[h.first('ellipsis.icon-size'), 'wh'], [h.first('fg'), 'strokeOfVector']]) }] },
      separator('separator-end'),
      text('page', 'Page', style, h.first('fg-current')),
    ],
  };
}

function pagination(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const link = (p: string, { label, icon, active, padded }: { label?: string; icon?: string; active?: boolean; padded?: boolean }): RecipeNode => ({
    p, k: 'b', d: 'r', v: 1, al: 'ctr',
    b: tok([[h.first('link.size'), 'h'], [h.first('link.size'), 'minw'], ...(padded ? [[h.first('link.padding-x'), 'padx']] : []), [h.first('link.gap'), 'gap'], [h.first('link.radius'), 'radius'], [h.first('link.active.border'), 'strokeIn'], [h.first('link.border-width'), 'sw'], ...(active ? [[h.first('link.active.bg'), 'fill'], [h.first('link.active.shadow'), 'effect']] : [[h.first('link.active.border'), 'strokeTr']])]),
    kids: [
      ...(icon ? [{ p: `${p}-icon`, k: 'i', v: 1, i: h.iconSet(icon), b: tok([[h.first('link.icon-size'), 'wh'], [h.first('link.fg'), 'strokeOfVector']]) }] : []),
      ...(label ? [text(`${p}-label`, label, h.style('font-size'), h.first('link.fg'))] : []),
    ],
  });
  const ellipsis: RecipeNode = { p: 'ellipsis', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok([[h.first('link.size'), 'wh']]), kids: [{ p: 'ellipsis-icon', k: 'i', v: 1, i: h.iconSet('ellipsis'), b: tok([[h.first('link.icon-size'), 'wh'], [h.first('link.fg'), 'strokeOfVector']]) }] };
  const content: RecipeNode = {
    p: 'content', k: 'b', d: 'r', v: 1, cal: 'ctr', b: tok([[h.first('gap'), 'gap']]),
    kids: [link('previous', { label: 'Previous', icon: 'chevron-left', padded: true }), link('page-1', { label: '1', active: true }), link('page-2', { label: '2' }), link('page-3', { label: '3' }), ellipsis, link('next', { label: 'Next', icon: 'chevron-right', padded: true })],
  };
  return { p: 'nav', k: 'b', d: 'r', v: 1, al: 'ctr', kids: [content] };
}

function buttonGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const row = ctx.codes.orientation !== 'vertical';
  const shared = row ? 'strokeLeftWeight' : 'strokeTopWeight';
  const button = (p: string, i: number): RecipeNode => ({ p, k: 'c', c: 'button', v: 1, pr: { Variant: 'Tertiary', Size: 'Medium', State: 'Rest', Disabled: 'False', 'Label text': 'Button' }, sq: [...joined(row, i, 3), ...(i ? [shared] : [])] });
  const segment: RecipeNode = {
    p: 'text', k: 'b', d: 'r', v: 1, al: 'ctr', sq: [...joined(row, 2, 3), shared],
    b: tok([[h.first('text.height'), 'h'], [h.first('text.padding-x'), 'padx'], [h.first('text.gap'), 'gap'], [h.first('radius'), 'radius'], [h.first('text.border'), 'strokeIn'], [h.first('border-width'), 'sw'], [h.first('text.bg'), 'fill'], [h.first('text.shadow'), 'effect']]),
    kids: [text('text-label', 'Text', h.style('text.font-size'), h.first('text.fg'))],
  };
  return { p: 'group', k: 'b', d: row ? 'r' : 'c', v: 1, hug: 1, kids: [button('button', 0), button('button-other', 1), segment] };
}

const SELECTED_ROW = 'row.selected.bg';

function table(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const nested = (p: string, c: string, pr?: Record<string, string>): RecipeNode => ({ p, k: 'c', c, v: 1, noex: 1, b: [], ...(pr ? { pr } : {}) });
  // The first body cell lays its select, avatar and name out like the kit's person; the cell padding equals the kit's stack gap (space.2).
  const frame = (p: string, kids: RecipeNode[], extra: { stack?: number; head?: boolean; person?: boolean } = {}): RecipeNode => ({
    p, k: 'b', d: extra.stack ? 'c' : 'r', v: 1, ...(extra.stack ? {} : { grow: 1 }), al: 'min', b: extra.stack ? [] : tok(extra.head ? [[h.first('head.height'), 'h'], [h.first('head.padding-x'), 'padx']] : [[h.first('cell.padding'), 'padx'], [h.first('cell.padding'), 'pady'], ...(extra.person ? [[h.first('cell.padding'), 'gap']] : [])]), kids,
  });
  const label = (p: string, x: string, head: boolean | undefined, fg: string, bold = false) => text(`${p}-text`, x, head || bold ? 'font.size.control' : h.style('font-size'), h.first(fg));
  const row = (p: string, kids: RecipeNode[], fill?: Binding | null): RecipeNode => ({ p, k: 'b', d: 'r', v: 1, b: tok(fill ? [fill] : []), kids });
  const line = (p: string): RecipeNode => ({ p, k: 'b', d: 'r', v: 1, b: tok([[h.first('border-width'), 'h'], [h.first('border'), 'fill']]) });
  const selected: Binding = [h.first(SELECTED_ROW), 'fill'];

  // One header, body or footer row: the five columns, the hidden spacer after the first (the wide first column), and the
  // nested parts of the person, status and select options.
  const cells = ({ at, head, fg, bold, n }: { at: string; head?: boolean; fg: string; bold?: boolean; n?: number }): RecipeNode[] => {
    const id = (x: string) => `${at}-${x}`;
    const first = id('a');
    const sample = (x: string) => (head ? `Head ${x}` : bold ? `Total ${x}` : `Cell ${x}`);
    const mark = n ? String(n) : '1';
    const aKids = head ? [nested('select-all', 'checkbox'), label(first, sample('A'), head, fg)]
      : bold ? [label(first, sample('A'), head, fg, bold)]
        : [nested(`select-${mark}`, 'checkbox'), nested(`avatar-${mark}-a`, 'avatar', { Size: 'Small' }),
          frame(`${first}-stack`, [label(first, sample('A'), head, fg), text(`email-${mark}-a`, 'name@example.com', 'font.size.caption', h.first('caption.fg'))], { stack: 1 })];
    const bKids = head || bold ? [label(id('b'), sample('B'), head, fg, bold)] : [label(id('b'), sample('B'), head, fg), nested(`badge-${mark}-b`, 'badge')];
    return [
      frame(first, aKids, { head, person: !head && !bold }), frame(`${first}2`, [], { head }), frame(id('b'), bKids, { head }),
      frame(id('c'), [label(id('c'), sample('C'), head, fg, bold)], { head }), frame(id('d'), [label(id('d'), sample('C'), head, fg, bold)], { head }), frame(id('e'), [label(id('e'), sample('C'), head, fg, bold)], { head }),
    ];
  };
  const body = (n: number) => row(`row-${n}`, cells({ at: n === 1 ? 'cell' : `cell-${n}`, fg: 'cell.fg', n }), n === 2 ? selected : null);
  return {
    p: 'table', k: 'b', d: 'c', v: 1,
    kids: [
      row('header', cells({ at: 'head', head: true, fg: 'head.fg' })),
      line('header-border'),
      body(1), line('row-1-border'), body(2), line('row-2-border'), body(3), line('row-3-border'), body(4), line('row-4-border'), body(5), line('row-5-border'), body(6),
      line('footer-border'),
      row('footer', cells({ at: 'foot', fg: 'cell.fg', bold: true }), [h.first('footer.bg'), 'fill:0.5']),
      { p: 'caption', k: 'b', d: 'r', v: 1, al: 'ctr', b: tok([[h.first('caption.margin'), 'padt']]), kids: [text('caption-text', 'Caption', h.style('font-size'), h.first('caption.fg'))] },
    ],
  };
}

function scrollArea(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const ring = ctx.state === 'focus-visible';
  return { p: 'viewport', k: 'b', d: 'r', v: 1, fw: 1, fh: 1, b: [], kids: [{ p: 'content', k: 'b', d: 'r', v: 1, grow: 1, st: 1, b: [] },...(ring ? [focusRing(h.first, {})] : [])] };
}

function typography(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const v = ctx.codes.kind ?? null;
  const own = pick({ small: 'font.size.control' }, v);
  const style = own ?? h.style(pick({ h1: 'h1.font-size', h2: 'h2.font-size', h3: 'h3.font-size', h4: 'h4.font-size', p: 'p.font-size', blockquote: 'p.font-size', list: 'p.font-size', 'inline-code': 'code.font-size', lead: 'lead.font-size', large: 'large.font-size', muted: 'muted.font-size' }, v));
  const fg = h.first(v === 'lead' || v === 'muted' ? 'muted.fg' : 'fg');
  const label = (x: string) => text('text-label', x, style, fg);
  // Typography.scss: :host is display block (a column whose text fills and wraps); inline-code and small are inline (hug).
  const inline = v === 'inline-code' || v === 'small';
  const root = (b: Binding[], kids: RecipeNode[]): RecipeNode => (inline ? { p: 'text', k: 'b', d: 'r', v: 1, hug: 1, b: tok(b), kids } : { p: 'text', k: 'b', d: 'c', v: 1, b: tok(b), kids });
  if (v === 'h2') return root([[h.first('h2.padding-bottom'), 'padb'], [h.first('h2.border-color'), 'strokeIn'], [h.first('h2.border-width'), 'swB']], [label('Heading')]);
  if (v === 'blockquote') return root([[h.first('blockquote.padding-start'), 'padl'], [h.first('blockquote.border-color'), 'strokeIn'], [h.first('blockquote.border-width'), 'swL']], [label('A quoted line')]);
  if (v === 'inline-code') return root([[h.first('code.padding-x'), 'padx'], [h.first('code.padding-y'), 'pady'], [h.first('code.radius'), 'radius'], [h.first('code.bg'), 'fill']], [label('code')]);
  if (v === 'list') return root([[h.first('list.margin-start'), 'padl'], [h.first('list.item-gap'), 'gap']], ['One', 'Two', 'Three'].map((x) => text(`item-${x.toLowerCase()}`, `• ${x}`, style, fg)));
  return root([], [label(v === 'p' ? 'Paragraph' : 'Text')]);
}


// Element sets (spec/api.json sets): a group nests its component's instances with the group's own gap or separator.
function kbdGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return { p: 'group', k: 'b', d: 'r', v: 1, cal: 'ctr', b: tok([[h.first('group.gap'), 'gap']]), kids: [{ p: 'key', k: 'c', c: 'kbd', v: 1, b: [] }, { p: 'key-other', k: 'c', c: 'kbd', v: 1, b: [] }] };
}

function itemGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const separator: RecipeNode = { p: 'separator', k: 'b', d: 'r', v: 1, b: tok([[h.first('separator.height'), 'h'], [h.first('separator.bg'), 'fill']]) };
  return { p: 'group', k: 'b', d: 'c', v: 1, b: [], kids: [{ p: 'item', k: 'c', c: 'item', v: 1, b: [] }, separator, { p: 'item-other', k: 'c', c: 'item', v: 1, b: [] }] };
}

// The separator stands between two filled buttons, as high as they are, as wide as the group's border.
function buttonGroupSeparator(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const button = (p: string, i: number): RecipeNode => ({ p, k: 'c', c: 'button', v: 1, b: [], pr: { Variant: 'Secondary', Size: 'Medium', State: 'Rest', Disabled: 'False', 'Label text': 'Button' }, sq: joined(true, i, 2) });
  const separator: RecipeNode = { p: 'separator', k: 'b', d: 'r', v: 1, st: 1, b: tok([[h.first('border-width'), 'w'], [h.first('separator.bg'), 'fill']]) };
  return { p: 'group', k: 'b', d: 'r', v: 1, hug: 1, b: [], kids: [button('button', 0), separator, button('button-other', 1)] };
}

// The GroupsAndShortcuts story: a search row, two groups split by a separator. Selected marks the first item active (accent
// fill and the inset ring of the styles' box-shadow); Disabled dims the third, as the DisabledItem story does.
function command(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const icon = (name: string, size: string, fg: string): RecipeNode => ({ p: 'icon', k: 'i', v: 1, i: h.iconSet(name), b: tok([[h.first(size), 'wh'], [h.first(fg), 'strokeOfVector']]) });
  const item = (p: string, label: string, iconName: string, shortcut?: string | null, { active = false, off = false }: { active?: boolean; off?: boolean } = {}): RecipeNode => ({
    p, k: 'b', d: 'r', v: 1, cal: 'ctr',
    b: tok([[h.first('item.gap'), 'gap'], [h.first('item.padding-x'), 'padx'], [h.first('item.padding-y'), 'pady'], [h.first('item.radius'), 'radius'],
      ...(active ? [[h.first('item.active.bg'), 'fill'], [h.first('item.active.ring-color'), 'strokeIn'], [h.first('item.active.ring-width'), 'sw']] : []),
      ...(off ? [[h.first('item.disabled-opacity'), 'opacity']] : [])]),
    kids: [
      icon(iconName, 'item.icon-size', 'item.icon-fg'),
      text('label', label, h.style('font-size'), h.first(active ? 'item.active.fg' : 'fg'), { grow: 1 }),
      ...(shortcut ? [text('shortcut', shortcut, h.style('shortcut.font-size'), h.first(active ? 'item.active.shortcut-fg' : 'shortcut.fg'))] : []),
    ],
  });
  const group = (p: string, heading: string, items: RecipeNode[]): RecipeNode => ({
    p, k: 'b', d: 'c', v: 1, b: tok([[h.first('group.padding'), 'padx'], [h.first('group.padding'), 'pady']]),
    kids: [{ p: 'heading', k: 'b', d: 'r', v: 1, b: tok([[h.first('group.heading.padding-x'), 'padx'], [h.first('group.heading.padding-y'), 'pady']]), kids: [text('heading-text', heading, h.style('group.heading.font-size'), h.first('group.heading.fg'))] }, ...items],
  });
  const input: RecipeNode = {
    p: 'input-row', k: 'b', d: 'r', v: 1, cal: 'ctr',
    b: tok([[h.first('input.height'), 'h'], [h.first('input.padding-x'), 'padx'], [h.first('input.gap'), 'gap'], [h.first('input.border'), 'strokeIn'], [h.first('input.border-width'), 'swB']]),
    kids: [icon('search', 'input.icon-size', 'input.icon-fg'), { p: 'input', k: 'b', d: 'r', v: 1, grow: 1, al: 'min', b: [], kids: [text('placeholder', 'Type a command or search...', h.style('font-size'), h.first('input.placeholder'))] }],
  };
  const list: RecipeNode = {
    p: 'list', k: 'b', d: 'c', v: 1, b: [],
    kids: [
      group('group', 'Suggestions', [item('item', 'Calendar', 'calendar', null, { active: ctx.on.has('selected') }), item('item-2', 'Search Emoji', 'smile'), item('item-3', 'Calculator', 'calculator', null, { off: ctx.disabled })]),
      { p: 'separator', k: 'b', d: 'r', v: 1, b: tok([[h.first('separator.width'), 'h'], [h.first('separator.color'), 'fill']]) },
      group('group-2', 'Settings', [item('item', 'Profile', 'user', '⌘P'), item('item-2', 'Billing', 'credit-card', '⌘B'), item('item-3', 'Settings', 'settings', '⌘S')]),
    ],
  };
  return { p: 'root', k: 'b', d: 'c', v: 1, b: tok([[h.first('radius'), 'radius'], [h.first('bg'), 'fill']]), kids: [input, list] };
}

// Closed, only the trigger shows; open, the surface sits on the backdrop, kept the viewport margin from its edges. The
// close button is laid out in the header row, in the space the styles reserve for it beside the title.
function dialog(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const button = (p: string, pr: Record<string, string>, sp?: Record<string, string>): RecipeNode => ({ p, k: 'c', c: 'button', v: 1, b: [], pr: { State: 'Rest', Disabled: 'False', ...pr }, ...(sp ? { sp } : {}) });
  if (!ctx.on.has('open')) return { p: 'root', k: 'b', d: 'r', v: 1, hug: 1, b: [], kids: [button('trigger', { Variant: 'Tertiary', Size: 'Medium', 'Label text': 'Edit profile' })] };
  const header: RecipeNode = {
    p: 'header-row', k: 'b', d: 'r', v: 1, cal: 'min', b: [],
    kids: [
      { p: 'header', k: 'b', d: 'c', v: 1, grow: 1, b: tok([[h.first('header.gap'), 'gap']]), kids: [text('title', 'Edit profile', h.style('title.font-size'), h.first('fg')), text('description', "Make changes to your profile here. Click save when you're done.", h.style('description.font-size'), h.first('description.fg'))] },
      button('close', { Variant: 'Ghost', Size: 'Icon small' }, { 'Left icon swap': 'x' }),
    ],
  };
  const field = (p: string, label: string, value: string): RecipeNode => ({ p, k: 'c', c: 'input', v: 1, b: [], pr: { 'Label text': label, 'Value text': value, Value: true, Placeholder: false } });
  const content: RecipeNode = { p: 'content', k: 'b', d: 'c', v: 1, b: tok([[h.first('gap'), 'gap']]), kids: [field('name', 'Name', 'Pedro Duarte'), field('username', 'Username', '@peduarte')] };
  const footer: RecipeNode = { p: 'footer', k: 'b', d: 'r', v: 1, al: 'max', b: tok([[h.first('footer.gap'), 'gap']]), kids: [button('cancel', { Variant: 'Tertiary', Size: 'Medium', 'Label text': 'Cancel' }), button('save', { Variant: 'Primary', Size: 'Medium', 'Label text': 'Save changes' })] };
  const surface: RecipeNode = {
    p: 'dialog', k: 'b', d: 'r', v: 1,
    b: tok([[h.first('max-width'), 'w'], [h.first('padding'), 'padx'], [h.first('padding'), 'pady'], [h.first('radius'), 'radius'], [h.first('border'), 'strokeIn'], [h.first('border-width'), 'sw'], [h.first('bg'), 'fill'], [h.first('shadow'), 'effect']]),
    kids: [{ p: 'stack', k: 'b', d: 'c', v: 1, grow: 1, b: tok([[h.first('gap'), 'gap']]), kids: [header, content, footer] }],
  };
  return { p: 'backdrop', k: 'b', d: 'r', v: 1, hug: 1, b: tok([[h.first('viewport-margin'), 'padx'], [h.first('viewport-margin'), 'pady'], [h.first('backdrop'), 'fill']]), kids: [surface] };
}

// The Default story: the panel (header, two groups, footer) and the trigger beside it. State applies to the first menu
// button while the panel is open and to the trigger once it is closed (offcanvas: the panel leaves, the trigger stays).
function sidebar(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const open = ctx.on.has('open');
  const hover = ctx.state === 'hover';
  const ring = ctx.state === 'focus-visible';
  const menuButton = (p: string, label: string, iconName?: string, { first = false }: { first?: boolean } = {}): RecipeNode => {
    const active = first && ctx.on.has('selected');
    const hovered = first && open && hover;
    const fg = h.first(active ? 'menu-button.active.fg' : hovered ? 'menu-button.hover.fg' : 'fg');
    const fill = active ? 'menu-button.active.bg' : hovered ? 'menu-button.hover.bg' : null;
    return {
      p, k: 'b', d: 'r', v: 1, al: 'min', cal: 'ctr',
      b: tok([[h.first('menu-button.height'), 'h'], [h.first('menu-button.padding'), 'padx'], [h.first('menu-button.gap'), 'gap'], [h.first('menu-button.radius'), 'radius'], ...(fill ? [[h.first(fill), 'fill']] : [])]),
      kids: [
        ...(iconName ? [{ p: 'icon', k: 'i', v: 1, i: h.iconSet(iconName), b: tok([[h.first('menu-button.icon-size'), 'wh'], [fg, 'strokeOfVector']]) }] : []),
        text('button-label', label, h.style('menu-button.font-size'), fg),
        ...(first && open && ring ? [focusRing(h.first, { radius: h.first('menu-button.radius') })] : []),
      ],
    };
  };
  const inset: Binding[] = [[h.first('padding'), 'padx'], [h.first('padding'), 'pady']];
  const group = (p: string, label: string, buttons: RecipeNode[]): RecipeNode => ({
    p, k: 'b', d: 'c', v: 1, b: tok(inset),
    kids: [
      { p: 'label', k: 'b', d: 'r', v: 1, al: 'min', b: tok([[h.first('group-label.height'), 'h'], [h.first('group-label.padding-x'), 'padx']]), kids: [text('label-text', label, h.style('group-label.font-size'), h.first('group-label.fg'))] },
      { p: 'menu', k: 'b', d: 'c', v: 1, b: tok([[h.first('menu.gap'), 'gap']]), kids: buttons },
    ],
  });
  const stack = (p: string, kids: RecipeNode[]): RecipeNode => ({ p, k: 'b', d: 'c', v: 1, b: tok([...inset, [h.first('gap'), 'gap']]), kids });
  // The current page is marked inside the panel, so a selected variant shows the panel.
  const panel: RecipeNode = {
    p: 'root', k: 'b', d: 'c', v: open || ctx.on.has('selected') ? 1 : 0,
    b: tok([[h.first('width'), 'w'], [h.first('bg'), 'fill'], [h.first('border.color'), 'strokeIn'], [h.first('border.width'), 'swR']]),
    kids: [{
      p: 'nav', k: 'b', d: 'c', v: 1, b: [],
      kids: [
        stack('header', [text('header-text', 'Sketchbook', 'font.size.control', h.first('fg'))]),
        { p: 'content', k: 'b', d: 'c', v: 1, b: tok([[h.first('gap'), 'gap']]), kids: [
          group('group', 'Getting started', [menuButton('button', 'Introduction', 'house', { first: true }), menuButton('button-2', 'Installation', 'book-open')]),
          group('group-2', 'Components', [menuButton('button', 'Button'), menuButton('button-2', 'Card'), menuButton('button-3', 'Dialog'), menuButton('button-4', 'Sidebar')]),
        ] },
        stack('footer', [text('footer-text', 'Version 0.1.0', 'font.size.caption', h.first('fg'))]),
      ],
    }],
  };
  const trigger: RecipeNode = {
    p: 'trigger', k: 'b', d: 'r', v: 1, al: 'ctr', cal: 'ctr',
    b: tok([[h.first('trigger.size'), 'wh'], [h.first('trigger.radius'), 'radius'], ...(!open && hover ? [[h.first('trigger.hover.bg'), 'fill']] : [])]),
    kids: [{ p: 'icon', k: 'i', v: 1, i: h.iconSet('panel-left'), b: tok([[h.first('trigger.icon-size'), 'wh'], [h.first('trigger.fg'), 'strokeOfVector']]) }, ...(!open && ring ? [focusRing(h.first, { radius: h.first('trigger.radius') })] : [])],
  };
  return { p: 'wrapper', k: 'b', d: 'r', v: 1, hug: 1, cal: 'min', b: [], kids: [panel, trigger] };
}

export const MORE: Record<string, Recipe> = { command, dialog, sidebar, table, 'scroll-area': scrollArea, typography, separator, skeleton, kbd, progress, 'aspect-ratio': aspectRatio, direction, badge, avatar, card, alert, empty, item, tabs, accordion, collapsible, breadcrumb, pagination, 'button-group': buttonGroup,
  'kbd/kbd-group': kbdGroup, 'item/item-group': itemGroup, 'button-group/button-group-separator': buttonGroupSeparator, 'tabs/tabs-list': tabsListSet };
