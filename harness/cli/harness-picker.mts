import { emitKeypressEvents, type Key } from 'node:readline';
import { homedir } from 'node:os';
import { resolve, sep } from 'node:path';
import { harnessCatalog } from '../lib/agent-catalog.mjs';
import { catalogRows, clipCatalogLine, moduleContents } from './harness-view.mjs';
import { presentation } from './presentation.mjs';
import type { DispatchIO } from './run.mjs';
import type { Envelope } from './types.mjs';

export type PickerInput = NodeJS.ReadableStream & { isRaw?: boolean; setRawMode?: (enabled: boolean) => unknown };
export type PickerOutput = {
  write: (s: string) => unknown; isTTY?: boolean; columns?: number; rows?: number;
  on?: (event: 'resize', listener: () => void) => unknown;
  off?: (event: 'resize', listener: () => void) => unknown;
};
type Run = (args: string[], io: DispatchIO) => Promise<number>;
type File = { path: string; state: 'present' | 'missing' | 'update' | 'blocked' | 'conflict' | 'preserved' };
type Preview = { files: File[]; dependencies: string[]; planId: string; planChanged?: boolean };
type Mode = 'start' | 'browse' | 'details' | 'preview' | 'result';

// Bound every line, including paths and words longer than the terminal.
function wrap(text: string, width: number): string[] {
  const words = text.replace(/\p{Cc}/gu, ' ').trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (let word of words) {
    if (line && line.length + word.length + 1 > width) { lines.push(line); line = ''; }
    while (word.length > width) { lines.push(word.slice(0, width)); word = word.slice(width); }
    if (word) line += line ? ` ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function terminalKeys(input: PickerInput) {
  type Event = { text: string; key: Key } | 'resize' | 'end';
  const queue: Event[] = [];
  let waiting: ((event: Event) => void) | undefined;
  const push = (event: Event) => {
    if (waiting) { const wake = waiting; waiting = undefined; wake(event); }
    else queue.push(event);
  };
  const keypress = (text: string | undefined, key: Key) => push({ text: text ?? '', key });
  const end = () => push('end');
  emitKeypressEvents(input);
  input.on('keypress', keypress).once('end', end);
  input.resume();
  return {
    next: () => Promise.resolve(queue.shift() ?? new Promise<Event>((wake) => { waiting = wake; })),
    resize: () => push('resize'),
    close: () => { input.off('keypress', keypress).off('end', end); input.pause(); },
  };
}

export async function harnessPicker(root: string, input: PickerInput, output: PickerOutput, run: Run): Promise<{ back: boolean; code: number }> {
  if (!input.setRawMode || !output.isTTY) {
    return { back: false, code: await run(['harness', 'list'], { root, stdout: output.write, stderr: output.write, human: false }) };
  }
  const catalog = catalogRows(harnessCatalog());
  const recommended = catalog.find(({ id }) => id === 'recommended')?.members ?? [];
  const entries = catalog.filter(({ kind, integration, partOf }) => kind !== 'bundle' && !integration && !partOf);
  const selected = new Set<string>();
  const ui = presentation(true);
  const target = resolve(root);
  const home = homedir() + sep;
  const destination = target.startsWith(home) ? `~${sep}${target.slice(home.length)}` : target;
  let mode: Mode = 'start';
  let customize = false;
  let returnTo: 'start' | 'browse' = 'browse';
  let focus = 0;
  let top = 0;
  let filter = '';
  let message = '';
  let preview: Envelope | undefined;
  let refreshed = false;
  let detailsTop = 0;
  let install = false;
  let result: Envelope | undefined;
  let status = 0;
  const argv = () => ['harness', 'add', ...(returnTo === 'start' ? ['recommended'] : selected)];
  const collect = async (args: string[], expectedHarnessPlan?: string) => {
    let envelope: Envelope | undefined;
    const code = await run(args, { root, expectedHarnessPlan, stdout: () => {}, stderr: () => {}, human: false, result: (value) => { envelope = value; } });
    return { code, envelope };
  };
  const matches = () => {
    const term = filter.toLowerCase().replace(/[^a-z0-9]/g, '');
    return entries.filter((entry) => `${entry.title} ${entry.id} ${entry.section} ${entry.summary}`.toLowerCase().replace(/[^a-z0-9]/g, '').includes(term));
  };
  const previewData = () => preview?.data as Preview | undefined;
  const canInstall = () => Boolean(preview?.ok && preview.changed.length && previewData()?.planId);
  const beginPreview = async (from: 'start' | 'browse') => {
    returnTo = from;
    refreshed = false;
    const attempt = await collect([...argv(), '--dry-run']);
    preview = attempt.envelope;
    status = attempt.code;
    detailsTop = 0;
    install = false;
  };
  const frame = (lines: string[]) => output.write(`\x1b[H${lines.map((value) => value + '\x1b[K').join('\r\n')}\x1b[J`);
  const note = ui.dim;
  const render = () => {
    const width = Math.max(2, (output.columns || 80) - 1); // Leave the auto-wrap column unused.
    const height = output.rows || 24;
    const head = [ui.bold('Sketchbook') + ' / Harness'];
    if (width < 30 || height < 14) {
      frame([...head.map((line) => width < 20 ? clipCatalogLine('Harness', width) : line), ...wrap('Resize to at least 31 columns and 14 rows. Esc to leave.', width)].slice(0, height));
      return { visible: 0, scrollMax: 0 };
    }
    const location = wrap(`Install into: ${destination}`, width);
    const header = [...head, ...location.slice(0, 3)];
    if (location.length > 3) header[3] = `${clipCatalogLine(location[2] ?? '', width - 2)} …`;
    if (mode === 'start') {
      const gap = height >= 18 ? [''] : [];
      frame([...header, ...gap, ui.bold('How do you want to install?'), ...gap,
        customize ? '  Install recommended' : ui.accent('› Install recommended'),
        ...wrap('Preview four skills for drafting, building, and reviewing components.', width),
        ...gap, customize ? ui.accent('› Customize installation') : '  Customize installation',
        ...wrap('Choose skills, named workflows, and rules to preview.', width),
        ...gap, ...wrap('↑ ↓ Choose   Enter Continue   Esc Back', width).map(note),
      ]);
      return { visible: 2, scrollMax: 0 };
    }
    if (mode === 'browse') {
      const list = matches();
      focus = Math.max(0, Math.min(focus, list.length - 1));
      const focused = list[focus];
      const footer = wrap('↑ ↓ Move   Space Select   Enter Preview   Esc Clear or back', width).map(note);
      const count = filter ? (list.length === 1 ? 'match' : 'matches') : (list.length === 1 ? 'item' : 'items');
      const caption = `${selected.size} selected · ${list.length} ${count}`;
      const entryDetail = (entry: typeof entries[number]) => [
        ...wrap(entry.summary, width), ...wrap(moduleContents(entry), width),
      ];
      const longest = Math.max(1, ...entries.map((entry) => entryDetail(entry).length));
      const reserve = Math.min(longest, Math.max(2, height - header.length - footer.length - 7));
      const visible = Math.max(1, height - header.length - footer.length - reserve - 5);
      top = Math.max(0, Math.min(top, list.length - visible, focus));
      if (focus >= top + visible) top = focus - visible + 1;
      const rows = list.slice(top, top + visible).map((entry, index) => {
        const focused = index + top === focus;
        const label = clipCatalogLine(`${focused ? '›' : ' '} ${selected.has(entry.id) ? '[x]' : '[ ]'} ${entry.label.padEnd(7)}  ${entry.title}`, width);
        return focused ? ui.accent(label) : label;
      });
      if (!rows.length) rows.push('No matching items.');
      const detail = focused ? entryDetail(focused) : [];
      // The detail area stays fixed while the list moves. Its continuation remains available.
      const showDetail = detail.slice(0, reserve);
      if (detail.length > reserve) showDetail[reserve - 1] = 'Tab for full description.';
      frame([...header,
        filter ? clipCatalogLine(`Filter: ${filter}`, width) : note('Type to filter…'),
        clipCatalogLine(`${caption}${list.length > visible ? ` · ${top + 1}–${Math.min(list.length, top + visible)} shown` : ''}`, width), '',
        ...rows, ...Array<string>(visible - rows.length).fill(''), '',
        ...showDetail, ...Array<string>(reserve - showDetail.length).fill(''),
        message ? clipCatalogLine(message, width) : '', ...footer,
      ]);
      return { visible, scrollMax: 0 };
    }
    const plan = previewData();
    const body: string[] = [];
    let choices: string[];
    if (mode === 'preview') {
      const errors = preview?.errors ?? [];
      const files = plan?.files ?? [];
      const blocked = files.filter(({ state }) => state === 'blocked' || state === 'conflict');
      const present = files.filter(({ state }) => state === 'present').length;
      const preset = returnTo === 'start';
      header.push(ui.bold(errors.length ? 'Install blocked · No files changed' : preset ? 'Recommended install preview' : 'Custom install preview'));
      if (refreshed) body.push('Plan changed. Review it again. Nothing was written.', '');
      if (blocked.length) body.push('Conflicts', ...blocked.map(({ path }) => path), '');
      else if (errors.length) body.push(...errors.map(({ msg }) => msg), '');
      const included = preset ? recommended : [...selected];
      body.push(preset ? 'Recommended modules' : 'Selected', ...included.map((id) => entries.find((entry) => entry.id === id)?.title ?? id), '');
      if (canInstall()) body.push(`Command: sketchbook ${argv().join(' ')}`, '');
      if (location.length > 3) body.push('Full destination', target, '');
      const deps = plan?.dependencies.filter((id) => !included.includes(id)) ?? [];
      if (deps.length) body.push('Also required', ...deps, '');
      if (present) body.push(`Already installed: ${present} ${present === 1 ? 'file' : 'files'}`, '');
      const preserved = files.filter(({ state }) => state === 'preserved');
      if (preserved.length) body.push('Project settings kept', ...preserved.map(({ path }) => path), '');
      const changes = files.filter(({ state }) => state === 'missing' || state === 'update');
      if (changes.length) body.push(blocked.length ? 'Files not written' : `Files to write (${changes.length})`, ...changes.map(({ path, state }) => state === 'update' ? `Refresh: ${path}` : path));
      if (!canInstall() && !errors.length) body.push('Nothing to install.');
      const back = preset ? 'Back to install options' : 'Back to selection';
      const apply = preset ? 'Install recommended' : 'Install selected';
      choices = canInstall() ? [`${install ? ' ' : '›'} ${back}`, `${install ? '›' : ' '} ${apply}`] : [`› ${back}`];
      if (choices.join('     ').length <= width) choices = [choices.join('     ')];
    } else if (mode === 'details') {
      const focused = matches()[focus];
      header.push(ui.bold('Item details'));
      if (focused) body.push(focused.title, focused.label, '', focused.summary, moduleContents(focused));
      choices = ['› Back to catalog'];
    } else {
      header.push(ui.bold('Install result'));
      if (result?.ok) body.push(`Installed ${result.changed.length} ${result.changed.length === 1 ? 'file' : 'files'}.`, ...result.changed);
      else body.push(...(result?.errors.flatMap(({ msg, fix }) => fix ? [msg, fix] : [msg]) ?? ['Installation did not complete.']));
      for (const warning of result?.warnings ?? []) body.push(typeof warning === 'string' ? warning : warning.msg);
      choices = [returnTo === 'start' ? '› Back to install options' : '› Back to catalog'];
    }
    const all = body.flatMap((text) => text ? wrap(text, width) : ['']);
    const footer = wrap(canInstall() && mode === 'preview' ? `↑ ↓ Scroll   Tab Choose   Enter ${install ? 'Install' : 'Go back'}   Esc Back` : '↑ ↓ Scroll   Enter Return   Esc Back', width).map(note);
    const visible = Math.max(1, height - header.length - footer.length - choices.length - 3);
    const scrollMax = Math.max(0, all.length - visible);
    detailsTop = Math.min(detailsTop, scrollMax);
    const window = all.slice(detailsTop, detailsTop + visible);
    frame([...header, '', ...window, ...Array<string>(visible - window.length).fill(''),
      scrollMax ? note(`${detailsTop + 1}–${detailsTop + window.length} of ${all.length} lines`) : '',
      ...choices.map((choice) => ui.accent(clipCatalogLine(choice, width))), ...footer]);
    return { visible, scrollMax };
  };
  const wasRaw = Boolean(input.isRaw);
  input.setRawMode(true);
  const keys = terminalKeys(input);
  const close = () => {
    keys.close();
    output.off?.('resize', keys.resize);
    input.setRawMode?.(wasRaw);
    output.write('\x1b[?25h\x1b[?1049l');
  };
  output.on?.('resize', keys.resize);
  output.write('\x1b[?1049h\x1b[?25l');
  try {
    for (;;) {
      const view = render();
      const event = await keys.next();
      if (event === 'resize') continue;
      if (event === 'end' || (event.key.ctrl && event.key.name === 'c')) return { back: false, code: event === 'end' ? status : 130 };
      const { key, text } = event;
      const enter = key.name === 'return' || key.name === 'enter';
      if (key.name === 'escape') {
        if (mode === 'start') return { back: true, code: status };
        if (mode === 'details') mode = 'browse';
        else if (mode === 'preview' || mode === 'result') mode = returnTo;
        else if (filter) { filter = ''; focus = top = 0; }
        else mode = 'start';
        continue;
      }
      if (!view.visible) continue;
      if (mode === 'start') {
        if (key.name === 'up') customize = false;
        else if (key.name === 'down') customize = true;
        else if (enter) {
          if (customize) mode = 'browse';
          else { await beginPreview('start'); mode = 'preview'; }
        }
        continue;
      }
      if (mode !== 'browse') {
        const movement = key.name === 'up' ? -1 : key.name === 'down' ? 1 : key.name === 'pageup' ? -view.visible : key.name === 'pagedown' ? view.visible : 0;
        detailsTop = Math.min(view.scrollMax, Math.max(0, detailsTop + movement));
        if (mode === 'preview' && canInstall() && ['left', 'right', 'tab'].includes(key.name ?? '')) {
          install = key.name === 'right' || (key.name === 'tab' && !install);
        }
        if (enter) {
          if (mode === 'preview' && install && canInstall()) {
            const attempt = await collect(argv(), previewData()?.planId);
            if ((attempt.envelope?.data as Preview | undefined)?.planChanged) {
              await beginPreview(returnTo);
              refreshed = true;
              continue;
            }
            result = attempt.envelope; status = attempt.code;
            if (result?.ok && returnTo === 'browse') { selected.clear(); filter = ''; focus = top = 0; }
            mode = 'result'; detailsTop = 0;
          } else mode = mode === 'details' ? 'browse' : returnTo;
        }
        continue;
      }
      message = '';
      if (key.name === 'up') focus--;
      else if (key.name === 'down') focus++;
      else if (key.name === 'pageup') focus -= view.visible;
      else if (key.name === 'pagedown') focus += view.visible;
      else if (key.name === 'home') focus = 0;
      else if (key.name === 'end') focus = matches().length - 1;
      else if (key.name === 'space') {
        const item = matches()[focus];
        if (item && !selected.delete(item.id)) selected.add(item.id);
      } else if (enter) {
        if (!selected.size) { message = 'Select an item with Space first.'; continue; }
        await beginPreview('browse');
        mode = 'preview';
      } else if (key.name === 'tab' && matches()[focus]) {
        mode = 'details'; detailsTop = 0;
      } else if (key.name === 'backspace' || (key.ctrl && key.name === 'u')) {
        filter = key.name === 'backspace' ? filter.slice(0, -1) : '';
        focus = top = 0;
      } else if (!key.ctrl && !key.meta && /^[\p{L}\p{N}:_./-]+$/u.test(text)) {
        filter = (filter + text).slice(0, 120);
        focus = top = 0;
      }
    }
  } finally { close(); }
}
