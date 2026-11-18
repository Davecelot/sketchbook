// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.

export type Hex = string;
export type PresetId = string;

export interface BrandConfig {
  $schema?: string;
  $description?: string;
  name: string;
  color?: {
    primary?: Hex | "neutral";
    neutral?:
      | PresetId
      | {
          preset?: PresetId;
          custom?: unknown;
          $description?: string;
          hue?: number;
          chroma?: number;
        };
    accents?: {
      [k: string]: Hex;
    };
    roles?: {
      destructive?: string;
      success?: string;
      warning?: string;
      info?: string;
    };
    ramp?: {
      method?: "oklch";
      preset?: "oklch";
      /**
       * @minItems 3
       */
      steps?: [
        50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
        50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
        50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
        ...(50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950)[]
      ];
    };
  };
  /**
   * @minItems 1
   */
  modes?: [
    (
      | string
      | {
          name: string;
          role?: "light" | "dark";
        }
    ),
    ...(
      | string
      | {
          name: string;
          role?: "light" | "dark";
        }
    )[]
  ];
  typography?: {
    family?: string;
    fallback?: string;
    mono?: string;
    baseSize?: number;
    scale?:
      | number
      | PresetId
      | {
          preset?: PresetId;
          custom?: unknown;
          $description?: string;
          ratio?: number;
          sizes?: NumberMap;
          leading?: NumberMap;
        };
    lineHeights?:
      | PresetId
      | {
          preset?: PresetId;
          custom?: unknown;
          $description?: string;
          named?: NumberMap;
          text?: number;
          display?: number;
        };
    letterSpacing?:
      | PresetId
      | {
          preset?: PresetId;
          custom?: unknown;
          $description?: string;
          [k: string]: string;
        };
    weights?:
      | PresetId
      | {
          preset?: PresetId;
          custom?: unknown;
          $description?: string;
          [k: string]: number;
        };
    source?: {
      kind: "google" | "url" | "local" | "none";
      family?: string;
      url?: string;
      path?: string;
      weights?: number[];
      display?: string;
      files?: {
        path: string;
        weight?: number | string;
        style?: string;
      }[];
      mono?:
        | string
        | {
            family: string;
            url?: string;
            weights?: number[];
            files?: {
              path: string;
              weight?: number | string;
              style?: string;
            }[];
          };
    };
  };
  spacing?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        base?: number;
        steps?: number[];
      };
  radius?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        style?: "sharp" | "soft" | "round";
        base?: number;
        scale?: NumberMap;
        roles?: StringMap;
      };
  elevation?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        shadows?: {
          /**
           * @minItems 4
           */
          [k: string]: [number, number, number, number, ...number[]];
        };
        roles?: StringMap;
      };
  motion?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        durations?: NumberMap;
        easings?: {
          /**
           * @minItems 4
           */
          [k: string]: [number, number, number, number, ...number[]];
        };
        roles?: StringMap;
      };
  density?:
    | ("compact" | "comfortable" | "spacious")
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        height?: NumberMap;
        "padding-x"?: StringMap;
        gap?: StringMap;
      };
  contrast?: {
    standard?: "WCAG21-AA" | "WCAG21-AAA" | "wcag-aa" | "wcag-aaa";
    preset?: "wcag-aa" | "wcag-aaa";
    targets?: NumberMap;
    apca?: boolean;
  };
  grid?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        columns?: number;
        gutter?: number;
        margin?: number;
      };
  breakpoints?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        [k: string]: number;
      };
  icons?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        [k: string]: number;
      };
  z?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        values?: NumberMap;
        roles?: StringMap;
      };
  opacity?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        [k: string]: number;
      };
  border?:
    | PresetId
    | {
        preset?: PresetId;
        custom?: unknown;
        $description?: string;
        [k: string]: number;
      };
}
export interface NumberMap {
  [k: string]: number;
}
export interface StringMap {
  [k: string]: string;
}
