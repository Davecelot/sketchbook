#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): a written HTML page built from the components needs a level-1 heading and a main
// landmark (SB-0117). A static check, not axe; fragments and pages without components pass.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function outlineMisses(html: string, prefix = 'sb'): string[] {
  const text = html.replace(/<!--[\s\S]*?-->/g, '');
  if (!/<(html|body)[\s>]/i.test(text) || !new RegExp(`<${prefix}-[a-z]`, 'i').test(text)) return [];
  const tags = text.match(/<[a-z][^>]*>/gi) ?? [];
  const role = (r: string) => (t: string): boolean => new RegExp(`\\srole\\s*=\\s*["']?${r}\\b`, 'i').test(t);
  const misses: string[] = [];
  if (!tags.some((t) => /^<h1[\s>]/i.test(t) || (role('heading')(t) && /\saria-level\s*=\s*["']?1\b/i.test(t)))) {
    misses.push(`no level-1 heading (axe page-has-heading-one): put <h1> inside ${prefix}-card-title when the card is the page's title, or add an <h1> before the content.`);
  }
  if (!tags.some((t) => /^<main[\s>]/i.test(t) || role('main')(t))) {
    misses.push('no main landmark (axe landmark-one-main, region): wrap the page content in <main>.');
  }
  return misses;
}

interface ToolCall { tool_input?: { file_path?: string } }
const input = JSON.parse(await new Promise<string>((r) => { let d = ''; process.stdin.on('data', (c: Buffer) => (d += String(c))); process.stdin.on('end', () => r(d || '{}')); })) as ToolCall;
const file = String(input.tool_input?.file_path ?? '');
if (!/\.html?$/i.test(file)) process.exit(0);
let html = '';
try { html = readFileSync(file, 'utf8'); } catch { process.exit(0); }
let prefix = 'sb';
try { prefix = (JSON.parse(readFileSync(join(process.env.CLAUDE_PROJECT_DIR ?? '.', 'harness.config.json'), 'utf8')) as { prefix?: string }).prefix ?? prefix; } catch { /* no project config: default prefix */ }
const misses = outlineMisses(html, prefix);
if (misses.length) {
  process.stderr.write(`${file} is a page without an outline:\n${misses.map((m) => `- ${m}`).join('\n')}\n`);
  process.exit(2);
}
