import { homedir } from 'node:os';
import { basename, sep } from 'node:path';
import { eastAsianWidth } from 'get-east-asian-width';
import type { CheckIssue, Report } from '../checks/types.mjs';
import type status from './commands/status.mjs';
import type { presentation } from './presentation.mjs';

export type Overview = Awaited<ReturnType<typeof status.run>>['data'];
type Style = ReturnType<typeof presentation>;
export const filters = ['All', 'Errors', 'Warnings', 'Overrides'] as const;
type Kind = Exclude<typeof filters[number], 'All'>;

export interface Finding extends CheckIssue {
  kind: Kind;
  check: string;
  title: string;
}

export function reportFindings(report: Report): Finding[] {
  const entries = (kind: 'Errors' | 'Warnings') => report.results.flatMap(({ id, title, errors, warnings }) =>
    (kind === 'Errors' ? errors : warnings).map((issue) => ({ ...issue, kind, check: id, title })));
  return [
    ...entries('Errors'),
    ...entries('Warnings'),
    ...report.overrides.map(({ token, value, generated, added, file }): Finding => ({
      kind: 'Overrides', check: '', title: 'Token override', token, file: 'spec/tokens/overrides.json',
      msg: added ? `Added by hand in ${file}: ${JSON.stringify(value)}` : `Hand-edited in ${file}: ${JSON.stringify(value)} (generated: ${JSON.stringify(generated)})`,
      fix: 'Review the override with sketchbook tokens overrides list.',
    })),
  ];
}

// Project text can contain newlines or terminal controls. Only the renderer emits escape sequences.
export const terminalText = (value: string) => value.replace(/[\p{Cc}\p{Bidi_Control}]/gu, ' ');
const findingHeading = ({ check, title }: Finding) => check ? `${check} · ${title}` : title;
const findingLocation = ({ file, line }: Finding) => file && `${file}${line ? `:${line}` : ''}`;
const generated = ({ file }: Finding) => /^(?:generated[\\/]|spec[\\/]tokens[\\/](?:foundation[\\/]|interface\.json$)|src[\\/]index\.ts$)|\.styles\.ts$/u.test(file ?? '');
export const findingKind = ({ kind }: Finding) => kind === 'Errors' ? 'Error' : kind === 'Warnings' ? 'Warning' : 'Override';

function findingContext(finding: Finding): string[] {
  const parts: string[] = [];
  const location = findingLocation(finding);
  if (location) parts.push(`File: ${location}`);
  if (finding.token) parts.push(`Token: ${finding.token}`);
  if (finding.mode) parts.push(`Mode: ${finding.mode}`);
  if (finding.brand) parts.push(`Brand: ${finding.brand}`);
  if (generated(finding)) parts.push('Generated output. Use the suggested fix to find the source or rebuild step.');
  return parts;
}

export function findingDetails(finding: Finding): string[] {
  const parts = [findingHeading(finding), '', finding.msg, '', ...findingContext(finding)];
  if (finding.fix) parts.push('', `Suggested fix: ${finding.fix}`);
  return parts;
}

export function findingPreview(finding: Finding, width: number, single: boolean, ui: Style): string[] {
  const title = `${single ? `${findingKind(finding)} · ` : ''}${findingHeading(finding)}`;
  const context = findingContext(finding);
  const fixHeading = ui.bold('SUGGESTED FIX');
  const divider = ui.dim('─'.repeat(single ? width : 16));
  const fixSection = single ? [fixHeading, divider] : [`${fixHeading}  ${divider}`];
  return [
    ...wrap(title, width).map(ui.bold),
    '', ...wrap(finding.msg, width),
    ...(context.length ? ['', ...context.flatMap((line) => wrap(line, width))] : []),
    ...(finding.fix ? ['', ...fixSection, ...wrap(finding.fix, width)] : []),
  ];
}

const overviewGridWidth = 75;
const panelFrameWidth = 7; // Three edges and two spaces per cell.
type ColumnWidths = [left: number, right: number];

function panelRule([left, right]: ColumnWidths, [start, join, end]: [string, string, string], ui: Style): string {
  return ui.dim(`${start}${'─'.repeat(left + 2)}${join}${'─'.repeat(right + 2)}${end}`);
}

function panelRows(left: string[], right: string[], [leftWidth, rightWidth]: ColumnWidths, ui: Style): string[] {
  const edge = ui.dim('│');
  const blankLeft = ' '.repeat(leftWidth);
  const blankRight = ' '.repeat(rightWidth);
  return Array.from({ length: Math.max(left.length, right.length) }, (_, row) =>
    `${edge} ${left[row] ?? blankLeft} ${edge} ${right[row] ?? blankRight} ${edge}`);
}

export function workspaceHeader(root: string, viewingChecks: boolean, width: number, height: number, ui: Style): string[] {
  const tab = (label: string, active: boolean) => active ? ui.accent(ui.bold(`> ${label}`)) : `  ${label}`;
  const tabs = `${tab('1 Overview', !viewingChecks)}  ${tab('2 Checks', viewingChecks)}`;
  const title = 'Sketchbook / Workspace';
  const folder = basename(root) || root;
  const home = homedir();
  const path = terminalText(root === home || root.startsWith(home + sep) ? `~${root.slice(home.length)}` : root);
  if (width < overviewGridWidth || height < 22) {
    const prefix = `${title} · `;
    const space = width - prefix.length;
    const location = width >= overviewGridWidth && clip(path, space) === path ? path : folder;
    return [`${ui.bold('Sketchbook')} / Workspace · ${clip(location, space)}`, '', tabs];
  }

  const space = width - 4 - title.length;
  const pathWidth = space - 3;
  const location = clip(path, pathWidth) === path ? path : clip(folder, pathWidth);
  const padding = ' '.repeat(space - displayWidth(location));
  const rule = '─'.repeat(width - 2);
  const edge = ui.dim('│');
  return [
    ui.dim(`╭${rule}╮`),
    `${edge} ${ui.bold(title)}${padding}${location} ${edge}`,
    ui.dim(`╰${rule}╯`),
    '', tabs, '',
  ];
}

export type Action = [key: string, label: string, primary?: boolean];
export function actionRows(actions: Action[], width: number, ui: Style): string[] {
  const rows: string[] = [];
  let current = '';
  let used = 0;
  for (const [key, label, primary] of actions) {
    const badge = `[${key}]`;
    const size = badge.length + 1 + label.length;
    if (used && used + 3 + size > width) {
      rows.push(current);
      current = '';
      used = 0;
    }
    const action = primary ? `${ui.inverse(badge)} ${ui.bold(label)}` : `${ui.bold(badge)} ${label}`;
    current += `${used ? '   ' : ''}${action}`;
    used += (used ? 3 : 0) + size;
  }
  if (current) rows.push(current);
  return rows;
}

export function overviewDetails({ prefix, brand, components, overrides, design }: Overview, width: number, ui: Style): string[] {
  const lifecycle = Object.entries(components.byStatus).map(([state, count]) => `${count} ${state}`).join(' · ');
  const designStatus = !design.tool || design.tool === 'none'
    ? ['Not configured']
    : [
      `${design.tool}${design.available ? '' : ' · unavailable'} · last recorded`,
      `Tokens: ${design.tokens}`,
      `Components: ${design.components.synced} synced · ${design.components.stale.length} stale`,
      ...(design.components.stale.length ? [`Stale: ${design.components.stale.join(', ')}`] : []),
      ...(design.patterns.total ? [`Patterns: ${design.patterns.checked}/${design.patterns.total} checked`] : []),
    ];
  const brandLines = [`${brand.name} · ${prefix} · ${brand.font}`, `Primary ${brand.primary} · ${brand.modes.join(' / ')}`];
  const lifecycleLines = [`${components.total} total${lifecycle ? ` · ${lifecycle}` : ''}`];
  const overrideLines = [overrides ? `${overrides} recorded` : 'None recorded'];
  const section = (heading: string, content: string[], size: number, pad = false) => [
    ui.bold(clip(heading.toUpperCase(), size, pad)),
    ...content.flatMap((line) => wrap(line, size)).map((line) => clip(line, size, pad)),
  ];
  if (width < overviewGridWidth) {
    const divider = ui.dim('─'.repeat(width));
    return [
      ...section('Brand', brandLines, width), divider,
      ...section('Design sync', designStatus, width), divider,
      ...section('Components', lifecycleLines, width), divider,
      ...section('Token overrides', overrideLines, width),
    ];
  }
  const leftWidth = Math.floor((width - panelFrameWidth) / 2);
  const rightWidth = width - leftWidth - panelFrameWidth;
  const columns: ColumnWidths = [leftWidth, rightWidth];
  return [
    panelRule(columns, ['╭', '┬', '╮'], ui),
    ...panelRows(section('Brand', brandLines, leftWidth, true), section('Design sync', designStatus, rightWidth, true), columns, ui),
    panelRule(columns, ['├', '┼', '┤'], ui),
    ...panelRows(section('Components', lifecycleLines, leftWidth, true), section('Token overrides', overrideLines, rightWidth, true), columns, ui),
    panelRule(columns, ['╰', '┴', '╯'], ui),
  ];
}

export const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const emoji = /[\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u20E3]/u;

function graphemeWidth(segment: string): number {
  if (emoji.test(segment)) return 2;
  if (/^\p{Mark}+$/u.test(segment)) return 0;
  return eastAsianWidth(segment.codePointAt(0) ?? 0, { ambiguousAsWide: false });
}

function cells(value: string): { text: string; width: number }[] {
  return Array.from(graphemes.segment(terminalText(value)), ({ segment }) => ({
    text: segment, width: graphemeWidth(segment),
  }));
}

export const displayWidth = (value: string) => cells(value).reduce((sum, cell) => sum + cell.width, 0);

export function clip(value: string, width: number, pad = false): string {
  const chars = cells(value);
  const total = chars.reduce((sum, cell) => sum + cell.width, 0);
  const limit = total > width ? width - 1 : width;
  let line = '';
  let used = 0;
  for (const cell of chars) {
    if (used + cell.width > limit) break;
    used += cell.width;
    line += cell.text;
  }
  if (total > width) { line += '…'; used++; }
  return pad ? line.padEnd(line.length + width - used) : line;
}

export function wrap(value: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  let used = 0;
  for (const word of terminalText(value).trimEnd().split(/(?<=\s)(?=\S)/u)) {
    const chars = cells(word);
    const size = chars.reduce((sum, cell) => sum + cell.width, 0);
    if (used && used + size > width) { lines.push(line.trimEnd()); line = ''; used = 0; }
    for (const cell of chars) {
      if (used + cell.width > width) { lines.push(line.trimEnd()); line = ''; used = 0; }
      line += cell.text;
      used += cell.width;
    }
  }
  return [...lines, line.trimEnd()];
}
