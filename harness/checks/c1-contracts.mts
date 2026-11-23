import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatter } from '../lib/claude-layer.mjs';
import { errorCode } from '../lib/files.mjs';
import { validate } from '../lib/schema.mjs';
import { schemaOrThrow, type CheckContext, type CheckIssue, type CheckResult } from './types.mjs';

export const id = 'C1';
export const title = 'Contracts are valid and match the registry';

const NAMESPACE = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

interface ExtensionIssue { token: string; msg: string; fix: string }

function extensionErrors(ext: Record<string, unknown> | undefined): ExtensionIssue[] {
  const out: ExtensionIssue[] = [];
  for (const [ns, body] of Object.entries(ext ?? {})) {
    if (!NAMESPACE.test(ns)) out.push({ token: ns, msg: `$extensions key "${ns}" is not a dotted namespace`, fix: 'Name it like design.figma.' });
    if (ns !== 'design.figma') continue;
    const seen = new Set<unknown>();
    const options = (isRecord(body) ? body.options : undefined) ?? [];
    if (!isArray(options)) throw new TypeError(`$extensions.design.figma.options is not an array`);
    for (const [i, item] of options.entries()) {
      const o = isRecord(item) ? item : {};
      const name = String(o.name);
      const values = isArray(o.values) ? o.values : undefined;
      const shows = isArray(o.shows) ? o.shows : undefined;
      const at = `$extensions.design.figma.options[${i}]`;
      if (!o.name || typeof o.kind !== 'string' || !['enum', 'boolean'].includes(o.kind)) { out.push({ token: at, msg: `${at} needs a name and a kind (enum or boolean)`, fix: 'Declare { name, kind, default, shows, reason }.' }); continue; }
      if (seen.has(o.name)) out.push({ token: at, msg: `option "${name}" is declared twice`, fix: 'Option names are unique per component.' });
      seen.add(o.name);
      if (!(typeof o.reason === 'string' && o.reason.trim())) out.push({ token: at, msg: `option "${name}" has no reason`, fix: 'Say why the design file has an option the code does not.' });
      if (o.kind === 'enum' && !values?.length) out.push({ token: at, msg: `enum option "${name}" has no values`, fix: 'List the values, default included.' });
      if (o.kind === 'enum' && !values?.includes(o.default)) out.push({ token: at, msg: `option "${name}" default is not one of its values`, fix: 'Pick a default from values.' });
      if (o.kind === 'boolean' && (!shows?.length || shows.some((x) => typeof x !== 'string' || !x))) out.push({ token: at, msg: `option "${name}" lists no layers in shows`, fix: 'Name the layers the option reveals.' });
    }
  }
  return out;
}

const kebab = (s: string): string => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export function run({ root, all, schemas, registry, config }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const warnings: CheckIssue[] = [];
  for (const e of validate(schemaOrThrow(schemas.registry, 'registry'), registry)) errors.push({ file: 'spec/registry.json', msg: e, fix: 'Match spec/schemas/registry.schema.json.' });
  for (const { name, file, contract, error } of all.contracts) {
    if (error) { errors.push({ file, msg: `not valid JSON: ${error}`, fix: 'Fix the JSON syntax.' }); continue; }
    for (const e of validate(schemaOrThrow(schemas.contract, 'contract'), contract)) errors.push({ file, msg: e, fix: 'Match spec/schemas/contract.schema.json.' });
    if (!contract?.component) continue;
    for (const e of extensionErrors(contract.$extensions)) errors.push({ file, ...e });
    const k = kebab(contract.component);
    const expectedTag = `${config.prefix}-${k}`;
    if (contract.tag !== expectedTag) errors.push({ file, msg: `tag "${contract.tag}" should be "${expectedTag}"`, fix: 'Tags are <prefix>-<kebab name> (prefix from harness.config.json).' });
    if (k !== name) errors.push({ file, msg: `folder "${name}" does not match component "${contract.component}"`, fix: `Rename the folder to spec/components/${k}.` });
    for (const path of Object.keys(contract.tokens || {})) if (!path.startsWith(`${k}.`)) errors.push({ file, token: path, msg: `component token does not start with "${k}."`, fix: `Rename it to ${k}.<part>.` });
    const entry = registry.components.find((c) => kebab(c.name.replace(/ /g, '')) === name || c.name === contract.component);
    if (!entry) errors.push({ file, msg: `${contract.component} is not in spec/registry.json`, fix: 'Add it to the registry.' });
    else if (entry.status !== contract.status) errors.push({ file, msg: `status "${contract.status}" differs from registry "${entry.status}"`, fix: 'Keep the contract and registry status equal.' });
    const markdown = `spec/components/${name}/contract.md`;
    const front = (() => {
      try { return frontmatter(readFileSync(join(root, markdown), 'utf8').replace(/\r\n/g, '\n')); }
      catch (e) { if (errorCode(e) === 'ENOENT') return null; throw e; }
    })();
    for (const key of ['status', 'version'] as const) {
      const value = front?.[key];
      if (typeof value !== 'string' || contract[key] === undefined || value === contract[key]) continue;
      // Existing downstream projects own their Markdown; an engine upgrade must not block them on old prose.
      (config.catalog?.source ? errors : warnings).push({ file: markdown, msg: `${key} "${value}" differs from contract.json "${contract[key]}"`, fix: `Update the Markdown ${key} to match contract.json.` });
    }
    for (const [prop, p] of Object.entries(contract.props || {})) {
      if (p.type === 'variant' && !p.values?.length) errors.push({ file, token: prop, msg: 'variant prop without values', fix: 'List the allowed values.' });
      if (p.type === 'variant' && p.default != null && p.values && !p.values.some((v) => v === p.default)) errors.push({ file, token: prop, msg: `default "${p.default}" is not one of its values`, fix: 'Pick a default from values.' });
    }
    for (const [dim, values] of Object.entries(contract.variantMatrix?.dimensions || {})) {
      const p = contract.props?.[dim];
      if (!p) errors.push({ file, token: dim, msg: `variantMatrix dimension "${dim}" is not a prop`, fix: 'Add the prop, or remove the dimension.' });
      else if (p.values && values.join() !== p.values.join()) errors.push({ file, token: dim, msg: `variantMatrix values differ from props.${dim}.values`, fix: 'Keep one list; the matrix must match the prop.' });
    }
    const open = (contract.openQuestions || []).filter((q) => q.status === 'open');
    if (open.length && ['beta', 'stable'].includes(contract.status)) errors.push({ file, msg: `${open.length} open question(s) at status ${contract.status}`, fix: 'Answer them before beta.' });
  }
  return { errors, warnings };
}
