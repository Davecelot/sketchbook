export const DOCS_URL = 'https://sketchbook-docs.vercel.app/';

// Terminal-only presentation. Commands retain their plain and JSON interfaces for pipes.
export function presentation(enabled: boolean, color = enabled && !('NO_COLOR' in process.env)) {
  const paint = (code: string, value: string) => color ? `\u001b[${code}m${value}\u001b[0m` : value;
  const accent = (s: string) => paint('38;5;208', s);
  const bold = (s: string) => paint('1', s);
  const dim = (s: string) => paint('2', s);
  const success = (s: string) => paint('32', s);
  const warning = (s: string) => paint('33', s);
  const wrap = (value: string) => {
    const width = Math.max(20, process.stdout.columns || 80);
    // ANSI control sequences do not occupy terminal columns.
    // eslint-disable-next-line no-control-regex
    const size = (s: string) => [...s.replace(new RegExp('\\x1b\\[[0-9;]*m', 'g'), '')].length;
    return value.split('\n').flatMap((line) => {
      if (size(line) <= width) return [line];
      const indent = line.match(/^\s*/)?.[0] ?? '';
      const parts = line.trim().split(/\s+/);
      const lines: string[] = [];
      let current = indent;
      for (const part of parts) {
        const space = current.trim() ? ' ' : '';
        if (current.trim() && size(current + space + part) > width) { lines.push(current); current = indent + part; }
        else current += space + part;
      }
      lines.push(current);
      return lines;
    }).join('\n');
  };
  return {
    enabled, accent, bold, dim, success, warning,
    header: (label: string) => `\n${accent('◆')} ${bold('SKETCHBOOK')} ${dim(' / ' + label)}\n`,
    line: (value: string) => wrap(value).split('\n').map((line) => {
      const match = /^(\s*)([A-Za-z][A-Za-z ]{1,24}:)(.*)$/.exec(line);
      return match ? `${match[1]}${bold(match[2] ?? '')}${match[3]}` : line;
    }).join('\n'),
    section: (label: string) => `${accent('▸')} ${bold(label)}`,
    error: (message: string, fix?: string | null) => wrap(`${accent('✕')} ${bold('Error')}  ${message}${fix ? `\n  ${dim('Next')}  ${fix}` : ''}`) + '\n',
  };
}
