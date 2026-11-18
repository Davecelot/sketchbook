// A component's description for a design tool, built only from the source files: contract.json, contract.md and the
// names the library model draws. Tool-neutral Markdown (bold lead-ins and lists); an adapter puts it where its tool keeps one.
import type { DesignContract } from './components.mjs';

const MAX_SECTION = 420;
const MAX_ITEMS = 4;

const oneLine = (s: string | null | undefined): string => String(s ?? '').replace(/<([^>\s][^>]*)>/g, '$1').replace(/>=/g, 'at least').replace(/<=/g, 'at most').replace(/>/g, 'above').replace(/</g, 'below').replace(/\*/g, '∗').replace(/\s+/g, ' ').trim();
const clip = (s: string, n = MAX_SECTION): string => {
  const t = oneLine(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return `${(stop > n / 2 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`).trim()}`;
};
const sentence = (s: string): string => (/[.!?…]$/.test(s) ? s : `${s}.`);

// The "### Behavior" paragraph of the contract's usage section, without Markdown link syntax.
export function behaviorOf(md = ''): string {
  const body = /^### Behavior\s*\n([\s\S]*?)(?=\n#{2,3} |\s*$)/m.exec(md)?.[1];
  return body !== undefined ? clip(body.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`/g, '')) : '';
}

const list = (items: string[]): string => items.slice(0, MAX_ITEMS).map((i) => `- ${i}`).join('\n');

export interface DescribedAxis { name: string; values: string[] }
export interface DescribedProps { text: Map<string, unknown>; bool: Map<string, unknown>; swap: Map<string, unknown> }
export interface DescribedSlot { name: string; preferred: string[] }
export interface DescribeInput { contract: DesignContract; md: string; name: string; title: string; axes?: DescribedAxis[]; props?: DescribedProps; designSlots?: DescribedSlot[] }

// axes: [{ name, values }]; props: { text: Map name -> default, bool: Map, swap: Map } (what the library draws).
export function describeComponent({ contract, md, name, title, axes = [], props = { text: new Map(), bool: new Map(), swap: new Map() }, designSlots = [] }: DescribeInput): string {
  const out = [`**${title}**`, sentence(oneLine(contract.summary))];

  const behavior = behaviorOf(md);
  if (behavior) out.push(`**Behavior.** ${behavior}`);

  const use = (contract.aiHints?.useCases ?? []).map((u) => `${oneLine(u.when).replace(/[.]$/, '')}: ${sentence(oneLine(u.use))}`);
  if (use.length) out.push(`**Use when**\n${list(use)}`);

  const dont = (contract.aiHints?.antiPatterns ?? []).map((a) => `${oneLine(a.pattern).replace(/[.]$/, '')}: ${sentence(oneLine(a.why))}${a.alternative ? ` Instead: ${sentence(oneLine(a.alternative))}` : ''}`);
  if (dont.length) out.push(`**Don't**\n${list(dont)}`);

  const a11y = contract.accessibility ?? {};
  const keys = Object.entries(a11y.keyboard ?? {}).slice(0, 6).map(([k, v]) => `${k}: ${clip(String(v).replace(/\s*\(.*$/, ''), 90)}`);
  const access = [a11y.role ? `Role ${oneLine(a11y.role)}${a11y.native ? `, native ${oneLine(a11y.native)}` : ''}.` : '', a11y.accessibleNameSource ? `Name: ${clip(a11y.accessibleNameSource, 260)}` : ''].filter(Boolean).join(' ');
  if (access || keys.length) out.push(`**Accessibility.** ${access}${keys.length ? `\n${list(keys)}` : ''}`);

  const interaction = (axes.find((a) => a.name === 'State')?.values ?? []).filter((v) => v !== 'Rest');
  const names = [...props.text.keys(), ...props.bool.keys(), ...props.swap.keys()];
  const design = [
    axes.length ? `Variants: ${axes.map((a) => `${a.name} (${a.values.join(', ')})`).join('; ')}.` : 'One variant.',
    names.length ? `Properties: ${names.join(', ')}.` : '',
    designSlots.length ? `Slots: ${designSlots.map((s) => (s.preferred.length ? `${s.name} (prefers ${s.preferred.join(', ')})` : s.name)).join(', ')}.` : '',
    interaction.length ? `The ${interaction.join(', ')} state${interaction.length > 1 ? 's are' : ' is'} drawn to review the look; the code applies ${interaction.length > 1 ? 'them' : 'it'}, so never set ${interaction.length > 1 ? 'them' : 'it'} by hand in a design.` : '',
  ].filter(Boolean).join(' ');
  out.push(`**In the design file.** ${design}`);

  const parts = [...new Set((contract.anatomy ?? []).map((a) => a.part).filter(Boolean))];
  const slots = Object.keys(contract.content ?? {});
  const events = Object.keys(contract.events ?? {});
  const code = [
    contract.tag ? `Element \`${contract.tag}\`.` : '',
    parts.length ? `Parts: ${parts.join(', ')}.` : '',
    slots.length ? `Slots: ${slots.join(', ')}.` : '',
    events.length ? `Events: ${events.join(', ')}.` : '',
    contract.dependsOn?.length ? `Built with ${contract.dependsOn.join(', ')}.` : '',
  ].filter(Boolean).join(' ');
  out.push(`**For code.** ${code} Source of truth: spec/components/${name.split('/')[0] ?? name}/contract.json${contract.elementOf ? ` (element \`${contract.tag}\`)` : ''}.`);
  return out.join('\n\n');
}
