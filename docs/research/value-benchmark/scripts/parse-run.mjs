// usage: node parse-run.mjs <run.jsonl>  -> one JSON line of run metrics
import { readFileSync } from 'node:fs';

const events = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const init = events.find((e) => e.type === 'system' && e.subtype === 'init');
const result = events.findLast((e) => e.type === 'result');
const tools = {};
let cliCalls = 0, checkCalls = 0;
const skillCalls = [];
const cliCommands = {};
const VERIFY = /\b(check|test|tsc|typecheck|playwright|doctor|audit-css|axe|lint|selftest|verify)\b/;
const msgs = new Map();
const SUBS = 'init|harness|status|doctor|upgrade|propagate|generate|prefix|swap|add|approve|remove|list|kits|tokens|presets|brand|icons|api|audit-css|audit-page|audit-decisions|evidence|sync|docs|check|selftest|explain|help';
const HEAD = new RegExp('^(?:npx(?:\\s+--?[\\w-]+)*\\s+sketchbook|npm\\s+exec(?:\\s+--)?\\s+sketchbook|npm\\s+run\\s+(?:(?:-s|--silent)\\s+)?sketchbook\\s+--|node\\s+\\S*harness/cli\\.mjs|(?:node\\s+)?(?:\\./)?node_modules/\\.bin/sketchbook|sketchbook)\\s+(?:--[\\w-]+\\s+)*(' + SUBS + ')(?=\\s|$)');
const NPM = /^npm\s+run\s+(?:-s\s+|--silent\s+)?(check|doctor|generate|tokens)\b/;
const cliUse = (cmd) => cmd.split(/&&|\|\||;|\|/).map((x) => x.trim().replace(/^cd\s+\S+\s*/, '')).map((x) => (x.match(HEAD)?.[1] ?? x.match(NPM)?.[1])).filter(Boolean);
const cliById = new Map();
const failedIds = new Set();
const returnedIds = new Set();
const seen = new Set();
const deniedIds = new Set((result?.permission_denials ?? []).map((denial) => denial.tool_use_id).filter(Boolean));
let verifyCalls = 0;
for (const e of events) {
  if (e.type === 'user') {
    for (const b of Array.isArray(e.message?.content) ? e.message.content : []) {
      if (b.type !== 'tool_result') continue;
      returnedIds.add(b.tool_use_id);
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
    const cmd = b.input?.command ?? '';
    const subs = b.name === 'Bash' ? cliUse(cmd) : [];
    const verifies = b.name === 'Bash' && (VERIFY.test(cmd) || subs.includes('evidence') || subs.includes('audit-page'));
    if (verifies) rec.verify = true;
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    if (verifies) verifyCalls++;
    tools[b.name] = (tools[b.name] ?? 0) + 1;
    if (subs.length) {
      cliById.set(b.id, subs);
      cliCalls++;
      for (const sub of subs) cliCommands[sub] = (cliCommands[sub] ?? 0) + 1;
      if (subs.includes('check')) checkCalls++;
    }
    if (b.name === 'Skill') skillCalls.push(b.input?.skill);
  }
}
const cliAttempts = {}, cliOk = {}, cliDenied = {}, cliUnconfirmed = {};
for (const [id, subs] of cliById) for (const sub of subs) {
  cliAttempts[sub] = (cliAttempts[sub] ?? 0) + 1;
  // One Bash result cannot attribute success to individual commands in a chained call.
  const counts = deniedIds.has(id) ? cliDenied
    : !returnedIds.has(id) || subs.length > 1 ? cliUnconfirmed
      : !failedIds.has(id) ? cliOk : null;
  if (counts) counts[sub] = (counts[sub] ?? 0) + 1;
}
const u = result?.usage ?? {};
const tok = (m) => (m.usage?.input_tokens ?? 0) + (m.usage?.cache_creation_input_tokens ?? 0) + (m.usage?.cache_read_input_tokens ?? 0) + (m.usage?.output_tokens ?? 0);
const all = [...msgs.values()];
const vTok = all.filter((m) => m.verify).reduce((a, m) => a + tok(m), 0);
const tTok = all.reduce((a, m) => a + tok(m), 0) || 1;
console.log(JSON.stringify({
  ok: result && !result.is_error, subtype: result?.subtype, turns: result?.num_turns, cost: result?.total_cost_usd,
  ms: result?.duration_ms, input: u.input_tokens, output: u.output_tokens, cacheWrite: u.cache_creation_input_tokens, cacheRead: u.cache_read_input_tokens,
  tools, cliAttempts, cliOk, cliDenied, cliUnconfirmed, permissionDenials: result?.permission_denials?.length, verifyCalls, verifyTurnShare: +(all.filter((m) => m.verify).length / Math.max(1, all.length)).toFixed(3), verifyTokenShare: +(vTok / tTok).toFixed(3), cliCalls, cliCommands, checkCalls, skillCalls, skills: init?.skills?.length, initTools: init?.tools?.length, model: init?.model,
}));
