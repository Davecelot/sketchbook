import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { discoverComponents } from '../../scripts/discover-components.mjs';
import type { ComponentContract, Element } from '../../generated/types/contract.js';
import type { CheckContext, CheckIssue, CheckResult } from './types.mjs';

export const id = 'C3';
export const title = 'Code matches its contract (props, parts, slots, events)';

// Props a mixin provides, so the component class doesn't redeclare them.
const MIXIN_PROPS: Record<string, string[]> = { 'FormAssociated(': ['name', 'disabled', 'required'], 'NativeControl(': ['label', 'description'] };
// Events a mixin dispatches on the host.
const MIXIN_EVENTS: Record<string, string[]> = { 'NativeControl(': ['change'] };
const camel = (s: string): string => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export function run({ root, all }: CheckContext): CheckResult {
  const errors: CheckIssue[] = [];
  const found = discoverComponents(root);
  for (const el of found) {
    // A tag is either a contract's main element or one of its family's sub-elements (contract.elements).
    let entry = all.contracts.find((c) => c.contract?.tag === el.tag);
    let api: ComponentContract | Element | undefined = entry?.contract;
    if (!entry) {
      entry = all.contracts.find((c) => (c.contract?.elements || []).some((e) => e.tag === el.tag));
      api = entry?.contract?.elements?.find((e) => e.tag === el.tag);
    }
    if (!entry || !api) { errors.push({ file: el.file, token: el.tag, msg: `<${el.tag}> has no contract`, fix: 'Write the contract first (contract-first), or list it in its family contract\'s elements.' }); continue; }
    const { file } = entry;
    const contract = api;
    const text = readFileSync(join(root, el.file), 'utf8');
    const actualProps = new Set<string>(el.props);
    for (const [needle, props] of Object.entries(MIXIN_PROPS)) if (text.includes(needle)) props.forEach((p) => actualProps.add(p));
    const declared = Object.entries(contract.props || {}).filter(([, p]) => !['slot', 'instanceSwap'].includes(p.type)).map(([n]) => camel(n));
    const where = { file: el.file };
    for (const p of declared) if (!actualProps.has(p)) errors.push({ ...where, token: p, msg: `contract prop "${p}" is not a @property of ${el.className}`, fix: 'Implement it, or change the contract first.' });
    for (const p of actualProps) if (!declared.includes(p)) errors.push({ ...where, token: p, msg: `@property "${p}" is not in ${file}`, fix: 'Add it to the contract, or remove it from the code.' });
    const parts = new Set((contract.anatomy || []).map((a) => a.part).filter((p): p is string => Boolean(p)));
    for (const p of parts) if (!el.parts.includes(p)) errors.push({ ...where, token: p, msg: `contract part "${p}" is not rendered (part="${p}")`, fix: 'Render it, or change the contract.' });
    for (const p of el.parts) if (!parts.has(p)) errors.push({ ...where, token: p, msg: `part="${p}" is not in the contract anatomy`, fix: 'Add it to anatomy, or remove it.' });
    const slots = new Set(Object.keys(contract.content || {}));
    for (const s of slots) if (!el.slots.includes(s)) errors.push({ ...where, token: s, msg: `contract slot "${s}" is not rendered`, fix: 'Render the <slot>, or change the contract.' });
    for (const s of el.slots) if (!slots.has(s)) errors.push({ ...where, token: s, msg: `<slot${s === 'default' ? '' : ` name="${s}"`}> is not in the contract content`, fix: 'Add it to content, or remove it.' });
    const dispatched = new Set(el.events);
    for (const [needle, evs] of Object.entries(MIXIN_EVENTS)) if (text.includes(needle)) evs.forEach((e) => dispatched.add(e));
    const events = Object.entries(contract.events || {}).filter(([, e]) => !e.native).map(([n]) => n);
    for (const e of events) if (!dispatched.has(e)) errors.push({ ...where, token: e, msg: `contract event "${e}" is never dispatched`, fix: 'Dispatch it, or mark it native / remove it.' });
    for (const e of el.events) if (!(e in (contract.events || {}))) errors.push({ ...where, token: e, msg: `dispatches "${e}", which is not in the contract`, fix: 'Add it to events.' });
  }
  return { errors, info: found.map((f) => ({ tag: f.tag, file: f.file })) };
}
