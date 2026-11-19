import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { API_FILE, PRACTICES_FILE, auditApi, loadPractices, valuesOf } from '../../lib/api.mjs';
import { errorMessage, parseJson } from '../../lib/files.mjs';
import type { HarnessConfigJson } from '../../../generated/types/harness-config.js';
import type { LayerNode } from '../../lib/design/library.mjs';
import type { Command } from '../types.mjs';

const ACTIONS = ['list', 'check', 'explain', 'figma', 'practices'];
const MARK = { canonical: ' ', alias: '~', extension: '+', unregistered: '!' };

export default {
  name: 'api',
  group: 'components',
  summary: 'Look up component property, event, and state names in the shared API vocabulary.',
  subcommands: ACTIONS,
  args: [
    { name: 'action', required: false, description: 'list (default) | check | explain' },
    { name: 'name', required: false, description: 'list: a component; explain: a prop, content or state name; practices: an aspect' },
  ],
  options: {},
  examples: ['sketchbook api list', 'sketchbook api list button', 'sketchbook api check', 'sketchbook api explain selected'],
  mutates: false,
  async run({ root, args, out }) {
    const [action = 'list', name] = args;
    if (!ACTIONS.includes(action)) throw Object.assign(new Error(`Unknown api action "${action}".`), { fix: `Use ${ACTIONS.join(' | ')}.` });
    const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
    const a = auditApi(root, config.prefix);

    if (action === 'practices') {
      const practices = loadPractices(root);
      if (!practices) throw Object.assign(new Error(`No ${PRACTICES_FILE}.`), { fix: 'Add spec/figma-practices.json (docs/figma-practices.md).' });
      const aspects = Object.entries(practices.aspects);
      if (name && !practices.aspects[name]) throw Object.assign(new Error(`"${name}" is not an aspect in ${PRACTICES_FILE}.`), { fix: `Use ${Object.keys(practices.aspects).join(' | ')}.` });
      for (const [aspect, a] of aspects.filter(([k]) => !name || k === name)) {
        out(name ? `${aspect}: ${a.question}` : `${aspect.padEnd(18)} ${a.adopted}`);
        if (!name) continue;
        for (const [option, o] of Object.entries(a.options)) out(`  ${option === a.adopted ? '*' : ' '} ${option}${o.seenIn.length ? ` (${o.seenIn.map((s) => practices.sources[s]?.name.split(' (')[0]).join(', ')})` : ''}: ${o.summary}`);
        out(`  why: ${a.reason}`);
      }
      if (!name) out('\n  sketchbook api practices <aspect> shows the options and why one is adopted.');
      return { data: { aspects: Object.fromEntries(aspects.map(([k, a]) => [k, a.adopted])) } };
    }
    if (action === 'figma') {
      if (!name) throw Object.assign(new Error('Usage: sketchbook api figma <component>'), { fix: 'sketchbook api list' });
      const { libraryModel } = await import('../../lib/design/library.mjs');
      const L = await libraryModel(root, name).catch((e: unknown) => { throw Object.assign(new Error(`${name}: ${errorMessage(e)}`), { fix: 'sketchbook list' }); });
      const props = new Map<string, string>();
      const walk = (n: LayerNode): void => { for (const [k, key] of [['tp', 'TEXT'], ['sh', 'BOOLEAN'], ['sw', 'INSTANCE_SWAP']] as const) { const p = n[k]; if (p) props.set(p, key); } (n.kids ?? []).forEach((c) => c && typeof c === 'object' && walk(c)); };
      L.variants.forEach((v) => walk(v.tree));
      out(`${L.title}: ${L.variants.length} variant(s) (${L.skip.length} excluded combination(s))`);
      for (const a of L.axes) out(`  axis ${a.name}: ${a.values.join(' | ')}`);
      for (const [p, t] of props) out(`  property ${p} (${t})`);
      if (!L.axes.length && !props.size) out('  no axes, no properties');
      const { parityOf } = await import('../../lib/design/parity.mjs');
      const parity = await parityOf(root, name);
      if (parity) {
        out(`  tokens drawn: ${parity.bound.length}, all used by the component styles${parity.notInCss.length ? ` EXCEPT ${parity.notInCss.join(', ')}` : ''}`);
        if (parity.layersNotInAnatomy.length || parity.anatomyNotDrawn.length) out(`  layers with no anatomy part: ${parity.layersNotInAnatomy.join(', ') || 'none'}; anatomy parts not drawn: ${parity.anatomyNotDrawn.join(', ') || 'none'}`);
        out(`  used by the styles and not drawn: ${parity.notDrawn.length ? parity.notDrawn.join(', ') : 'none'} (typography and motion are applied by styles)`);
      }
      return { data: { axes: L.axes, properties: [...props], variants: L.variants.length, parity } };
    }
    if (action === 'explain') {
      if (!name) throw Object.assign(new Error('Usage: sketchbook api explain <name>'), { fix: 'sketchbook api list' });
      const entry = a.api.props[name] ?? a.api.content[name] ?? null;
      const used = a.rows.filter((r) => r.prop === name || r.to === name);
      if (!entry && !used.length) throw Object.assign(new Error(`"${name}" is not in ${API_FILE} and no contract uses it.`), { fix: 'sketchbook api list' });
      if (entry) {
        const values = valuesOf(a.api, name);
        out(`${name}: ${entry.meaning}\n  type ${'type' in entry ? entry.type : entry.kind}${values ? `, values ${values.join(' | ')}` : ''}\n  design file: ${entry.figma ? JSON.stringify(entry.figma) : 'not drawn'}${'proposal' in entry && entry.proposal ? '\n  (proposal, not confirmed)' : ''}`);
      }
      for (const r of used) out(`  ${r.component}.${r.prop} -> ${r.status}${r.to && r.to !== r.prop ? ` as ${r.to}` : ''}${r.values.filter((v) => v.from !== v.to).map((v) => `, ${v.from}=${v.to}`).join('')}`);
      return { data: { entry, used } };
    }

    const rows = a.rows.filter((r) => !name || r.component === name);
    if (action === 'list') {
      let last = '';
      for (const r of rows) {
        if (r.component !== last) { out(`\n${r.component}`); last = r.component; }
        const values = r.values.filter((v) => v.status !== 'identity').map((v) => `${v.from}${v.to && v.to !== v.from ? `->${v.to}` : ''}${v.status === 'extension' ? '(ext)' : v.status === 'unmapped' ? '(?)' : ''}`);
        out(`  ${MARK[r.status]} ${r.prop.padEnd(14)} ${r.status === 'alias' ? `-> ${r.in === 'content' ? 'content.' : ''}${r.to}` : r.status === 'unregistered' ? 'NOT REGISTERED' : ''}${values.length ? `  [${values.join(', ')}]` : ''}${r.proposal ? '  (proposal)' : ''}`);
      }
      out('\n  = canonical   ~ alias (code spells it differently)   + extension (component-specific)   ! not registered');
    }
    const t = a.totals;
    out(`\n${t.props} props: ${t.canonical} canonical, ${t.alias} alias, ${t.extension} extension, ${t.unregistered} unregistered; ${t.unmappedValues} unmapped value(s). Events: ${t.events} (${t.eventAliases} alias). States: ${t.states} (${t.stateAliases} alias).`);
    const bad = a.bad;
    if (action === 'check' && bad.length) {
      for (const b of bad) out(`  ${b.component}.${'prop' in b ? b.prop : 'event' in b ? b.event : b.state}: ${b.status === 'unregistered' || !('values' in b) ? 'not in the registry' : `unmapped value(s) ${b.values.filter((v) => v.status === 'unmapped').map((v) => v.from).join(', ')}`}`);
    }
    return { data: { totals: t, unregistered: bad.length }, exitCode: action === 'check' && bad.length ? 1 : 0, next: bad.length ? 'Register the name in spec/api.json (aliases or extensions).' : 'sketchbook check' };
  },
} satisfies Command;
