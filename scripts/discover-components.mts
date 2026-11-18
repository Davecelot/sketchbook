// Finds every Lit element under src/components (including through mixins), its @property names and tag.
// Used by the barrel build and by check C3 (contract <-> code parity).
import { readdirSync, readFileSync, type Dirent } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parseJson } from '../harness/lib/files.mjs';

export interface LitElementInfo { className: string; props: string[]; tag: string; parts: string[]; slots: string[]; events: string[] }
export interface DiscoveredComponent extends LitElementInfo { dir: string; file: string }

const prefixOf = (root: string) => parseJson<{ prefix: string }>(readFileSync(path.join(root, 'harness.config.json'), 'utf8')).prefix;

// A mixin such as FormAssociated(LitElement) wraps the base in a call.
const wrapsLitElement = (expression: ts.Expression, sf: ts.SourceFile): boolean =>
  ts.isCallExpression(expression)
    ? expression.arguments.some((argument) => wrapsLitElement(argument, sf))
    : expression.getText(sf) === 'LitElement';

const extendsLitElement = (node: ts.ClassDeclaration, sf: ts.SourceFile) =>
  node.heritageClauses?.some(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword && clause.types.some((type) => wrapsLitElement(type.expression, sf)),
  ) ?? false;

const decoratorName = (member: ts.Node, sf: ts.SourceFile) =>
  (ts.canHaveDecorators(member) ? (ts.getDecorators(member) ?? []) : []).map((d) =>
    (ts.isCallExpression(d.expression) ? d.expression.expression : d.expression).getText(sf),
  );

const isPropertyMember = (member: ts.ClassElement, sf: ts.SourceFile): member is ts.PropertyDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration =>
  (ts.isPropertyDeclaration(member) || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) &&
  decoratorName(member, sf).includes('property');

export function analyzeFile(file: string, prefix: string): LitElementInfo | null {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const tagRe = new RegExp(`^${prefix}-[a-z0-9-]+$`);
  const tags: string[] = [];
  // Every Lit class found, in visit order: the last one is the element.
  const classes: { className: string; props: string[] }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) && tagRe.test(node.text)) tags.push(node.text);
    if (ts.isClassDeclaration(node) && node.name && extendsLitElement(node, sf)) {
      const props = [...new Set(node.members.filter((m) => isPropertyMember(m, sf)).map((m) => m.name.getText(sf)))];
      classes.push({ className: node.name.text, props });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const element = classes.at(-1);
  if (!element || !tags[0]) return null;
  return {
    ...element,
    tag: tags[0],
    parts: [...new Set([...text.matchAll(/\bpart="([a-z0-9- ]+)"/g)].flatMap((m) => (m[1] ?? '').split(' ')))],
    slots: [...new Set([...text.matchAll(/<slot(?:\s+name="([a-z0-9-]+)")?/g)].map((m) => m[1] ?? 'default'))],
    events: [...new Set([...text.matchAll(/new (?:Custom)?Event\(\s*'([a-z0-9-]+)'/g)].map((m) => m[1] ?? ''))],
  };
}

export function discoverComponents(root: string): DiscoveredComponent[] {
  const prefix = prefixOf(root);
  const dir = path.join(root, 'src', 'components');
  let dirs: Dirent[];
  try { dirs = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()); } catch { return []; }
  return dirs
    .flatMap((d) => {
      const files = readdirSync(path.join(dir, d.name)).filter((f) => f.endsWith('.ts') && !/\.(styles|stories)\.ts$/.test(f) && f !== 'index.ts');
      return files.map((f) => {
        const el = analyzeFile(path.join(dir, d.name, f), prefix);
        return el ? { dir: d.name, file: `src/components/${d.name}/${f}`, ...el } : null;
      }).filter((c): c is DiscoveredComponent => c !== null);
    })
    .sort((a, b) => a.tag.localeCompare(b.tag));
}
