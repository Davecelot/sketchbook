// npm run catalog:build: writes harness/catalog (installable components and kits) from the repo. See harness/commands/catalog.mjs.
// A no-op unless harness.config.json catalog.source is true: a team repo keeps the catalog the harness shipped.
import { buildCatalog } from '../harness/commands/catalog.mjs';

const r = buildCatalog(process.cwd());
console.log(r.skipped
  ? '[catalog:build] skipped: harness.config.json catalog.source is not true, so harness/catalog stays as shipped (sketchbook add installs from it).'
  : `[catalog:build] ${r.components.length} component(s), ${r.kits.length} kit(s) -> harness/catalog/`);
