import type { BrandConfig } from '../../generated/types/brand-config.js';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { ComponentRegistry } from '../../generated/types/registry.js';
import type { OverrideEntry } from '../generators/foundation.mjs';
import type { ComponentCss } from '../lib/css.mjs';
import type { ContrastPair } from '../lib/interface.mjs';
import type { Schema } from '../lib/schema.mjs';
import type { TokenData } from '../lib/tokens.mjs';

// A type alias, not an interface: it stays assignable to the index-signature issue types callers declare (commands/tokens.mts).
export type CheckIssue = {
  file?: string | null;
  msg: string;
  fix?: string | null;
  token?: string;
  line?: number;
  mode?: string | null;
  brand?: string;
};

export type CheckInfo = string | Record<string, unknown>;

export interface CheckResult {
  errors?: CheckIssue[];
  warnings?: CheckIssue[];
  info?: CheckInfo[];
}

export interface CheckOutcome {
  id: string;
  title: string;
  errors: CheckIssue[];
  warnings: CheckIssue[];
  info: CheckInfo[];
}

export interface CheckContext {
  root: string;
  config: HarnessConfigJson;
  brand: BrandConfig;
  registry: ComponentRegistry;
  contrastPairs: ContrastPair[];
  schemas: { brand: Schema | null; contract: Schema | null; registry: Schema | null };
  all: TokenData;
  css: ComponentCss[];
  maintainer: boolean;
  previous: CheckOutcome[];
}

export interface Check {
  id: string;
  title: string;
  run: (ctx: CheckContext) => CheckResult | Promise<CheckResult>;
}

export interface ReportOverride extends OverrideEntry { token: string }

export interface Report {
  ok: boolean;
  exitCode: 0 | 1 | 2;
  results: CheckOutcome[];
  overrides: ReportOverride[];
}

// The engine ships every schema; a missing one fails the check loudly, as validating null always did.
export function schemaOrThrow(schema: Schema | null, name: string): Schema {
  if (!schema) throw new TypeError(`spec/schemas/${name}.schema.json is missing`);
  return schema;
}
