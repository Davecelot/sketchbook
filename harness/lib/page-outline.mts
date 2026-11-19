// Static page-outline guidance shared by non-Claude CLI clients. Keep behavior aligned with the Claude hook.
export function isSketchbookPage(html: string, prefix = 'sb'): boolean {
  const text = html.replace(/<!--[\s\S]*?-->/g, '');
  const safePrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return /<(html|body)[\s>]/i.test(text) && new RegExp(`<${safePrefix}-[a-z]`, 'i').test(text);
}

export function pageOutlineMisses(html: string, prefix = 'sb'): string[] {
  const text = html.replace(/<!--[\s\S]*?-->/g, '');
  if (!isSketchbookPage(html, prefix)) return [];
  const tags = text.match(/<[a-z][^>]*>/gi) ?? [];
  const role = (r: string) => (t: string): boolean => new RegExp(`\\srole\\s*=\\s*["']?${r}\\b`, 'i').test(t);
  const misses: string[] = [];
  if (!tags.some((t) => /^<h1[\s>]/i.test(t) || (role('heading')(t) && /\saria-level\s*=\s*["']?1\b/i.test(t)))) misses.push('no level-1 heading (axe page-has-heading-one)');
  if (!tags.some((t) => /^<main[\s>]/i.test(t) || role('main')(t))) misses.push('no main landmark (axe landmark-one-main, region)');
  return misses;
}
