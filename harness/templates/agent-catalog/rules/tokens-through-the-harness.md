# Rule: tokens through the harness

- Change foundations (color, typography, spacing, radius, elevation, motion, density, layout grid, icons, z-index, opacity, borders, contrast) in `brand.config.json` (a `preset` or `custom` value) or with `sketchbook tokens set|preset`, then let the generator rebuild. The `foundations` skill drives this.
- Never edit `spec/tokens/foundation/*` or `generated/**` by hand. A hand edit to a foundation token is kept, but as a flagged override (`spec/tokens/overrides.json`, check exits 2) that no longer follows its preset; resolve it into brand.config and `sketchbook tokens overrides reset <path>`, or record why it stays.
- Semantic files (`spec/tokens/semantic/*`) belong to the team: change values there freely, or with `sketchbook tokens add|remove`. **Renames** go through `sketchbook tokens rename <old> <new>`: semantic tokens are an interface (`spec/tokens/interface.json`) that contracts, stories, specs and `.storybook` depend on, and a rename by hand breaks them silently.
- Which semantic tokens follow the brand is declared in `spec/tokens/brand-links.json`; unlink a token by removing its link, not by overwriting its value.
- Imports (`sketchbook tokens import`) are proposals; apply them only after review (`sketchbook tokens import apply`).
- Use `--dry-run` first; end with `sketchbook tokens diff`, `sketchbook tokens impact` and `sketchbook check`.
