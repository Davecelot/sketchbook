// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.

export interface DesignFilePractices {
  $schema?: string;
  $description?: string;
  version: number;
  sources: {
    [k: string]: {
      name: string;
      url: null | string;
    };
  };
  aspects: {
    [k: string]: {
      question: string;
      options: {
        [k: string]: {
          summary: string;
          seenIn: string[];
        };
      };
      adopted: string;
      reason: string;
    };
  };
}
