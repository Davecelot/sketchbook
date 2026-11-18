// GENERATED from spec/schemas by scripts/build-schema-types.mjs. Do not edit.

export interface ComponentRegistry {
  $schema?: string;
  $description?: string;
  components: {
    name: string;
    tier: 1 | 2 | 3;
    status: "planned" | "draft" | "wip" | "beta" | "stable" | "deprecated" | "code-only";
    tag?: string;
    path?: string;
    owner?: string;
    version?: string;
    replacedBy?: string;
  }[];
}
