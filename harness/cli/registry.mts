// The command registry: one module per command in harness/cli/commands, each a Command (harness/cli/types.mts).
// cli.mjs, help, the interactive menu, docs/cli.md and harness/cli/known-commands.json read it.
import init from './commands/init.mjs';
import status from './commands/status.mjs';
import prefix from './commands/prefix.mjs';
import swap from './commands/swap.mjs';
import add from './commands/add.mjs';
import presets from './commands/presets.mjs';
import sync from './commands/sync.mjs';
import docs from './commands/docs.mjs';
import check from './commands/check.mjs';
import explain from './commands/explain.mjs';
import help from './commands/help.mjs';
import doctor from './commands/doctor.mjs';
import upgrade from './commands/upgrade.mjs';
import remove from './commands/remove.mjs';
import list from './commands/list.mjs';
import kits from './commands/kits.mjs';
import icons from './commands/icons.mjs';
import api from './commands/api.mjs';
import brand from './commands/brand.mjs';
import auditCss from './commands/audit-css.mjs';
import auditPage from './commands/audit-page.mjs';
import auditDecisions from './commands/audit-decisions.mjs';
import tokens from './commands/tokens.mjs';
import generate from './commands/generate.mjs';
import selftest from './commands/selftest.mjs';
import propagate from './commands/propagate.mjs';
import type { Command, GroupId, SubcommandInfo } from './types.mjs';

const ALL: Command[] = [init, status, doctor, upgrade, propagate, generate, prefix, swap, add, remove, list, kits, tokens, presets, brand, icons, api, auditCss, auditPage, auditDecisions, sync, docs, check, selftest, explain, help];
export const GROUPS: Record<GroupId, string> = { project: 'Project', components: 'Components', tokens: 'Tokens', design: 'Design file', quality: 'Quality', meta: 'Help' };

export const commands = (): Command[] => ALL;
export const find = (name: string): Command | undefined => ALL.find((c) => c.name === name);
// Subcommands may be declared as plain words (sync) or as {name, usage, summary, mutates, examples} (tokens).
export const subcommandsOf = (c: Pick<Command, 'name' | 'mutates' | 'subcommands'>): SubcommandInfo[] =>
  (c.subcommands ?? []).map((s) => (typeof s === 'string' ? { name: s, usage: `sketchbook ${c.name} ${s}`, summary: `See \`sketchbook help ${c.name}\`.`, mutates: c.mutates, examples: [] } : s));
