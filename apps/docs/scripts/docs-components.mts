import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseJson } from '../../../harness/lib/files.mjs';
import type { Accessibility, ComponentContract, Event, Prop } from '../../../generated/types/contract.js';
import type { ComponentRegistry } from '../../../generated/types/registry.js';

const requested = process.argv.slice(2);
const SHIPPED = new Set(['beta', 'stable', 'code-only']);
const registry = parseJson<ComponentRegistry>(await readFile('spec/registry.json', 'utf8'));
const names =
  requested.length > 0
    ? requested
    : registry.components.filter((c) => SHIPPED.has(c.status) && c.path).map((c) => c.path?.split('/').pop() ?? '');

const cell = (value: string | undefined) =>
  published(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
const code = (value: string | number | boolean | undefined) => `\`${value}\``;

// Drafting labels stay in contracts (editing one stales the design-file read-back, check D4); the published page drops them.
const published = (text: string | undefined) =>
  String(text ?? '')
    .replace(/;? ?owner to confirm \(Q\d+\)/g, '')
    .replace(/\(PROPOSAL\)/g, '')
    .replace(/ is a PROPOSAL so/g, ' is there so')
    .replace(/\bPROPOSAL[:.;,]\s*/g, '')
    .replace(/\s+\./g, '.')
    .trim();

function table(head: string[], rows: string[][]) {
  if (rows.length === 0) return '';
  const line = (cols: string[]) => `| ${cols.map(cell).join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}

function liveExample(contract: ComponentContract) {
  const variantProp = Object.entries(contract.props ?? {}).find(([, p]) => p.type === 'variant');
  if (!variantProp) {
    const label = contract.props?.label ? ` label="${contract.component}"` : '';
    return `  <${contract.tag}${label}></${contract.tag}>`;
  }
  const [propName, prop] = variantProp;
  return (prop.values ?? [])
    .filter((value) => !/^icon/.test(value))
    .map((value) => `  <${contract.tag} ${propName}="${value}">${value}</${contract.tag}>`)
    .join('\n');
}

async function example(name: string, contract: ComponentContract) {
  try {
    const html = (await readFile(`apps/docs/content/_examples/${name}.html`, 'utf8')).trim().replace(/\n\s*\n/g, '\n');
    return ['<div class="live-demo">', html, '</div>', '', '```html', html, '```'].join('\n');
  } catch {
    return ['<div class="live-demo">', liveExample(contract), '</div>'].join('\n');
  }
}

const propRows = (props: Record<string, Prop> | undefined) =>
  Object.entries(props ?? {}).map(([name, p]) => [
    code(name),
    p.type === 'variant' ? (p.values ?? []).map(code).join(', ') : p.type,
    p.default === undefined || p.default === null ? '' : code(p.default),
    p.note ?? ''
  ]);
const eventRows = (events: Record<string, Event> | undefined) => Object.entries(events ?? {}).map(([name, e]) => [code(name), e.note ?? '']);

function subElements(contract: ComponentContract) {
  return (contract.elements ?? [])
    .filter((el) => Object.keys(el.props ?? {}).length || Object.keys(el.events ?? {}).length)
    .flatMap((el) => [
      `### ${code(`<${el.tag}>`)}`,
      '',
      ...(el.summary ? [cell(el.summary), ''] : []),
      ...(Object.keys(el.props ?? {}).length ? [table(['Name', 'Type', 'Default', 'Notes'], propRows(el.props)), ''] : []),
      ...(Object.keys(el.events ?? {}).length ? [table(['Event', 'Notes'], eventRows(el.events)), ''] : [])
    ]);
}

function page(contract: ComponentContract, exampleBlock: string, name: string) {
  const props = propRows(contract.props);
  const events = eventRows(contract.events);
  const a11y: Partial<Accessibility> = contract.accessibility ?? {};

  return [
    '---',
    `title: "${contract.component}"`,
    `description: "${contract.summary.replace(/\s+/g, ' ').replace(/"/g, '\\"')}"`,
    '---',
    '',
    `<!-- Generated from spec/components/${name}/contract.json by npm run docs:components. Do not edit by hand. -->`,
    '',
    `Tag ${code(`<${contract.tag}>`)} · status ${code(contract.status)} · version ${code(contract.version)}`,
    '',
    '## Example',
    '',
    exampleBlock,
    '',
    '## Properties',
    '',
    table(['Name', 'Type', 'Default', 'Notes'], props),
    '',
    ...(events.length ? ['## Events', '', table(['Name', 'Notes'], events), ''] : []),
    ...(subElements(contract).length ? ['## Parts', '', ...subElements(contract)] : []),
    ...(Object.keys(a11y.keyboard ?? {}).length
      ? ['## Keyboard', '', table(['Key', 'Does'], Object.entries(a11y.keyboard ?? {}).map(([key, does]) => [code(key), does])), '']
      : []),
    '## Accessibility',
    '',
    ...(a11y.role ? [`- Role: ${code(a11y.role)}`] : []),
    ...(a11y.native ? [`- Native element: ${code(a11y.native)}`] : []),
    ...(a11y.accessibleNameSource ? [`- Accessible name: ${cell(a11y.accessibleNameSource)}`] : []),
    ...(a11y.formAssociation?.note ? [`- Form: ${cell(a11y.formAssociation.note)}`] : []),
    ''
  ].join('\n');
}

await mkdir('apps/docs/content/demo', { recursive: true });
for (const name of names) {
  const contract = parseJson<ComponentContract>(await readFile(`spec/components/${name}/contract.json`, 'utf8'));
  const title = registry.components.find((c) => c.path?.endsWith(`/${name}`))?.name ?? contract.component;
  await writeFile(
    `apps/docs/content/demo/${name}.md`,
    page({ ...contract, component: title }, await example(name, contract), name)
  );
}
