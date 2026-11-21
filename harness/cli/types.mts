import type { ReportOverride } from '../checks/types.mjs';

export type GroupId = 'project' | 'components' | 'tokens' | 'design' | 'quality' | 'meta';

export interface CommandArg {
  name: string;
  required: boolean;
  variadic?: boolean;
  description: string;
}

export interface CommandOption {
  type: 'boolean' | 'string';
  description: string;
  value?: string;
  short?: string;
}

export type OptionSpecs = Record<string, CommandOption>;

// What node:util parseArgs gives for each declared option (none is `multiple`).
type OptionValue<T extends CommandOption['type']> = T extends 'boolean' ? boolean : string;
export type OptionValues<S extends OptionSpecs = OptionSpecs> = { [K in keyof S]?: OptionValue<S[K]['type']> };

export interface SubcommandInfo {
  name: string;
  usage: string;
  summary: string;
  mutates: boolean;
  examples: string[];
}

// An issue as commands hand it back: check results (with the check id), thrown-error shapes, or tokens refusals.
export interface IssueLike {
  file?: string | null;
  msg?: string;
  fix?: string | null;
  token?: string;
  id?: string;
}

export interface EnvelopeIssue {
  file: string | null;
  msg: string;
  fix: string | null;
  token?: string;
  check?: string;
}

export interface ChecksSummary {
  exitCode: number;
  errors: EnvelopeIssue[];
  warnings: EnvelopeIssue[];
  overrides?: ReportOverride[];
}

export interface CommandContext<S extends OptionSpecs = OptionSpecs> {
  root: string;
  args: string[];
  options: OptionValues<S>;
  json: boolean;
  dryRun: boolean;
  human?: boolean;
  details?: boolean;
  out: (line?: string) => void;
  checks: (root?: string) => Promise<ChecksSummary>;
}

export interface CommandResult {
  changed?: string[];
  warnings?: (string | IssueLike)[];
  errors?: IssueLike[];
  exitCode?: number;
  next?: string | null;
  data?: unknown;
}

// The --json envelope every command prints (docs/cli.md, Conventions).
export interface Envelope {
  ok: boolean;
  command: string;
  changed: string[];
  warnings: (string | EnvelopeIssue)[];
  errors: EnvelopeIssue[];
  next: string | null;
  data?: unknown;
}

export interface Command<S extends OptionSpecs = OptionSpecs> {
  name: string;
  group: GroupId;
  summary: string;
  args: CommandArg[];
  options: S;
  examples: string[];
  mutates: boolean;
  dryRun?: boolean;
  // false: runs outside a project; every other command needs harness.config.json.
  project?: boolean;
  // First-argument words, as plain words (sync) or described (tokens).
  subcommands?: (string | SubcommandInfo)[];
  starters?: string[];
  // Arguments like --sb-color-primary stay positionals.
  cssVarArgs?: boolean;
  // Method syntax on purpose: a command typed with its own options stays assignable to the registry's Command.
  run(ctx: CommandContext<S>): CommandResult | Promise<CommandResult>;
}
