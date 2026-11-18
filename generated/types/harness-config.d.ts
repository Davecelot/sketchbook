// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.

/**
 * How the harness builds outputs: tag and CSS prefix, adapters, feature switches, references and white-label guard.
 */
export interface HarnessConfigJson {
  $schema?: string;
  /**
   * Custom-element and CSS custom-property prefix (<prefix>-button, --<prefix>-color-primary).
   */
  prefix: string;
  language?: {
    ai?: string;
    human?: string;
    [k: string]: unknown;
  };
  adapters: {
    components: "lit";
    tokens: "style-dictionary" | "plain";
    preview: "storybook";
    tests: "playwright";
    design: {
      tool: "figma" | "none";
      file?: string | null;
      fileName?: string;
      /**
       * Rendering parameters for the documentation pages (spec/design-docs.json, docs/design-docs/). The only absolute in the doc shell.
       */
      docs?: {
        /**
         * Doc root width in px; every other size is a token or a grid span.
         */
        width: number;
        [k: string]: unknown;
      };
      /**
       * false disables sync and drift checks for the tool; everything else keeps working.
       */
      available?: boolean;
      note?: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  /**
   * Process switches read by the rules and slash commands (advisory: checks do not depend on them).
   */
  features: {
    planningGate?: boolean;
    specTasks?: boolean;
    testFirst?: boolean;
    issueTracker?: boolean;
    reviewGate?: boolean;
    releaseFlow?: boolean;
  };
  ui?: {
    reference?: string;
    note?: string;
    [k: string]: unknown;
  };
  process?: {
    reference?: string;
    note?: string;
    [k: string]: unknown;
  };
  /**
   * Optional Claude-layer groups installed in this project (sketchbook init --with); harness/manifest.json "optional" lists their files.
   */
  claudeExtras?: "forge"[];
  /**
   * The starting point chosen with sketchbook init --start (harness/starters/<id>.json).
   */
  starter?: string;
  /**
   * Version of the harness-owned files (harness/manifest.json), bumped by sketchbook upgrade.
   */
  harnessVersion?: string;
  catalog?: {
    /**
     * true only in the repo harness/catalog is built from: check G1 then keeps the catalog equal to the components.
     */
    source?: boolean;
    note?: string;
    [k: string]: unknown;
  };
  /**
   * Bytes of the Claude layer that are in context in every session: CLAUDE.md, rules without paths:, model-invocable skill and command descriptions, and what the SessionStart, UserPromptSubmit and SubagentStart hooks print (check H1, SB-0114).
   */
  contextBudget?: {
    alwaysOnBytes?: number;
    note?: string;
    [k: string]: unknown;
  };
  whiteLabel?: {
    forbiddenTerms?: string[];
    note?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
