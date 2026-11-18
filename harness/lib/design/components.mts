// Contracts for the design file: the variant matrix the library component and its doc show, and the stamp hash.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Accessibility, ComponentContract, Element, Part } from '../../../generated/types/contract.js';
import { parseJson } from '../files.mjs';
import { behaviorOf } from './description.mjs';

export type DesignContract = Omit<ComponentContract, 'platforms' | 'anatomy' | 'accessibility' | 'realizations' | 'openQuestions'> & {
  anatomy?: Part[];
  accessibility: Partial<Accessibility>;
  realizations?: ComponentContract['realizations'];
  elementOf?: string;
};
export interface MatrixDim { name: string; values: string[] }
export type MatrixCell = { props: Record<string, string> } | { props: null; reason: unknown };
export interface LibraryMatrix { dims: MatrixDim[]; cells: MatrixCell[] }

// A set name is a component folder, or "<component>/<element>" for an element drawn as its own set (spec/api.json sets).
export const folderOf = (name: string): string => name.split('/')[0] ?? name;
const cap = (s: string): string => (s[0] ?? '').toUpperCase() + s.slice(1);

export async function contractOf(root: string, name: string): Promise<DesignContract> {
  const contract = parseJson<ComponentContract>(await readFile(join(root, 'spec/components', folderOf(name), 'contract.json'), 'utf8'));
  const element = name.split('/')[1];
  return element ? elementContract(contract, element) : contract;
}

// An element as a contract of its own: its tag, summary, props, anatomy and content, and the tokens of its component.
export function elementContract(contract: ComponentContract, element: string): DesignContract {
  const e: (Element & Partial<Pick<ComponentContract, 'states' | 'accessibility'>>) | undefined = (contract.elements ?? []).find((x) => x.tag.replace(/^[^-]+-/, '') === element);
  if (!e) throw Object.assign(new Error(`${contract.component} has no element "${element}".`), { fix: `Elements: ${(contract.elements ?? []).map((x) => x.tag).join(', ') || 'none'}.` });
  return {
    component: element.split('-').map(cap).join(''), tag: e.tag, summary: e.summary, status: contract.status,
    props: e.props ?? {}, anatomy: e.anatomy ?? [], content: e.content ?? {}, states: e.states ?? {}, events: e.events ?? {},
    accessibility: e.accessibility ?? {}, tokens: contract.tokens ?? {}, dependsOn: [contract.component], elementOf: contract.component, $extensions: contract.$extensions,
  };
}

// What the design file shows of a component: the contract and the Behavior paragraph of contract.md (its description).
// Realizations are what was built from it, so writing them back (sync realize) is not a change to draw again.
export const contractHash = (contract: DesignContract, md = ''): string => createHash('sha256').update(JSON.stringify({ ...contract, realizations: undefined }) + behaviorOf(md)).digest('hex').slice(0, 16);
export const mdOf = (root: string, name: string): Promise<string> => readFile(join(root, 'spec/components', folderOf(name), 'contract.md'), 'utf8').catch(() => '');
const INPUT_STATES = ['Default', 'Invalid', 'Disabled'];

// The variant matrix of a contract: dims (component property names, capitalized, with their values) and cells in product
// order (first dimension major). A cell has props, or props null and a reason where the contract excludes the
// combination, so rows and columns keep their grid.
export function libraryMatrix(contract: Pick<DesignContract, 'variantMatrix'>, name: string): LibraryMatrix {
  if (name === 'input') return { dims: [{ name: 'State', values: INPUT_STATES }], cells: INPUT_STATES.map((State) => ({ props: { State } })) };
  const dims = Object.entries(contract.variantMatrix?.dimensions || {});
  const excluded = contract.variantMatrix?.excludedCombinations || [];
  if (!dims.length) return { dims: [], cells: [{ props: {} }] };
  let combos: Record<string, string>[] = [{}];
  for (const [d, values] of dims) combos = combos.flatMap((c) => values.map((v) => ({ ...c, [d]: v })));
  const hit = (c: Record<string, string>) => excluded.find((x) => Object.entries(x).every(([k, v]) => k === 'reason' || c[k] === v));
  return {
    dims: dims.map(([d, values]) => ({ name: cap(d), values })),
    cells: combos.map((c): MatrixCell => { const x = hit(c); return x ? { props: null, reason: x.reason ?? '' } : { props: Object.fromEntries(Object.entries(c).map(([k, v]) => [cap(k), v])) }; }),
  };
}

export const libraryVariants = (contract: Pick<DesignContract, 'variantMatrix'>, name: string): Record<string, string>[] => libraryMatrix(contract, name).cells.flatMap((c) => (c.props ? [c.props] : []));

// Sample text for the library components: the contract's own anatomy part names, never invented copy.
export const sampleText = (contract: Pick<DesignContract, 'anatomy'>): Record<string, string> => Object.fromEntries((contract.anatomy || []).map((a) => [a.name, cap(a.name.replace(/-/g, ' '))]));
