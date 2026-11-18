import type { Locator } from '@playwright/test';

// An unslotted child of a shadow host isn't rendered, so its computed style wouldn't resolve: the probe goes beside the host.
export const tokenColor = (el: Locator, token: string) =>
  el.evaluate((node, name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    node.after(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);

// A length token resolved to px the same way, so size assertions follow the brand (radius.style, density)
// instead of hard-coding the default brand's numbers.
export const tokenLength = (el: Locator, token: string) =>
  el.evaluate((node, name) => {
    const probe = document.createElement('span');
    probe.style.borderTopLeftRadius = `var(${name})`;
    node.after(probe);
    const length = getComputedStyle(probe).borderTopLeftRadius;
    probe.remove();
    return length;
  }, token);

// The same probe as a number, for boundingBox comparisons: `tokenPx(el, <a padding token>)` is 16 in the
// default brand and whatever the brand's spacing grid and density make it elsewhere. Works for any <length> token
// (padding, gap, size, font-size, radius, border-width), including rem and calc().
export const tokenPx = async (el: Locator, token: string) => parseFloat(await tokenLength(el, token));

// A unitless number token (line-height ratio, font-weight) resolved by the same probe.
export const tokenNumber = (el: Locator, token: string) =>
  el.evaluate((node, name) => {
    const probe = document.createElement('span');
    probe.style.flexGrow = `var(${name})`;
    node.after(probe);
    const value = parseFloat(getComputedStyle(probe).flexGrow);
    probe.remove();
    return value;
  }, token);

// A line-height token as the px it lays out to: unitless ratios depend on the font size, so name that token too
// (`tokenLineHeight(el, <line-height token>, <font-size token>)`). A dimension token ignores the font size.
export const tokenLineHeight = (el: Locator, token: string, fontSizeToken: string) =>
  el.evaluate(
    (node, [name, size]) => {
      const probe = document.createElement('span');
      probe.style.fontSize = `var(${size})`;
      probe.style.lineHeight = `var(${name})`;
      node.after(probe);
      const height = getComputedStyle(probe).lineHeight;
      probe.remove();
      return height;
    },
    [token, fontSizeToken],
  );

// A time token resolved to seconds (transition-duration probe), so motion assertions follow the brand's motion preset.
export const tokenSeconds = (el: Locator, token: string, factor = 1) =>
  el.evaluate(
    (node, [name, f]) => {
      const probe = document.createElement('span');
      probe.style.transitionDuration = `calc(var(${name}) * ${f})`;
      node.after(probe);
      const value = getComputedStyle(probe).transitionDuration;
      probe.remove();
      return parseFloat(value) * (value.endsWith('ms') ? 0.001 : 1);
    },
    [token, factor] as const,
  );
