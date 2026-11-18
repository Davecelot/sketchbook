import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validate } from '../lib/schema.mjs';
import { engineSchema, parseJson } from '../lib/files.mjs';
import { API_FILE, PRACTICES_FILE, auditApi, loadApi, loadPractices } from '../lib/api.mjs';
import type { ComponentContract } from '../../generated/types/contract.js';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'A1';
export const title = 'Contracts speak the API vocabulary (every prop, event and state key is registered); design-file practices name an adopted option';

const contractOf = (root: string, component: string): Promise<ComponentContract | null> => readFile(join(root, 'spec/components', component, 'contract.json'), 'utf8').then((t) => parseJson<ComponentContract | null>(t)).catch(() => null);

function practiceErrors(root: string): CheckIssue[] {
  const practices = loadPractices(root);
  if (!practices) return [];
  const errors: CheckIssue[] = [];
  const schema = engineSchema('figma-practices', root);
  if (schema) for (const e of validate(schema, practices)) errors.push({ file: PRACTICES_FILE, msg: e, fix: 'Match spec/schemas/figma-practices.schema.json.' });
  for (const [aspect, a] of Object.entries(practices.aspects ?? {})) {
    if (!a.options?.[a.adopted]) errors.push({ file: PRACTICES_FILE, token: aspect, msg: `aspect "${aspect}" adopts "${a.adopted}", which is not one of its options`, fix: `Adopt one of: ${Object.keys(a.options ?? {}).join(', ')}.` });
    for (const [option, o] of Object.entries(a.options ?? {})) for (const s of o.seenIn ?? []) if (!practices.sources?.[s]) errors.push({ file: PRACTICES_FILE, token: `${aspect}.${option}`, msg: `option "${option}" of "${aspect}" cites source "${s}", which is not in sources`, fix: 'Add the source or fix the name.' });
  }
  return errors;
}

// A project without spec/api.json has not adopted the vocabulary: nothing to check.
export async function run({ root, config }: CheckContext): Promise<CheckResult> {
  const api = loadApi(root);
  if (!api) return { errors: [], info: [`no ${API_FILE}`] };
  const errors = practiceErrors(root);
  const schema = engineSchema('api', root);
  if (schema) for (const e of validate(schema, api)) errors.push({ file: API_FILE, msg: e, fix: 'Match spec/schemas/api.schema.json.' });

  for (const [key, alias] of Object.entries(api.aliases ?? {})) {
    const component = key.includes('.') ? key.split('.')[0] : null;
    const known = alias.in === 'content' ? api.content?.[alias.to] : api.props?.[alias.to] ?? api.extensions?.[component ? `${component}.${alias.to}` : alias.to] ?? api.extensions?.[alias.to];
    if (!known) errors.push({ file: API_FILE, token: key, msg: `alias "${key}" points at "${alias.to}", which is neither a canonical name nor an extension`, fix: 'Register the canonical name in props or content, or an extension for it.' });
  }
  for (const [key, part] of Object.entries(api.parts ?? {})) {
    const [component = '', name] = key.split('.');
    const contract = await contractOf(root, component);
    if (!contract) continue;
    if (!contract.anatomy?.some((a) => a.name === name)) errors.push({ file: API_FILE, token: key, msg: `parts "${key}" names a part that ${component}'s anatomy does not have`, fix: 'Use <component>.<anatomy part name>.' });
    else if (!contract.props?.[part.repeats]) errors.push({ file: API_FILE, token: key, msg: `parts "${key}" repeats per "${part.repeats}", which is not a prop of ${component}`, fix: 'Name the contract prop whose value sets the count.' });
  }
  for (const key of Object.keys(api.sets ?? {})) {
    const [component = '', element] = key.split('.');
    const contract = await contractOf(root, component);
    if (!contract) continue;
    if (!(contract.elements ?? []).some((e) => e.tag.replace(/^[^-]+-/, '') === element)) errors.push({ file: API_FILE, token: key, msg: `sets "${key}" names an element that ${component}'s contract does not have`, fix: `Elements: ${(contract.elements ?? []).map((e) => e.tag).join(', ') || 'none'}.` });
  }
  for (const [key, region] of Object.entries(api.regions ?? {})) {
    const component = key.split('.')[0] ?? '';
    if (!(await readFile(join(root, 'spec/components', component, 'contract.json'), 'utf8').catch(() => null))) continue;
    for (const p of region.preferred ?? []) if (!(await readFile(join(root, 'spec/components', p, 'contract.json'), 'utf8').catch(() => null))) errors.push({ file: API_FILE, token: key, msg: `regions "${key}" prefers "${p}", which is not a component`, fix: 'Name a component folder under spec/components.' });
  }
  for (const key of Object.keys(api.slots ?? {})) {
    const [component = '', slot] = key.split('.');
    const contract = await contractOf(root, component);
    if (contract && contract.status !== 'draft' && !contract.content?.[String(slot)]) errors.push({ file: API_FILE, token: key, msg: `slots "${key}" names a slot that ${component}'s content does not have`, fix: 'Use <component>.<content key>.' });
  }
  for (const [name, p] of Object.entries(api.props ?? {})) {
    if (typeof p.values === 'string' && !api.vocabularies?.[p.values]) errors.push({ file: API_FILE, token: name, msg: `values "${p.values}" is not a vocabulary`, fix: 'Add it to vocabularies.' });
  }

  const a = auditApi(root, config.prefix);
  for (const r of a.rows) {
    const file = `spec/components/${r.component}/contract.json`;
    if (r.status === 'unregistered') errors.push({ file, token: r.prop, msg: `prop "${r.prop}" is not in ${API_FILE}`, fix: 'Use a canonical name, or register an alias (code spells it differently) or an extension (component-specific, with a reason).' });
    for (const v of r.values.filter((x) => x.status === 'unmapped')) errors.push({ file, token: `${r.prop}=${v.from}`, msg: `value "${v.from}" of ${r.prop} is neither canonical nor mapped nor a registered extension value`, fix: `Map it in aliases.${r.component}.${r.prop}.values or list it in extensions.` });
  }
  for (const e of a.events.filter((x) => x.status === 'unregistered')) errors.push({ file: `spec/components/${e.component}/contract.json`, token: e.event, msg: `event "${e.event}" is not standard, not an alias and not prefixed with "${config.prefix}-"`, fix: 'Use change, input or click, or a custom event named with the element prefix.' });
  for (const s of a.states.filter((x) => x.status === 'unregistered')) errors.push({ file: `spec/components/${s.component}/contract.json`, token: s.state, msg: `state key "${s.state}" is not in ${API_FILE} states.keys`, fix: 'Register it with its canonical Title-case name.' });

  const t = a.totals;
  const warnings = t.alias + t.eventAliases + t.stateAliases
    ? [{ file: API_FILE, msg: `${t.alias} prop(s), ${t.eventAliases} event(s) and ${t.stateAliases} state key(s) still spell a canonical name differently (sketchbook api list)` }]
    : [];
  return { errors, warnings, info: [`${t.props} props: ${t.canonical} canonical, ${t.alias} alias, ${t.extension} extension`] };
}
