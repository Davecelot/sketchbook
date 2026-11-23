// Minimal JSON Schema validator for the harness's own schemas (no dependency, per D-013).
// Supports: type, enum, const, required, properties, additionalProperties, items,
// minItems, uniqueItems, minLength, minimum, pattern, anyOf, $ref to "#/$defs/<name>".
import { isDeepStrictEqual } from 'node:util';

export interface Schema {
  $ref?: string;
  $defs?: Record<string, Schema>;
  anyOf?: Schema[];
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  minLength?: number;
  pattern?: string;
  minItems?: number;
  uniqueItems?: boolean;
  minimum?: number;
  items?: Schema;
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const typeOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const matchesType = (v: unknown, t: string) => (t === 'number' ? typeof v === 'number' : t === 'integer' ? Number.isInteger(v) : typeOf(v) === t);

export function validate(schema: Schema, value: unknown, root: Schema = schema, path = '$'): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${path}: ${msg}`);
  if (schema.$ref) {
    const name = schema.$ref.replace('#/$defs/', '');
    const target = root.$defs?.[name];
    if (!target) return [`${path}: unknown $ref ${schema.$ref}`];
    errors.push(...validate(target, value, root, path));
  }
  if (schema.anyOf) {
    const results = schema.anyOf.map((s) => validate(s, value, root, path));
    if (!results.some((r) => r.length === 0)) err(`does not match any allowed shape (${results.map((r) => r[0]).join(' | ')})`);
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) { err(`expected ${types.join(' or ')}, got ${typeOf(value)}`); return errors; }
  }
  if (schema.const !== undefined && value !== schema.const) err(`must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) err(`must be one of ${schema.enum.map((x) => JSON.stringify(x)).join(', ')}`);
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) err(`must be at least ${schema.minimum}`);
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) err(`must have at least ${schema.minLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) err(`must match ${schema.pattern}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) err(`must have at least ${schema.minItems} items`);
    if (schema.uniqueItems && value.some((item, i) => value.slice(0, i).some((previous) => isDeepStrictEqual(item, previous)))) err('must have unique items');
    if (schema.items) {
      const items = schema.items;
      value.forEach((v, i) => errors.push(...validate(items, v, root, `${path}[${i}]`)));
    }
  }
  if (isRecord(value)) {
    for (const k of schema.required || []) if (!(k in value)) err(`missing required "${k}"`);
    for (const [k, v] of Object.entries(value)) {
      const property = schema.properties?.[k];
      if (property) errors.push(...validate(property, v, root, `${path}.${k}`));
      else if (schema.additionalProperties === false) err(`unknown property "${k}"`);
      else if (typeof schema.additionalProperties === 'object') errors.push(...validate(schema.additionalProperties, v, root, `${path}.${k}`));
    }
  }
  return errors;
}
