// usage: node parse-run.mjs <run.jsonl>  -> one JSON line of run metrics
import { readFileSync } from 'node:fs';

const events = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const init = events.find((e) => e.type === 'system' && e.subtype === 'init');
const result = events.findLast((e) => e.type === 'result');
const tools = {};
let cliCalls = 0, checkCalls = 0, skillCalls = [];
const cliCommands = {};
const VERIFY = /\b(check|test|tsc|typecheck|playwright|doctor|audit-css|axe|lint|selftest|verify)\b/;
const msgs = new Map();
const SUBS = 'init|status|doctor|upgrade|generate|prefix|swap|add|remove|list|kits|tokens|presets|brand|icons|api|audit-css|sync|docs|check|selftest|explain|help';
const HEAD = new RegExp('^(?:npx(?:\\s+--?[\\w-]+)*\\s+sketchbook|npm\\s+run\\s+(?:-s\\s+|--silent\\s+)?sketchbook\\s+--|node\\s+\\S*harness/cli\\.mjs|sketchbook)\\s+(?:--[\\w-]+\\s+)*(' + SUBS + ')\\b');
const NPM = /^npm\s+run\s+(?:-s\s+|--silent\s+)?(check|doctor|generate|tokens)\b/;
const cliUse = (cmd) => cmd.split(/&&|\|\||;|\|/).map((x) => x.trim().replace(/^cd\s+\S+\s*/, '')).map((x) => (x.match(HEAD)?.[1] ?? x.match(NPM)?.[1])).filter(Boolean);
const cliById = new Map();
const failedIds = new Set();
let verifyCalls = 0;
for (const e of events) {
  if (e.type === 'user') {
    for (const b of Array.isArray(e.message?.content) ? e.message.content : []) {
      if (b.type !== 'tool_result') continue;
      const text = typeof b.content === 'string' ? b.content : JSON.stringify(b.content ?? '');
      if (b.is_error || /command not found|Missing script|Cannot find module|ERR_MODULE_NOT_FOUND|could not determine executable|not found: sketchbook/i.test(text)) failedIds.add(b.tool_use_id);
    }
    continue;
  }
  if (e.type !== 'assistant') continue;
  const rec = msgs.get(e.message?.id) ?? { usage: e.message?.usage, verify: false };
  msgs.set(e.message?.id, rec);
  for (const b of e.message?.content ?? []) {
    if (b.type !== 'tool_use') continue;
    if (b.name === 'Bash') { const subs = cliUse(b.input?.command ?? ''); if (subs.length) cliById.set(b.id, subs); }
    if (b.name === 'Bash' && VERIFY.test(b.input?.command ?? '')) { rec.verify = true; verifyCalls++; }
    tools[b.name] = (tools[b.name] ?? 0) + 1;
    const cmd = b.input?.command ?? '';
    if (b.name === 'Bash' && /sketchbook/.test(cmd)) {
      cliCalls++;
      const m = cmd.match(/sketchbook(?:\s+--)?\s+(?:--\S+\s+)*([a-z][\w-]*)/);
      if (m) cliCommands[m[1]] = (cliCommands[m[1]] ?? 0) + 1;
    }
    if (b.name === 'Bash' && /(run check|sketchbook.* check)/.test(cmd)) checkCalls++;
    if (b.name === 'Skill') skillCalls.push(b.input?.skill);
  }
}
const cliAttempts = {}, cliOk = {};
for (const [id, subs] of cliById) for (const sub of subs) { cliAttempts[sub] = (cliAttempts[sub] ?? 0) + 1; if (!failedIds.has(id)) cliOk[sub] = (cliOk[sub] ?? 0) + 1; }
const u = result?.usage ?? {};
const tok = (m) => (m.usage?.input_tokens ?? 0) + (m.usage?.cache_creation_input_tokens ?? 0) + (m.usage?.cache_read_input_tokens ?? 0) + (m.usage?.output_tokens ?? 0);
const all = [...msgs.values()];
const vTok = all.filter((m) => m.verify).reduce((a, m) => a + tok(m), 0);
const tTok = all.reduce((a, m) => a + tok(m), 0) || 1;
console.log(JSON.stringify({
  ok: result && !result.is_error, subtype: result?.subtype, turns: result?.num_turns, cost: result?.total_cost_usd,
  ms: result?.duration_ms, input: u.input_tokens, output: u.output_tokens, cacheWrite: u.cache_creation_input_tokens, cacheRead: u.cache_read_input_tokens,
  tools, cliAttempts, cliOk, verifyCalls, verifyTurnShare: +(all.filter((m) => m.verify).length / Math.max(1, all.length)).toFixed(3), verifyTokenShare: +(vTok / tTok).toFixed(3), cliCalls, cliCommands, checkCalls, skillCalls, skills: init?.skills?.length, initTools: init?.tools?.length, model: init?.model,
}));
