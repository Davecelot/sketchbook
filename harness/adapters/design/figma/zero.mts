// Every use_figma script that draws something binds the zeros it drew: a 0 padding, gap or corner of an auto-layout
// frame or component, and the unused sides of a one-sided stroke, take the semantic zero of their kind (SB-0081).
// Instances are left alone: their values come from their own component.
import type { FigmaModel } from './variables.mjs';

export const ZERO = { radius: 'radius.square', border: 'border-width.none', space: 'space.none' };
export type ZeroVars = Record<string, string | undefined>;

// token -> "Collection::Name" for the three zeros; throws when the file model lacks one.
export function zeroVars(model: Pick<FigmaModel, 'collections'>): ZeroVars {
  const varOf = new Map(model.collections.flatMap((c) => c.variables.map((v) => [v.token, `${c.name}::${v.name}`])));
  const Z: ZeroVars = Object.fromEntries(Object.entries(ZERO).map(([k, t]) => [k, varOf.get(t)]));
  const missing = Object.entries(ZERO).filter(([k]) => !Z[k]).map(([, t]) => t);
  if (missing.length) throw Object.assign(new Error(`The zero tokens are not in the design file model: ${missing.join(', ')}.`), { fix: 'Add them (sketchbook tokens add), then sketchbook sync tokens.' });
  return Z;
}

// Runtime: needs `figma` and a `cfg.Z` from zeroVars. Defines bindZeros(root) -> number of fields bound.
export const ZERO_RUNTIME = `const ZERO_FIELDS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing', 'counterAxisSpacing', 'topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];
const ZERO_SIDES = ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'];
const zeroKind = (f) => (/Radius$/.test(f) ? 'radius' : /Weight$/.test(f) ? 'border' : 'space');
let zeroVarsById = null;
const zeroVar = async (kind) => {
  if (!zeroVarsById) {
    const cs = Object.fromEntries((await figma.variables.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
    const all = await figma.variables.getLocalVariablesAsync();
    zeroVarsById = Object.fromEntries(Object.entries(cfg.Z).map(([k, n]) => [k, all.find((v) => cs[v.variableCollectionId] + '::' + v.name === n)]));
  }
  return zeroVarsById[kind];
};
const bindZeros = async (root) => {
  let count = 0;
  const walk = async (n) => {
    if ((n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') && n.layoutMode && n.layoutMode !== 'NONE') {
      const fields = ZERO_FIELDS.filter((f) => f in n && n[f] === 0 && !(n.boundVariables && n.boundVariables[f]) && (f !== 'counterAxisSpacing' || n.layoutWrap === 'WRAP'));
      if (n.strokes && n.strokes.length && ZERO_SIDES.some((f) => n.boundVariables && n.boundVariables[f])) fields.push(...ZERO_SIDES.filter((f) => n[f] === 0 && !(n.boundVariables && n.boundVariables[f])));
      for (const f of fields) { const v = await zeroVar(zeroKind(f)); if (v) { n.setBoundVariable(f, v); count++; } }
    }
    if (n.type !== 'INSTANCE' && 'children' in n) for (const c of n.children) await walk(c);
  };
  await walk(root);
  return count;
};
`;
