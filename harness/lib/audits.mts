import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const PARITY_AUDITS = 'docs/parity-audits';
export const A11Y_AUDITS = 'docs/a11y-audits';

// Exact name and date, so button-group-<date> never counts as an audit of button.
export function auditsOf(root: string, dir: string, name: string): string[] {
  const re = new RegExp(`^${name}-\\d{4}-\\d{2}-\\d{2}\\.md$`);
  try { return readdirSync(join(root, dir)).filter((f) => re.test(f)).sort(); } catch { return []; }
}
