import { emitKeypressEvents, type Key } from 'node:readline';
import { errorMessage } from '../lib/files.mjs';
import status from './commands/status.mjs';
import { presentation } from './presentation.mjs';
import type { PickerInput, PickerOutput } from './harness-picker.mjs';
import { openWorkspaceEditor, workspaceChecks, workspaceEditor } from './workspace-actions.mjs';
import { actionRows, clip, displayWidth, filters, findingDetails, findingKind, findingPreview, graphemes, overviewDetails, reportFindings, terminalText, workspaceHeader, wrap, type Action, type Finding, type Overview } from './workspace-view.mjs';

interface WorkspaceIO {
  root: string;
  input: PickerInput;
  output: PickerOutput;
  check?: typeof workspaceChecks;
  open?: typeof openWorkspaceEditor;
}

const clock = () => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format();
const effects = {
  enter: '\x1b[?1049h\x1b[?25l',
  leave: '\x1b[?25h\x1b[?1049l',
};

function limitSearch(query: string): string {
  let count = 0;
  for (const { index } of graphemes.segment(query)) {
    if (count === 160) return query.slice(0, index);
    count++;
  }
  return query;
}

export async function workspace({ root, input, output, check = workspaceChecks, open = openWorkspaceEditor }: WorkspaceIO): Promise<{ code: number; handoff?: string }> {
  const ui = presentation(true);
  let view: 'overview' | 'checks' = 'overview';
  let overview: { data: Overview; time: string } | undefined;
  let overviewError = '';
  let reading = false;
  let report: { status: string; summary: string; findings: Finding[]; time: string } | undefined;
  let checkError = '';
  let checking: AbortController | undefined;
  let editing: AbortController | undefined;
  let needsRerun = false;
  let notice = '';
  let filter = 0;
  let search = '';
  let searching = false;
  let matches: Finding[] = [];
  let index = 0;
  let top = 0;
  let detail = false;
  let help = false;
  let scroll = 0;
  let page = 1;
  let usable = true;
  let active = false;
  let closed = false;
  const wasRaw = Boolean(input.isRaw);
  const live = input === process.stdin;
  const wideChecks = () => (output.columns || 80) >= 96 && (output.rows || 24) >= 18;
  const singlePreview = () => wideChecks() && report?.findings.length === 1 && Boolean(matches[index]) && !detail;

  function updateMatches(reset = false) {
    const previous = reset ? undefined : matches[index];
    const query = search.trim().toLowerCase();
    matches = (report?.findings ?? []).filter((finding) => {
      if (filter && finding.kind !== filters[filter]) return false;
      return !query || [finding.check, finding.title, finding.msg, finding.file, finding.token, finding.mode, finding.brand]
        .some((value) => value?.toLowerCase().includes(query));
    });
    const same = previous ? matches.findIndex((item) =>
      item.kind === previous.kind && item.check === previous.check && item.file === previous.file &&
      item.line === previous.line && item.token === previous.token && item.msg === previous.msg &&
      item.mode === previous.mode && item.brand === previous.brand) : -1;
    index = same >= 0 ? same : 0;
    top = 0;
    if (reset) scroll = 0;
  }

  function render() {
    if (!active) return;
    const terminalWidth = Math.max(1, (output.columns || 80) - 1); // Keep the auto-wrap column free.
    const inset = terminalWidth >= 64 ? '  ' : '';
    const width = terminalWidth - 2 * inset.length;
    const height = output.rows || 24;
    const frame = (lines: string[]) => output.write(`\x1b[H${lines.slice(0, height).map((line) => `${line ? inset + line : ''}\x1b[K`).join('\r\n')}\x1b[J`);
    usable = terminalWidth >= 39 && height >= 12;
    if (!usable) {
      frame(['[q] Exit   [Esc] Exit', 'Resize to 40 columns and 12 rows.', 'Or run sketchbook status or check.'].map((line) => clip(line, width)));
      return;
    }

    const selected = matches[index];
    const viewingChecks = view === 'checks';
    const rule = ui.dim('─'.repeat(width));
    const header = workspaceHeader(root, viewingChecks, width, height, ui);
    const switchViews: Action = ['←/→', 'Switch views'];
    const helpAction: Action = ['?', 'Help'];
    const esc: Action = ['Esc', viewingChecks ? 'Back' : 'Exit'];
    const compact = terminalWidth < 64 || height < 18;
    if (viewingChecks && checking) esc[1] = 'Cancel check';
    else if (viewingChecks && !detail && search) esc[1] = 'Clear search';
    let actions: Action[];
    if (help) {
      actions = [['Esc', 'Close help'], ['q', 'Exit']];
    } else if (searching) {
      actions = [['Enter', 'Keep search', true], ['Esc', 'Clear search']];
    } else if (!viewingChecks) {
      actions = [['Enter', 'Open Checks', true], ['r', 'Refresh'], helpAction, esc];
    } else if (!selected) {
      const next = report?.findings.length ? 'Show all findings' : checkError ? 'Retry checks' : report ? 'Rerun checks' : 'Run checks';
      actions = checking ? [esc, switchViews, helpAction] : [
        ['Enter', next, true], switchViews, helpAction, esc,
      ];
      if (!checking && report) actions.push(['/', 'Search'], ['f', 'Filter']);
    } else {
      const openFile: Action = ['o', 'Open file', detail];
      const handoff: Action = ['p', width < 47 ? 'Handoff and exit' : 'Print handoff and exit', detail && (!selected.file || Boolean(checking))];
      actions = detail ? [] : [['Enter', 'Open details', true]];
      if (!detail && (!compact || height >= 13)) actions.push(['/', 'Search'], ['f', 'Filter']);
      if (!detail && matches.length > 1) actions.push(['↑/↓', 'Move']);
      if (detail || !compact) {
        if (selected.file && !checking) actions.push(openFile);
        actions.push(handoff);
      }
      if (!checking) actions.push(['r', compact ? 'Rerun' : 'Rerun checks']);
      actions.push(esc, helpAction);
      if (!compact) actions.push(switchViews);
    }
    let footer = actionRows(actions, width, ui);
    const notes = notice && !help ? [clip(notice, width)] : [];
    const available = () => height - header.length - footer.length - notes.length - 1;

    const scrollLines = (lines: string[], reserved = 0) => {
      if (!searching && lines.length > available() - reserved) {
        footer = actionRows([...actions, ['↑/↓', 'Scroll']], width, ui);
      }
      page = Math.max(1, available() - reserved);
      scroll = Math.max(0, Math.min(scroll, lines.length - page));
      return lines.slice(scroll, scroll + page);
    };
    const wrapped = (lines: string[]) => lines.flatMap((line) => wrap(line, width));
    let body: string[];
    if (help) {
      body = scrollLines([ui.bold('Workspace keys'), '', ...wrapped([
        '[←/→] Switch views · [1] Overview · [2] Checks', '[r] Refresh Overview or run checks',
        '[↑/↓] Move or scroll · [Page Up/Down] · [Home/End]', '[Enter] Use the action shown in the footer',
        '[/] Search findings · [f] Filter findings', '[o] Open the reported file using VISUAL or EDITOR',
        'Set the editor to an executable name or path, without flags.', '[p] Print the selected finding and exit',
        '[Esc] Use the back or cancel action shown below', '[q] Exit · [Ctrl+C] Interrupt',
        '', 'Plain terminal alternatives:', '  sketchbook status', '  sketchbook check',
      ])]);
    } else if (!viewingChecks) {
      const summary = overview ? [...overviewDetails(overview.data, width, ui), '', `Status read at ${overview.time}`] : [];
      const progress = reading ? ['Reading project status…', ''] : [];
      const error = overviewError ? wrapped([`Could not read project status: ${overviewError}`, '']) : [];
      const location = wrapped([`Project root: ${root}`]);
      body = scrollLines([...progress, ...error, ...summary, ...location]);
    } else {
      const single = singlePreview();
      const split = wideChecks() && !detail && Boolean(selected) && !single;
      const gutter = '    ';
      const listWidth = split ? Math.floor((width - gutter.length) / 3) : width;
      const previewWidth = split ? width - listWidth - gutter.length : Math.min(width, 76);
      const previous = checking || needsRerun || checkError;
      const summary = report ? ` · ${report.summary}` : '';
      const state = checking ? (checking.signal.aborted ? 'Cancelling checks…' : 'Running checks…')
        : checkError ? 'Could not complete checks' : needsRerun ? 'Rerun needed after opening editor'
          : report?.status ?? 'Checks have not run.';
      let mark = '';
      if (!checking) {
        if (checkError) mark = ui.warning('!');
        else if (report && !needsRerun) mark = report.status === 'Passed' ? ui.success('+') : ui.warning('!');
      }
      const stateWidth = width - (mark ? 2 : 0);
      const title = clip(state, stateWidth);
      const counts = clip(state + (previous ? '' : summary), stateWidth).slice(title.length);
      const status = (mark ? `${mark} ` : '') + ui.bold(title) + counts;
      const lead = [status];
      if (report) {
        const lastRun = `Last run: ${report.time}`;
        const statusWidth = (single ? previewWidth : width) - (mark ? 2 : 0);
        const spacing = statusWidth - displayWidth(title + counts) - displayWidth(lastRun);
        if (previous) lead.push(clip(`Previous run ${report.time}: ${report.status}${summary}`, width));
        else if (wideChecks() && spacing >= 4) lead[0] = status + ' '.repeat(spacing) + lastRun;
        else lead.push(clip(lastRun, width));
      }
      if (checkError && report) lead.push(...wrap(checkError, width).slice(0, available() >= 6 ? 2 : 1));
      if (!detail && report) {
        if (lead.length < available() - 1 || searching) {
          const position = !split && matches.length > 1 ? `${index + 1} of ` : '';
          const count = `${position}${matches.length} ${matches.length === 1 ? 'finding' : 'findings'}`;
          const scope = searching ? `Search: ${search}_` : `${filters[filter]} · ${count}${search ? ` · /${search}` : ''}`;
          if (single || split) {
            const label = split ? `FINDINGS (${matches.length})` : 'FINDING';
            const heading = searching ? scope : `${label}${filter || search ? ` · ${filters[filter]}${search ? ` · /${search}` : ''}` : ''}`;
            lead.push('');
            if (split) {
              const selectedTitle = `SELECTED FINDING (${index + 1} OF ${matches.length})`;
              lead.push(`${ui.bold(clip(heading, listWidth, true))}${gutter}${ui.bold(clip(selectedTitle, previewWidth))}`);
              lead.push(`${ui.dim('─'.repeat(listWidth))}${gutter}${ui.dim('─'.repeat(previewWidth))}`);
            } else {
              lead.push(ui.bold(clip(heading, previewWidth)), ui.dim('─'.repeat(previewWidth)));
            }
          } else {
            lead.push(ui.bold(clip(scope, width)));
          }
        }
      }
      if (detail && selected) {
        const lines = findingDetails(selected);
        const details = wrapped(height < 15 ? lines.filter(Boolean) : lines);
        if (details[0]) details[0] = ui.bold(details[0]);
        body = [...lead, ...scrollLines(details, lead.length)];
      } else if (single && selected) {
        body = [...lead, ...scrollLines(findingPreview(selected, previewWidth, true, ui), lead.length)];
      } else if (!report) {
        body = checkError ? [...lead, ...scrollLines(wrapped([checkError, '', 'Run sketchbook check to see its full output.']), lead.length)] : lead;
      } else if (!selected) {
        body = [...lead, report.findings.length ? 'No matching findings.' : 'No findings.'];
      } else {
        const space = Math.max(1, available() - lead.length);
        page = space;
        top = Math.min(top, index);
        if (index >= top + space) top = index - space + 1;
        const details = split ? findingPreview(selected, previewWidth, false, ui) : [];
        const rows = matches.slice(top, top + space).map((item, i) => {
          const focused = i + top === index;
          const separator = split ? ' ' : ' · ';
          const label = clip(`${focused ? '>' : ' '} ${findingKind(item)}${separator}${item.check || item.token || item.title} · ${item.msg}`, listWidth, split);
          if (!focused) return label;
          const text = split ? label.slice(1) : ui.bold(label.slice(1));
          return `${ui.accent('>')}${text}`;
        });
        const blank = ' '.repeat(listWidth);
        const content = split ? Array.from({ length: Math.min(space, Math.max(rows.length, details.length)) }, (_, i) =>
          `${rows[i] ?? blank}${gutter}${details[i] ?? ''}`) : rows;
        body = [...lead, ...content];
      }
    }
    const fill = Array<string>(Math.max(0, available() - body.length)).fill('');
    frame([...header, ...body.slice(0, available()), ...fill, ...notes, rule, ...footer]);
  }

  async function refresh() {
    if (reading) return;
    reading = true;
    overviewError = '';
    render();
    try {
      const { data } = await status.run({ root, args: [], options: {}, out: () => {} });
      overview = { data, time: clock() };
    } catch (error) {
      overviewError = errorMessage(error);
    } finally {
      reading = false;
      render();
    }
  }

  async function runChecks() {
    if (checking || editing) return;
    const task = new AbortController();
    checking = task;
    checkError = '';
    notice = '';
    render();
    try {
      const result = await check(root, task.signal);
      if (task.signal.aborted) return;
      const findings = reportFindings(result);
      const counts = findings.reduce((total, { kind }) => { total[kind]++; return total; }, { Errors: 0, Warnings: 0, Overrides: 0 });
      const label = (count: number, name: string) => `${count} ${name}${count === 1 ? '' : 's'}`;
      report = {
        status: result.exitCode === 0 ? 'Passed' : result.exitCode === 2 ? 'Passed with overrides' : 'Failed',
        summary: `${label(counts.Errors, 'error')} · ${label(counts.Warnings, 'warning')} · ${label(counts.Overrides, 'override')}`,
        findings,
        time: clock(),
      };
      needsRerun = false;
      updateMatches();
      if (!matches.length) detail = false;
      scroll = 0;
    } catch (error) {
      if (!task.signal.aborted) checkError = errorMessage(error);
      scroll = 0;
    } finally {
      if (task.signal.aborted) notice = 'Checks cancelled.';
      checking = undefined;
      render();
    }
  }

  function enter() {
    input.setRawMode?.(true);
    active = true;
    output.write(effects.enter);
    input.on('keypress', keypress);
    output.on?.('resize', render);
    input.resume();
    render();
  }

  function leave() {
    if (!active) return;
    active = false;
    input.off('keypress', keypress);
    output.off?.('resize', render);
    input.pause();
    try { input.setRawMode?.(wasRaw); } finally { output.write(effects.leave); }
  }

  async function edit(finding: Finding) {
    if (!finding.file || editing) return;
    const task = new AbortController();
    editing = task;
    notice = '';
    try {
      const launch = await workspaceEditor(root, finding.file, finding.line);
      if (closed) return;
      leave();
      await open(root, launch, task.signal);
      needsRerun = true;
    } catch (error) {
      if (error instanceof Error && 'editorStarted' in error) {
        needsRerun ||= Boolean(error.editorStarted);
        notice = error.editorStarted ? 'The editor did not finish successfully.' : 'Could not start editor. Check VISUAL or EDITOR.';
      } else notice = `Could not open file: ${errorMessage(error)}`;
    } finally {
      editing = undefined;
      if (!closed && !active) enter();
      else render();
    }
  }

  type Exit = { code: number; handoff?: string };
  let complete!: (result: Exit) => void;
  let fail!: (error: unknown) => void;
  const promise = new Promise<Exit>((resolve, reject) => { complete = resolve; fail = reject; });
  const interrupt = () => { if (active) finish(130); }; // A foreground editor handles its own Ctrl+C.
  const terminate = () => finish(143);
  const hangup = () => finish(129);
  const end = () => finish(0);

  function finish(code: number, handoff?: string) {
    if (closed) return;
    closed = true;
    checking?.abort();
    editing?.abort();
    input.off('end', end);
    if (live) {
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', terminate);
      process.off('SIGHUP', hangup);
    }
    try { leave(); complete({ code, handoff }); } catch (error) { fail(error); }
  }

  function show(next: 'overview' | 'checks') {
    if (next === view) return;
    view = next;
    detail = false;
    scroll = 0;
    notice = '';
  }

  function keypress(text: string | undefined, key: Key) {
    if (key.ctrl && key.name === 'c') { finish(130); return; }
    if (editing && key.name !== 'q') return;
    if (!usable) { if (key.name === 'q' || key.name === 'escape') finish(0); return; }
    const selected = matches[index];
    const enterKey = key.name === 'return' || key.name === 'enter';
    if (searching) {
      if (enterKey) searching = false;
      else if (key.name === 'escape') { search = ''; searching = false; }
      else if (key.name === 'backspace') search = search.slice(0, graphemes.segment(search).containing(search.length - 1)?.index ?? 0);
      else if (text && !key.ctrl && !key.meta && text === terminalText(text)) search = limitSearch(search + text);
      updateMatches(true);
    } else if (key.name === 'q') {
      finish(0);
    } else if (text === '?') {
      help = !help;
      scroll = 0;
    } else if (key.name === 'escape') {
      if (help) { help = false; scroll = 0; }
      else if (view === 'checks' && checking) { checking.abort(); }
      else if (detail) { detail = false; scroll = 0; }
      else if (view === 'checks' && search) { search = ''; updateMatches(true); }
      else if (view === 'checks') show('overview');
      else finish(0);
    } else if (!help && (text === '1' || key.name === 'left')) {
      show('overview');
    } else if (!help && (text === '2' || key.name === 'right' || (enterKey && view === 'overview'))) {
      show('checks');
    } else if (!help && key.name === 'r') {
      if (view === 'overview') void refresh();
      else void runChecks();
    } else if (!help && view === 'checks') {
      if (!detail && text === '/' && report) {
        searching = true;
      } else if (!detail && key.name === 'f' && report) {
        filter = (filter + 1) % filters.length;
        updateMatches(true);
      } else if (enterKey && !detail) {
        if (selected) {
          detail = true;
          scroll = 0;
        } else if (!checking && report?.findings.length) {
          filter = 0;
          search = '';
          updateMatches(true);
        } else void runChecks();
      } else if (key.name === 'o' && selected?.file) {
        if (!checking) void edit(selected);
        else notice = 'Wait for the check to finish before opening a file.';
      } else if (key.name === 'p' && selected) {
        const handoff = ['Sketchbook check handoff', `Project: ${root}`, '', ...findingDetails(selected), '', 'Rerun from the project root:', '  sketchbook check'];
        finish(0, handoff.map(terminalText).join('\n'));
      }
    }

    const movement = key.name === 'up' ? -1 : key.name === 'down' ? 1
      : key.name === 'pageup' ? -page : key.name === 'pagedown' ? page : 0;
    const target = (pos: number) => key.name === 'home' ? 0 : key.name === 'end' ? Number.MAX_SAFE_INTEGER : pos + movement;
    if (!searching) {
      if (view === 'overview' || detail || help || singlePreview() || (checkError && !report)) scroll = target(scroll);
      else index = Math.max(0, Math.min(matches.length - 1, target(index)));
    }
    render();
  }

  try {
    emitKeypressEvents(input);
    input.once('end', end);
    if (live) {
      process.on('SIGINT', interrupt);
      process.on('SIGTERM', terminate);
      process.on('SIGHUP', hangup);
    }
    enter();
    void refresh();
  } catch (error) {
    finish(1);
    await promise;
    throw error;
  }
  return promise;
}
