// Composite controls whose indicator, items or alignment depend on state: a recipe returns the same tree the generic
// builder does (library.mjs), every value a token of the contract. `h` holds the token helpers of one component.
import type { ComboContext } from '../api.mjs';
import type { Binding, LayerNode, Recipe, RecipeHelpers, RecipeNode } from './library.mjs';

// Component tokens keep the step names the design file's variables are named after (default, outline, sm, lg, xs); the API values are
// canonical (spec/api.json), so a token lookup translates the value first.
const TOKEN_STEP: Readonly<Record<string, string>> = { primary: 'default', tertiary: 'outline', medium: 'default', small: 'sm', large: 'lg', tiny: 'xs', 'icon-tiny': 'icon-xs', 'icon-small': 'icon-sm', 'icon-large': 'icon-lg' };
export const tokenStep = (code: string | null): string | null => (code === null ? null : (TOKEN_STEP[code] ?? code));

const selectedOf = (ctx: ComboContext): boolean => ctx.on.has('selected');

// The focus ring is `box-shadow: 0 0 0 width color` in the styles: it replaces the shadow and follows the radius. A layer with an
// outside stroke does the same. An invalid field mixes the error color to 20% (a literal in the styles).
export const INVALID_RING_ALPHA = 0.2;
export function focusRing(first: RecipeHelpers['first'], { invalid = false, radius }: { invalid?: boolean; radius?: string | null }): LayerNode {
  return {
    p: 'focus-ring', k: 'b', d: 'r', v: 1, ring: 1, abs: 1, ...(invalid ? { op: INVALID_RING_ALPHA } : {}),
    b: [[radius, 'radius'], [invalid ? first('border-invalid') : first('focus-ring.color'), 'stroke'], [first('focus-ring.width'), 'sw']].filter(([t]) => t),
  };
}

// A checkbox or switch: [control | label, description, error] in a row. The control wraps the box or track (the input part).
// Disabled dims the box (and thumb) and the label, as the component's styles do; the description and error stay.
function formField(h: RecipeHelpers, ctx: ComboContext, control: RecipeNode): RecipeNode {
  const text = (p: string, x: string, rel: string, fgRel: string, extra: Partial<RecipeNode> = {}): RecipeNode => ({ p, k: 't', d: 'r', v: 1, x, s: h.style(rel), b: [[h.first(fgRel), 'fills']].filter(([t]) => t), ...extra });
  const label = h.figma('label');
  const required = h.figma('required');
  const description = h.figma('description');
  const error = h.figma('errorMessage');
  const dim = ctx.disabled ? h.first('disabled-opacity') : null;
  const content = {
    p: 'content', k: 'b', d: 'c', v: 1, b: [[h.first('content-gap'), 'gap']].filter(([t]) => t),
    kids: [
      { p: 'label', k: 'b', d: 'r', v: 1, b: dim ? [[dim, 'opacity']] : [], kids: [
        text('label-text', 'Label', 'label.font-size', 'label.fg', { tp: label?.name }),
        text('required-indicator', '*', 'label.font-size', 'label.fg', { v: 0, sh: required?.name }),
      ] },
      text('description', 'Description', 'description.font-size', 'description.fg', { v: 0, tp: description?.name, sh: description?.visible }),
      text('error', 'Error', 'description.font-size', 'error.fg', { v: ctx.invalid ? 1 : 0, tp: error?.name }),
    ],
  };
  // The styles center the control on the label's first line: the control is as high as one label line, the box centered in it.
  const role = h.typeRole('label');
  const lineBox: Binding[] = role ? [[`text-style.${role}.line-height`, 'h']] : [];
  return { p: 'field', k: 'b', d: 'r', v: 1, cal: 'min', b: [[h.first('gap'), 'gap']].filter(([t]) => t), kids: [{ p: 'control', k: 'b', d: 'r', v: 1, b: lineBox, kids: [control] }, content] };
}

// The look shared by a checkbox box and a switch track: ring when focused, error border, selected fill.
function frame(h: RecipeHelpers, ctx: ComboContext, { fill, selectedFill, border, selectedBorder }: { fill: string; selectedFill: string; border: string; selectedBorder: string }): { b: Binding[]; ring: boolean; selected: boolean } {
  const selected = selectedOf(ctx) || ctx.on.has('indeterminate');
  const b: Binding[] = [];
  const ring = ctx.state === 'focus-visible';
  const stroke = ctx.invalid ? h.first('border-invalid') : ring && h.focusBorder ? h.first('focus-ring.color') : selected ? h.first(selectedBorder) : h.first(border);
  if (stroke) b.push([stroke, 'stroke'], [h.first('border-width'), 'sw']);
  b.push([h.first(selected ? selectedFill : fill), 'fill']);
  if (!ring) b.push([h.first('shadow'), 'effect']);
  if (ctx.disabled) b.push([h.first('disabled-opacity'), 'opacity']);
  return { b: b.filter(([t]) => t), ring, selected };
}

function checkbox(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const { b, ring, selected } = frame(h, ctx, { fill: 'bg', selectedFill: 'checked.bg', border: 'border', selectedBorder: 'checked.border' });
  const glyph = ctx.on.has('indeterminate') ? h.iconSet('minus') : selectedOf(ctx) ? h.iconSet('check') : null;
  const box: RecipeNode & { kids: RecipeNode[] } = { p: 'input', k: 'b', d: 'r', v: 1, b: [[h.first('size'), 'wh'], [h.first('radius'), 'radius'], ...b], kids: [] };
  if (selected && glyph) box.kids.push({ p: 'glyph', k: 'i', v: 1, i: glyph, b: [[h.first('size'), 'wh'], [h.first('checked.fg'), 'strokeOfVector']] });
  if (ring) box.kids.push(focusRing(h.first, { invalid: ctx.invalid, radius: h.first('radius') }));
  return formField(h, ctx, box);
}

function switchRecipe(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const sm = ctx.size === 'small';
  const t = (rel: string) => h.first(...(sm ? [`sm.${rel}`] : []), rel);
  const { b, ring } = frame(h, ctx, { fill: 'track.bg', selectedFill: 'checked.bg', border: 'border', selectedBorder: 'checked.bg' });
  const on = selectedOf(ctx);
  const thumb: RecipeNode = { p: 'thumb', k: 'b', d: 'r', v: 1, b: [[t('thumb.size'), 'wh'], [h.first('radius'), 'radius'], [h.first(on ? 'thumb.checked.bg' : 'thumb.bg'), 'fill']] };
  const track: RecipeNode = { p: 'input', k: 'b', d: 'r', v: 1, al: on ? 'max' : 'min', b: [[t('width'), 'w'], [t('height'), 'h'], [h.first('inset'), 'padx'], [h.first('radius'), 'radius'], ...b], kids: [thumb, ...(ring ? [focusRing(h.first, { invalid: ctx.invalid, radius: h.first('radius') })] : [])] };
  return formField(h, ctx, track);
}

function toggle(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const outline = ctx.variant === 'tertiary';
  const base = tokenStep(ctx.size) ?? 'default';
  const selected = selectedOf(ctx);
  const hover = ctx.state === 'hover';
  const ring = ctx.state === 'focus-visible';
  const fgRel = selected ? 'on.fg' : hover ? (outline ? 'outline.fg-hover' : 'hover.fg') : 'fg';
  const fillRel = selected ? 'on.bg' : hover ? (outline ? 'outline.bg-hover' : 'hover.bg') : null;
  const b: Binding[] = [[h.first(`height.${base}`), 'h'], [h.first(`padding-x.${base}`), 'padx'], [h.first('gap'), 'gap'], [h.first('radius'), 'radius']];
  if (selected) b.push([h.first('on.border'), 'stroke'], [h.first('border-width'), 'sw']);
  else if (outline) b.push([h.first('outline.border'), 'stroke'], [h.first('border-width'), 'sw']);
  if (fillRel) b.push([h.first(fillRel), 'fill']);
  if (outline && !ring) b.push([h.first('outline.shadow'), 'effect']);
  if (ctx.disabled) b.push([h.first('disabled-opacity'), 'opacity']);
  b.push([h.first(`height.${base}`), 'minw']);
  const slot = h.slot('default');
  const kids: RecipeNode[] = [];
  if (slot) kids.push({ p: 'icon', k: 'i', v: 0, i: h.iconSet('circle'), sw: slot.icon?.swap, sh: slot.icon?.visible, b: [[h.first('icon-size'), 'wh'], [h.first(fgRel), 'strokeOfVector']].filter(([t]) => t) });
  kids.push({ p: 'label', k: 't', d: 'r', v: 1, x: 'Label', s: h.style('font-size'), b: [[h.first(fgRel), 'fills']].filter(([t]) => t), tp: slot?.text.name ?? h.contentName('label'), ...(slot ? { sh: slot.text.visible } : {}) });
  if (ring) kids.push(focusRing(h.first, { radius: h.first('radius') }));
  return { p: 'button', k: 'b', d: 'r', v: 1, b: b.filter(([t]) => t), kids };
}

// The only bindings outside a component's own tokens: a spacing-scale step where the styles multiply space.unit, which a
// design-file variable cannot do; every preset's scale is linear, so step N is N x unit (SB-0121).
export const SCALE_BINDINGS: Readonly<Record<string, readonly string[]>> = { 'toggle-group': ['space.2'] };

function toggleGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const row = ctx.codes.orientation !== 'vertical';
  const inner = row ? { first: ['topRightRadius', 'bottomRightRadius'], last: ['topLeftRadius', 'bottomLeftRadius'] } : { first: ['bottomLeftRadius', 'bottomRightRadius'], last: ['topLeftRadius', 'topRightRadius'] };
  const square = (i: number) => (i === 0 ? inner.first : i === 2 ? inner.last : [...inner.first, ...inner.last]);
  const shared = ctx.figma.Variant !== 'Tertiary' ? [] : [row ? 'strokeLeftWeight' : 'strokeTopWeight'];
  // Spacing 2: separate items with their own corners and borders, the gap the scale's step 2 (2 x space.unit, SB-0121).
  const spaced = ctx.figma.Spacing === '2';
  const [gap2] = SCALE_BINDINGS['toggle-group'] ?? [];
  const item = (i: number): RecipeNode => ({ p: 'item', k: 'c', c: 'toggle', v: 1, b: [], sq: spaced ? [] : [...square(i), ...(i ? shared : [])], pr: { Variant: ctx.figma.Variant, Size: ctx.figma.Size, State: 'Rest', Selected: i === 0 ? 'True' : 'False', Disabled: 'False', 'Label text': `Item ${i + 1}` } });
  const b: Binding[] = [...(spaced && gap2 ? [[gap2, 'gap'] as Binding] : []), ...(ctx.disabled ? [[h.first('disabled-opacity'), 'opacity'] as Binding].filter(([t]) => t) : [])];
  return { p: 'group', k: 'b', d: row ? 'r' : 'c', v: 1, hug: 1, b, kids: [0, 1, 2].map(item) };
}

function radioGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const row = ctx.codes.orientation === 'horizontal';
  const dim = ctx.disabled ? h.first('disabled-opacity') : null;
  const control = (selected: boolean): RecipeNode => {
    const ring = selected && ctx.state === 'focus-visible';
    return {
      p: 'control', k: 'b', d: 'r', v: 1, al: 'ctr', cal: 'ctr',
      b: [[h.first('size'), 'wh'], [h.first('radius'), 'radius'], [h.first('border'), 'stroke'], [h.first('border-width'), 'sw'], [h.first('bg'), 'fill'], ...(ring ? [] : [[h.first('shadow'), 'effect']])].filter(([t]) => t),
      kids: [...(selected ? [{ p: 'dot', k: 'e', v: 1, b: [[h.first('size'), 'half'], [h.first('dot'), 'fill']] }] : []), ...(ring ? [focusRing(h.first, { radius: h.first('radius') })] : [])],
    };
  };
  const item = (i: number): RecipeNode => ({
    p: 'item', k: 'b', d: 'r', v: 1, b: [[h.first('item-gap'), 'gap'], ...(dim ? [[dim, 'opacity']] : [])].filter(([t]) => t),
    kids: [control(i === 0), { p: 'label', k: 't', d: 'r', v: 1, x: `Item ${i + 1}`, s: h.style('label.font-size'), b: [[h.first('label.fg'), 'fills']].filter(([t]) => t) }],
  });
  const gap = h.first(row ? 'gap-horizontal' : 'gap');
  return { p: 'group', k: 'b', d: row ? 'r' : 'c', v: 1, b: [[gap, 'gap']].filter(([t]) => t), kids: [0, 1, 2].map(item) };
}

export const textOf = (h: RecipeHelpers, p: string, x: string, rel: string, fgRel: string, extra: Partial<RecipeNode> = {}): RecipeNode => ({ p, k: 't', d: 'r', v: 1, x, s: h.style(rel), b: [[h.first(fgRel), 'fills']].filter(([t]) => t), ...extra });

// A form field around one control: label (with required mark), the control, description and error, stacked. Disabled dims
// the control only (the styles' :disabled), so each recipe puts the opacity on its control.
export const dimOf = (h: RecipeHelpers, ctx: ComboContext): Binding[] => (ctx.disabled ? [[h.first('disabled-opacity'), 'opacity']].filter(([t]) => t) : []);
function fieldColumn(h: RecipeHelpers, ctx: ComboContext, control: RecipeNode): RecipeNode {
  const required = h.figma('required');
  const description = h.figma('description');
  return {
    p: 'field', k: 'b', d: 'c', v: 1, b: [[h.first('gap'), 'gap']].filter(([t]) => t),
    kids: [
      h.hasPart('required-indicator')
        ? { p: 'label', k: 'b', d: 'r', v: 1, b: [], kids: [
          textOf(h, 'label-text', 'Label', 'label.font-size', 'label.fg', { tp: h.figma('label')?.name }),
          textOf(h, 'required-indicator', '*', 'label.font-size', 'label.fg', { v: 0, sh: required?.name }),
        ] }
        : textOf(h, 'label', 'Label', 'label.font-size', 'label.fg', { tp: h.figma('label')?.name }),
      control,
      textOf(h, 'description', 'Description', 'description.font-size', 'description.fg', { v: 0, tp: description?.name, sh: description?.visible }),
      textOf(h, 'error', 'Error', 'description.font-size', 'error.fg', { v: ctx.invalid ? 1 : 0, tp: h.figma('errorMessage')?.name }),
    ],
  };
}

function inputBox(h: RecipeHelpers, ctx: ComboContext, { border = 'border' }: { border?: string } = {}): { b: Binding[]; ring: boolean } {
  const ring = ctx.state === 'focus-visible' || ctx.state === 'focus-within';
  const stroke = ctx.invalid ? h.first('border-invalid') : ring && h.focusBorder ? h.first('focus-ring.color') : h.first(border);
  const b: Binding[] = [];
  if (stroke) b.push([stroke, 'stroke'], [h.first('border-width'), 'sw']);
  b.push([h.first('bg'), 'fill']);
  if (!ring) b.push([h.first('shadow'), 'effect']);
  return { b, ring };
}

function textarea(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const { b, ring } = inputBox(h, ctx);
  const value = h.figma('value');
  const placeholder = h.figma('placeholder');
  const box: RecipeNode = {
    p: 'textarea', k: 'b', d: 'r', v: 1, al: 'min', cal: 'min',
    b: [[h.first('min-height'), 'len'], [h.first('padding-x'), 'padx'], [h.first('padding-y'), 'pady'], [h.first('radius'), 'radius'], ...b, ...dimOf(h, ctx)].filter(([t]) => t),
    kids: [
      textOf(h, 'value', 'Value', 'font-size', 'fg', { v: 0, tp: value?.name, sh: value?.visible }),
      textOf(h, 'placeholder', 'Placeholder', 'font-size', 'placeholder', { tp: placeholder?.name, sh: placeholder?.visible }),
      ...(ring ? [focusRing(h.first, { invalid: ctx.invalid, radius: h.first('radius') })] : []),
    ],
  };
  return fieldColumn(h, ctx, box);
}

function nativeSelect(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const { b, ring } = inputBox(h, ctx);
  const small = ctx.size === 'small';
  const select: RecipeNode = {
    p: 'select', k: 'b', d: 'r', v: 1, al: 'between',
    b: [[h.first(small ? 'height-sm' : 'height'), 'h'], [h.first('padding-x'), 'padx'], [h.first('padding-y'), 'pady'], [h.first('radius'), 'radius'], ...b, ...dimOf(h, ctx)].filter(([t]) => t),
    kids: [
      textOf(h, 'value', 'Select an option', 'font-size', 'fg'),
      { p: 'icon', k: 'i', v: 1, i: h.iconSet('chevron-down'), b: [[h.first('icon.size'), 'wh'], [h.first('icon.fg'), 'strokeOfVector']].filter(([t]) => t) },
      ...(ring ? [focusRing(h.first, { invalid: ctx.invalid, radius: h.first('radius') })] : []),
    ],
  };
  return fieldColumn(h, ctx, { p: 'control', k: 'b', d: 'c', v: 1, b: [], kids: [select] });
}

function field(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const row = ctx.codes.orientation === 'horizontal';
  const description = h.figma('description');
  const label = textOf(h, 'label', 'Label', 'label.font-size', ctx.invalid ? 'label.fg-invalid' : 'label.fg');
  const content: RecipeNode = {
    p: 'content', k: 'b', d: 'c', v: 1, b: [[h.first('content-gap'), 'gap']].filter(([t]) => t),
    kids: [
      textOf(h, 'description', 'Description', 'description.font-size', 'description.fg', { tp: description?.name }),
      textOf(h, 'error', 'Error', 'error.font-size', 'error.fg', { v: ctx.invalid ? 1 : 0 }),
    ],
  };
  return { p: 'field', k: 'b', d: row ? 'r' : 'c', v: 1, cal: 'min', b: [[h.first('gap'), 'gap']].filter(([t]) => t), kids: [label, content] };
}

// Field elements drawn as sets of their own (spec/api.json sets): a set and a group nest Field instances, as the styles lay
// out slotted fields; the legend's margin is its bottom padding.
const nestedFields = (): RecipeNode[] => [{ p: 'field', k: 'c', c: 'field', v: 1, b: [] }, { p: 'field-other', k: 'c', c: 'field', v: 1, b: [] }];

function fieldSet(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const legend: RecipeNode = { p: 'legend', k: 'b', d: 'r', v: 1, b: [[h.first('legend.margin-bottom'), 'padb']].filter(([t]) => t), kids: [textOf(h, 'legend-text', 'Legend', 'legend.font-size', 'legend.fg', { tp: h.figma('legend')?.name })] };
  return { p: 'fieldset', k: 'b', d: 'c', v: 1, b: [[h.first('set.gap'), 'gap']].filter(([t]) => t), kids: [legend, ...nestedFields()] };
}

function fieldGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return { p: 'group', k: 'b', d: 'c', v: 1, b: [[h.first('group.gap'), 'gap']].filter(([t]) => t), kids: nestedFields() };
}

// The text sits between two lines; without text the styles show one line.
function fieldSeparator(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const slot = h.slot('default');
  const line = (p: string, extra: Partial<RecipeNode> = {}): RecipeNode => ({ p, k: 'b', d: 'r', v: 1, grow: 1, b: [[h.first('separator.thickness'), 'h'], [h.first('separator.line'), 'fill']].filter(([t]) => t), ...extra });
  const text: RecipeNode = {
    p: 'text', k: 'b', d: 'r', v: 1, sh: slot?.text.visible, b: [[h.first('separator.text.padding-x'), 'padx'], [h.first('separator.text.bg'), 'fill']].filter(([t]) => t),
    kids: [textOf(h, 'text-label', 'Or', 'separator.font-size', 'separator.text.fg', { tp: slot?.text.name })],
  };
  return { p: 'separator', k: 'b', d: 'r', v: 1, fw: 1, cal: 'ctr', b: [], kids: [line('line'), text, line('line-end', { sh: slot?.text.visible })] };
}

function fieldTitle(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return { p: 'root', k: 'b', d: 'r', v: 1, b: [], kids: [textOf(h, 'title', 'Title', 'title.font-size', 'title.fg', { tp: h.contentName('label') })] };
}

// The shell is full width with no padding of its own: an addon with its own start padding, gap and block padding, and the
// input filling the rest with its own padding (the styles' slotted input and addon).
function inputGroup(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const { b, ring } = inputBox(h, ctx);
  const addon: RecipeNode = {
    p: 'addon', k: 'b', d: 'r', v: 1,
    b: [[h.first('addon.padding-x'), 'padl'], [h.first('addon.padding-y'), 'pady'], [h.first('addon.gap'), 'gap']].filter(([t]) => t),
    kids: [{ p: 'icon', k: 'i', v: 1, i: h.iconSet('search'), b: [[h.first('icon-size'), 'wh'], [h.first('addon.fg'), 'strokeOfVector']].filter(([t]) => t) }],
  };
  const input: RecipeNode = {
    p: 'input', k: 'b', d: 'r', v: 1, grow: 1, al: 'min',
    b: [[h.first('input.padding-x'), 'padx'], [h.first('input.padding-y'), 'pady']].filter(([t]) => t),
    kids: [textOf(h, 'input-text', 'Search', 'input.font-size', 'input.fg')],
  };
  return {
    p: 'group', k: 'b', d: 'r', v: 1, fw: 1,
    b: [[h.first('height'), 'h'], [h.first('radius'), 'radius'], ...b],
    kids: [addon, input, ...(ring ? [focusRing(h.first, { invalid: ctx.invalid, radius: h.first('radius') })] : [])],
  };
}

function label(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  return { p: 'label', k: 'b', d: 'r', v: 1, b: dimOf(h, ctx), kids: [textOf(h, 'label-text', 'Label', 'font-size', 'fg')] };
}

function slider(ctx: ComboContext, h: RecipeHelpers): RecipeNode {
  const vertical = ctx.codes.orientation === 'vertical';
  const ring = ctx.state === 'focus-visible';
  const stroke = ctx.invalid ? h.first('border-invalid') : h.first('thumb.border');
  const range = h.part('thumb')?.figma.name ?? null;
  const bar = (p: string, fill: string, extra: Partial<RecipeNode> = {}): RecipeNode => ({
    p, k: 'b', d: 'r', v: 1, grow: 1,
    b: [[h.first('track.size'), vertical ? 'w' : 'len'], [h.first('track.radius'), 'radius'], [h.first(fill), 'fill']].filter(([t]) => t),
    ...extra,
  });
  const thumb = (p: string, extra: Partial<RecipeNode> = {}): RecipeNode => ({
    p, k: 'b', d: 'r', v: 1,
    b: [[h.first('thumb.size'), 'wh'], [h.first('track.radius'), 'radius'], [h.first('thumb.bg'), 'fill'], [stroke, 'stroke'], [h.first('thumb.border-width'), 'sw'], ...(ring && !extra.sh ? [] : [[h.first('thumb.shadow'), 'effect']])].filter(([t]) => t),
    kids: ring && !extra.sh ? [focusRing(h.first, { radius: h.first('track.radius') })] : [],
    ...extra,
  });
  const second: Partial<RecipeNode> | null = range ? { v: 0, sh: range } : null;
  const control: RecipeNode = {
    p: 'control', k: 'b', d: vertical ? 'c' : 'r', v: 1, cal: 'ctr',
    b: [...(vertical ? [[h.first('vertical-length'), 'len']].filter(([t]) => t) : []), ...dimOf(h, ctx)],
    kids: [...(second ? [bar('track-start', 'track.bg', second), thumb('thumb-start', second)] : []), bar('range', 'range.bg'), thumb('thumb'), bar('track', 'track.bg')],
  };
  return fieldColumn(h, ctx, control);
}

export const RECIPES: Record<string, Recipe> = {
  checkbox, switch: switchRecipe, toggle, 'toggle-group': toggleGroup, 'radio-group': radioGroup,
  textarea, 'native-select': nativeSelect, field, 'input-group': inputGroup, label, slider,
  'field/field-set': fieldSet, 'field/field-group': fieldGroup, 'field/field-separator': fieldSeparator, 'field/field-title': fieldTitle,
};
