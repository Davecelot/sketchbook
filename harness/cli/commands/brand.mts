import { listBrands, addBrand, useBrand, buildBrands } from '../../commands/brand.mjs';

import type { Command, OptionSpecs } from '../types.mjs';

const ACTIONS = ['list', 'add', 'use', 'build'];

const options = {
  from: { type: 'string', value: 'current|brand', description: 'add: start from brand.config.json (current, default) or another brand' },
  yes: { type: 'boolean', description: 'use: confirm overwriting brand.config.json edits saved in no brand file, and clearing foundation overrides' },
} satisfies OptionSpecs;

export default {
  name: 'brand',
  group: 'tokens',
  summary: 'Several brands over one semantic interface: brands/<name>.brand.json; add, list, use (copy into brand.config.json and regenerate) and build (tokens.<brand>.css for each).',
  subcommands: ['add', 'list', 'use', 'build'],
  args: [
    { name: 'action', required: false, description: 'list (default) | add | use | build' },
    { name: 'name', required: false, description: 'Brand name (lowercase), for add and use' },
  ],
  options,
  examples: ['sketchbook brand add ocean --from current', 'sketchbook brand list', 'sketchbook brand use ocean', 'sketchbook brand build'],
  mutates: true,
  dryRun: true,
  async run({ root, args, options, dryRun, out, checks }) {
    const [action = 'list', name] = args;
    if (!ACTIONS.includes(action)) throw Object.assign(new Error(`Unknown brand action "${action}".`), { fix: `Use ${ACTIONS.join(' | ')}.` });
    if (action === 'list') {
      const brands = listBrands(root).map(({ name: n, file, active, brand }) => ({ name: n, file, active, primary: brand?.color?.primary ?? null }));
      if (!brands.length) out('Single brand (no brands/ folder). sketchbook brand add <name> --from current starts a second one.');
      for (const b of brands) out(`${b.active ? '*' : ' '} ${b.name.padEnd(14)} ${b.file} (primary ${b.primary})`);
      return { data: { brands }, next: brands.length ? 'sketchbook brand build' : 'sketchbook brand add <name> --from current' };
    }
    if (action === 'build') {
      if (dryRun) { const b = listBrands(root); out(b.length ? `Would write ${b.map((x) => `generated/css/tokens.${x.name}.css`).join(', ')}, generated/css/brands.css` : 'No brands: nothing to build.'); return { changed: b.length ? [...b.map((x) => `generated/css/tokens.${x.name}.css`), 'generated/css/brands.css'] : [] }; }
      const r = await buildBrands(root);
      out(r.files.length ? `Built ${r.files.join(', ')}. Checks:` : 'No brands/ folder: single brand, nothing to build.');
      if (!r.files.length) return { data: r };
      const c = await checks();
      return { changed: r.files, errors: c.errors, warnings: c.warnings, exitCode: c.exitCode === 1 ? 1 : 0, data: r, next: 'npm run storybook (Brand toolbar)' };
    }
    if (!name) throw Object.assign(new Error(`Usage: sketchbook brand ${action} <name>`), { fix: 'sketchbook brand list' });
    if (action === 'add') {
      const r = addBrand(root, name, { from: options.from ?? 'current', dryRun });
      out(`${dryRun ? 'Would write' : 'Wrote'} ${r.file} (from ${options.from ?? 'current'}). Edit it like brand.config.json, then sketchbook brand build.`);
      return { changed: [r.file], data: { name: r.name, file: r.file }, next: 'sketchbook brand build' };
    }
    const u = await useBrand(root, name, { dryRun, yes: options.yes });
    if (dryRun) {
      out(`Would copy brands/${name}.brand.json into brand.config.json (valid) and regenerate.`);
      for (const r of u.risks) out(`Needs --yes: ${r}.`);
      return { changed: ['brand.config.json', 'spec/tokens/foundation/*', 'generated/css/tokens.css', ...(u.overrides.length ? ['spec/tokens/overrides.json'] : [])], data: { name, unsaved: u.unsaved, overrides: u.overrides } };
    }
    if (u.overrides.length) out(`Overrides cleared (they belonged to the previous brand): ${u.overrides.map((o) => `${o.path} = ${JSON.stringify(o.value)}`).join(', ')}.`);
    out(`brand.config.json is now ${name}; foundation, links and tokens rebuilt. Checks:`);
    const c = await checks();
    return { changed: ['brand.config.json', 'spec/tokens/foundation/*', 'spec/tokens/semantic/*', 'generated/css/tokens.css'], errors: c.errors, warnings: c.warnings, exitCode: c.exitCode === 1 ? 1 : 0, data: { name } };
  },
} satisfies Command<typeof options>;
