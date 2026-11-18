// usage: node show.mjs <results.tsv>  -> one readable line per run
import { readFileSync } from 'node:fs';

const L = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => l.split('\t'));
const h = L[0];
for (const r of L.slice(1)) {
  const o = Object.fromEntries(h.map((k, i) => [k, r[i]]));
  const extra = o.task === 'ui'
    ? `| sw ${o.switches} kbd ${o.keyboardToggle} form ${o.formDataKeys} sb ${o.sbElements} undef ${o.undefinedTags} lit ${o.ownLiteralColors} axeL ${o.axeLight} axeD ${o.axeDark} theme ${o.themeFollows} (attr ${o.themeDataAttr} prefers ${o.themePrefers}) tokenVars ${o.ownVarSb} err ${o.errors}`
    : `| asked ${o.asked} expert ${o.expert} files ${o.files} contract ${o.contractFound} check ${o.checkExit}`;
  console.log(o.id, 'ok', o.ok, 'turns', o.turns, '$' + (+o.cost).toFixed(2), 'ctx', +o.input + +o.cacheWrite + +o.cacheRead, 'out', o.output, 'cli', o.cliCalls, 'skills', o.skillCalls, extra, 'wall', Math.round(o.ms / 1000));
}
