// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.

export interface APIVocabulary {
  $schema?: string;
  $description?: string;
  version: number;
  vocabularies: {
    /**
     * @minItems 1
     */
    [k: string]: [string, ...string[]];
  };
  props: {
    [k: string]: {
      type: "variant" | "boolean" | "text" | "number";
      values?: string | string[];
      meaning: string;
      figma: null | Figma;
      proposal?: boolean;
    };
  };
  content: {
    [k: string]: {
      kind: "text" | "icon" | "slot";
      meaning: string;
      figma: null | Figma;
    };
  };
  states: {
    /**
     * @minItems 1
     */
    axis: [string, ...string[]];
    keys: {
      [k: string]: string;
    };
    canonicalKeys?: {
      [k: string]: string | [string, ...string[]];
    };
    draw?: {
      [k: string]: {
        axis: string;
        /**
         * @minItems 2
         */
        values?: [string, string, ...string[]];
        atRestOnly?: boolean;
        excludes?: {
          [k: string]: string;
        };
      };
    };
    meaning?: string;
  };
  events: {
    standard: string[];
    customPrefix: string;
    aliases?: {
      [k: string]: string;
    };
    meaning?: string;
  };
  aliases: {
    [k: string]: {
      to: string;
      in?: "props" | "content";
      values?: {
        [k: string]: string;
      };
      proposal?: boolean;
    };
  };
  slots?: {
    [k: string]: {
      meaning: string;
      text: {
        name: string;
        visible: string;
        underline?: string;
      };
      icon?: {
        visible: string;
        swap: string;
      };
    };
  };
  layers?: {
    [k: string]: {
      reason: string;
    };
  };
  /**
   * Elements drawn as design-file sets of their own: <component>.<element tag without the prefix>.
   */
  sets?: {
    [k: string]: {
      meaning: string;
    };
  };
  /**
   * Content regions drawn as design-file slots: <component>.<layer the recipe draws>. The layer takes the slot's name; preferred lists component folders offered first, never a limit.
   */
  regions?: {
    [k: string]: {
      name: string;
      meaning: string;
      preferred?: string[];
    };
  };
  parts?: {
    [k: string]: {
      repeats: string;
      meaning: string;
      figma: {
        name: string;
        as: "property";
      };
    };
  };
  extensions: {
    [k: string]: {
      reason: string;
      values?: string[];
      draw?: boolean;
    };
  };
}
export interface Figma {
  name?: string;
  as?: "axis" | "property" | "text" | "state";
  state?: string;
  visible?: string;
  swap?: string;
  /**
   * The TEXT property of the underlined twin of this text layer (a variant that underlines it draws a second layer on the underline text style).
   */
  underline?: string;
}
