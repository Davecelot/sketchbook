// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.

export type Token =
  | string
  | {
      value: string;
      type?: string;
      description?: string;
    };

/**
 * Typed spec every component is built and checked against (harness contract format). Unconfirmed items carry "proposal": true. Additions over the base contract shape: tokens (component layer, D-011) and accessibility.contrast.
 */
export interface ComponentContract {
  $schema?: string;
  component: string;
  tag: string;
  status: "planned" | "draft" | "wip" | "beta" | "stable" | "deprecated" | "code-only";
  version?: string;
  /**
   * @minItems 1
   */
  platforms: ["web" | "design", ...("web" | "design")[]];
  summary: string;
  dependsOn?: string[];
  props: {
    [k: string]: Prop;
  };
  /**
   * @minItems 1
   */
  anatomy: [Part, ...Part[]];
  variantMatrix?: {
    dimensions: {
      /**
       * @minItems 2
       */
      [k: string]: [string, string, ...string[]];
    };
    excludedCombinations?: {
      [k: string]: unknown;
    }[];
  };
  content?: {
    [k: string]: Content;
  };
  events?: {
    [k: string]: Event;
  };
  states?: {
    [k: string]: State;
  };
  accessibility: Accessibility;
  tokens: {
    [k: string]: Token;
  };
  aiHints?: AiHints;
  realizations: {
    web?: Realization;
    design?: Realization;
  };
  openQuestions: Question[];
  decisions?: string[];
  /**
   * The one open section: keys are dotted namespaces (design.figma), checked by C1; nothing else may be added to a contract.
   */
  $extensions?: {
    [k: string]: unknown;
  };
  /**
   * Sub-elements of a component family (shadcn parts as custom elements, e.g. sb-card-header). Each is checked by C3 against its own API.
   */
  elements?: Element[];
}
export interface Prop {
  type: "text" | "boolean" | "variant" | "instanceSwap" | "slot" | "fixed" | "number";
  /**
   * @minItems 1
   */
  values?: [string, ...string[]];
  default?: string | boolean | number | null;
  attribute?: string;
  reflect?: boolean;
  required?: boolean;
  note: string;
  proposal?: boolean;
}
export interface Part {
  name: string;
  role: "container" | "slot" | "text" | "icon" | "control" | "other";
  parent?: string | null;
  part?: string;
  optional?: boolean;
  controlledBy?: string;
  component?: string;
  notes?: string;
}
export interface Content {
  required?: boolean;
  component?: string;
  multiple?: boolean;
  notes: string;
}
export interface Event {
  bubbles: boolean;
  composed: boolean;
  cancelable?: boolean;
  native?: boolean;
  detail?: string | null;
  note: string;
}
export interface State {
  trigger: string;
  tokens?: string[];
  note?: string;
  /**
   * The token the border takes in this state (a focused field: its focus ring color).
   */
  borderColor?: string;
}
export interface Accessibility {
  role: string;
  native?: string;
  accessibleNameSource: string;
  formAssociation?: {
    value: boolean;
    note?: string;
    [k: string]: unknown;
  };
  targetSize?: string;
  focusRingVisible?: string;
  missingNameWarning?: string;
  keyboard: {
    [k: string]: string;
  };
  aria?: string[];
  announcements?: string[];
  contrast: {
    fg: string;
    bg: string;
    kind: "text" | "large-text" | "ui";
  }[];
  wcag?: string[];
}
export interface AiHints {
  category?: "atom" | "molecule" | "organism";
  keywords?: string[];
  useCases?: {
    when: string;
    use: string;
  }[];
  antiPatterns?: {
    pattern: string;
    why: string;
    alternative: string;
  }[];
}
export interface Realization {
  status?: "not-started" | "partial" | "complete";
  files?: string[];
  parts?: string[];
  slots?: string[];
  properties?: {
    [k: string]: unknown;
  };
  spec?: string | null;
  coverage?: string[];
  drift?: {
    aspect: string;
    contract: string;
    realization: string;
  }[];
}
export interface Question {
  id?: string;
  question: string;
  recommendation?: string;
  status: "open" | "answered";
  answer?: string;
  answeredOn?: string;
}
export interface Element {
  tag: string;
  summary: string;
  props?: {
    [k: string]: Prop;
  };
  anatomy?: Part[];
  content?: {
    [k: string]: Content;
  };
  events?: {
    [k: string]: Event;
  };
  role?: string;
  notes?: string;
}
