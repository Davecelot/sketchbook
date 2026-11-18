#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit): outputs are never edited by hand (rule spec-is-source).
// Blocks the edit and says which source to change instead.
interface ToolCall { tool_input?: { file_path?: string } }
const input = JSON.parse(await new Promise<string>((r) => { let d = ''; process.stdin.on('data', (c: Buffer) => (d += String(c))); process.stdin.on('end', () => r(d || '{}')); })) as ToolCall;
const file = String(input.tool_input?.file_path ?? '');
const rel = file.replace(`${process.env.CLAUDE_PROJECT_DIR ?? ''}/`, '');
const rules: [RegExp, string][] = [
  [/^generated\//, 'generated/** is rebuilt from spec/ (npm run generate). Change the source: spec/tokens/semantic/*, brand.config.json or the contract.'],
  [/^spec\/tokens\/foundation\//, 'Foundation tokens are generated from brand.config.json (npm run tokens:generate). Change brand.config.json, or use sketchbook tokens set|preset (foundations skill, rule tokens-through-the-harness).'],
  [/\.styles\.ts$/, 'Edit the .scss next to it; .styles.ts is generated (npm run build:styles).'],
  [/^src\/index\.ts$/, 'src/index.ts is generated from src/components/ (npm run build:barrel).'],
];
for (const [re, why] of rules) {
  if (re.test(rel)) {
    process.stderr.write(`Blocked: ${rel} is an output. ${why}\n`);
    process.exit(2);
  }
}
