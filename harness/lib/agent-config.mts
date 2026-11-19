// Render only the two project-owned adapter templates that refer to the engine package by name.
export const AGENT_ENGINE_FILES = ['.gemini/sketchbook-guard.mjs', '.github/hooks/sketchbook-guard.mjs'] as const;

export function renderAgentSetup(file: string, source: string, packageName: string): string {
  if (!AGENT_ENGINE_FILES.some((name) => name === file)) return source;
  if (!/^(?:@[a-zA-Z0-9][\w.-]*\/)?[a-zA-Z0-9][\w.-]*$/.test(packageName)) throw new Error(`Invalid engine package name: ${packageName}`);
  if (packageName === 'sketchbook') return source;
  const marker = file === '.gemini/sketchbook-guard.mjs' ? "'sketchbook/harness/agent/gemini-guard.mjs'" : "'sketchbook/harness/cli.mjs'";
  if (!source.includes(marker)) throw new Error(`Cannot render ${file}: engine package marker is missing.`);
  const replacement = JSON.stringify(`${packageName}/${file === '.gemini/sketchbook-guard.mjs' ? 'harness/agent/gemini-guard.mjs' : 'harness/cli.mjs'}`);
  return source.replace(marker, replacement);
}
