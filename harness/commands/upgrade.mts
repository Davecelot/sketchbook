// sketchbook upgrade --from <path|git-url> (SB-0048, SB-0062): bring harness-owned files up to a newer Sketchbook.
// A file is harness-owned only when BOTH this project's harness/manifest.json and the upstream one say so: an upstream
// cannot reclassify a team file as its own and overwrite it (those are reported, to merge by hand). Team-owned and
// shared files are compared and listed, never written. The ownership rules never come from upstream: harness/manifest.json
// and a pinned list of team files (configs, package files, spec, src, brands, tests, agent settings) are never written,
// whatever either manifest says; the manifest's differences are reported for a merge by hand (SB-0070). Records
// harnessVersion in harness.config.json. A git URL is cloned shallowly into a temporary folder and needs --yes (its commit is printed).
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import type { FixError } from './catalog.mjs';
import { walk, readJsonSync, readJsonStrict, writeFileAtomic, globToRegExp } from '../lib/files.mjs';

export interface HarnessManifest { version?: string; harness: string[]; team: string[]; shared?: string[]; ignore?: string[] }
export type Ownership = 'harness' | 'team' | 'shared' | 'other' | 'ignore';
export type TreeOwnership = Ownership | 'reclassified' | 'protected';
export interface TreeDiff { update: string[]; add: string[]; removedUpstream: string[]; teamDiffers: string[]; sharedDiffers: string[]; upstreamOnly: string[]; reclassified: string[]; protected: string[] }
export type ManifestDiff = Record<'harness' | 'team' | 'shared' | 'ignore', { added: string[]; removed: string[] }>;
export interface UpgradeResult extends TreeDiff { from: string; commit: string | null; version: { before: string | null; after: string | undefined }; manifest: ManifestDiff; dryRun: boolean }

const fail = (msg: string, fix: string): FixError => Object.assign(new Error(msg), { fix });
export const isGitUrl = (s: string): boolean => /^(https?:\/\/|git@|ssh:\/\/|git:\/\/|file:\/\/)/.test(s) || s.endsWith('.git');

// Never written by an upgrade, whatever either manifest says: the ownership rules themselves, team configs and package
// files (scripts run code), the team's sources and tests, and the agent's permissions and hooks (SB-0062, SB-0070).
export const NEVER_WRITE = ['harness/manifest.json', 'brand.config.json', 'harness.config.json', 'package.json', 'package-lock.json', 'spec/**', 'src/**', 'brands/**', 'playwright/tests/**', '.claude/settings*.json'];
const NEVER = NEVER_WRITE.map((g) => globToRegExp(g));

export function loadOwnership(dir: string): HarnessManifest {
  const m = readJsonSync<HarnessManifest>(join(dir, 'harness/manifest.json'));
  if (!m) throw fail(`${dir} has no harness/manifest.json; it is not a Sketchbook (or too old to upgrade from).`, 'Point --from at a Sketchbook checkout or its git URL.');
  return m;
}

// harness | team | shared | other. Exact harness paths (docs/cli.md) win over team globs; team globs win over harness globs.
export function classify(path: string, m: HarnessManifest): Ownership {
  const any = (globs: string[]): boolean => globs.some((g) => globToRegExp(g).test(path));
  if (any(m.ignore ?? [])) return 'ignore';
  if (m.harness.filter((g) => !/[*?]/.test(g)).includes(path)) return 'harness';
  if (any(m.team)) return 'team';
  if (any(m.harness)) return 'harness';
  if (any(m.shared ?? [])) return 'shared';
  return 'other';
}

const read = (p: string): Buffer | null => { try { return readFileSync(p); } catch { return null; } };

// Globs upstream adds to or removes from each list of the project's manifest (for a merge by hand; never applied).
export function manifestDiff(local: HarnessManifest, upstream: HarnessManifest): ManifestDiff {
  const diff = (k: keyof ManifestDiff) => {
    const a = local[k] ?? [];
    const b = upstream[k] ?? [];
    return { added: b.filter((g) => !a.includes(g)), removed: a.filter((g) => !b.includes(g)) };
  };
  return { harness: diff('harness'), team: diff('team'), shared: diff('shared'), ignore: diff('ignore') };
}

// Ownership from both manifests: harness only if both agree; one-sided harness claims are 'reclassified'.
export function classifyBoth(path: string, local: HarnessManifest, upstream: HarnessManifest): TreeOwnership {
  const here = classify(path, local);
  const there = classify(path, upstream);
  // The manifest and the agent settings are always reported, never written; the rest of the pinned list only matters
  // when a manifest calls it harness-owned (both: protected; one: reclassified, as any one-sided claim).
  if (path === 'harness/manifest.json' || /^\.claude\/settings[^/]*\.json$/.test(path)) return 'protected';
  // Only the engine's schema files (a project keeps them as editor hints) escape the pinned spec/** glob, and only when
  // both manifests list them by name; anything else pinned (package.json, configs) stays protected even then.
  const schema = /^spec\/schemas\/[a-z-]+\.schema\.json$/.test(path) && local.harness.includes(path) && upstream.harness.includes(path);
  if (here === 'harness' && there === 'harness') return NEVER.some((re) => re.test(path)) && !schema ? 'protected' : 'harness';
  if (here === 'harness' || there === 'harness') return 'reclassified';
  if (here === 'ignore' || there === 'ignore') return 'ignore';
  return here === 'other' ? there : here;
}

export function compareTrees(root: string, source: string, local: HarnessManifest, upstream: HarnessManifest = local): TreeDiff {
  const files = [...new Set([...walk(source, '.'), ...walk(root, '.')])].sort();
  const out: TreeDiff = { update: [], add: [], removedUpstream: [], teamDiffers: [], sharedDiffers: [], upstreamOnly: [], reclassified: [], protected: [] };
  for (const f of files) {
    const cls = classifyBoth(f, local, upstream);
    if (cls === 'ignore' || cls === 'other') continue;
    const s = read(join(source, f));
    const t = read(join(root, f));
    if (cls === 'harness') {
      if (s && !t) out.add.push(f);
      else if (s && t && !s.equals(t)) out.update.push(f);
      else if (!s && t) out.removedUpstream.push(f);
      continue;
    }
    if (cls === 'reclassified' || cls === 'protected') { if (s && !s.equals(t ?? Buffer.alloc(0))) out[cls].push(f); continue; }
    if (s && t && !s.equals(t)) out[cls === 'team' ? 'teamDiffers' : 'sharedDiffers'].push(f);
    else if (s && !t && cls === 'shared') out.upstreamOnly.push(f);
  }
  return out;
}

export function upgrade(root: string, from: unknown, { dryRun = false, yes = false }: { dryRun?: boolean; yes?: boolean } = {}): UpgradeResult {
  if (typeof from !== 'string' || !from || from.startsWith('-')) throw fail(`--from ${JSON.stringify(from)} is not a folder or a git URL.`, 'Pass a Sketchbook folder or a git URL (not starting with "-").');
  const git = isGitUrl(from);
  if (git && !dryRun && !yes) throw fail(`Upgrading from a git URL writes harness code (checks, CLI, hooks) you have not reviewed: ${from}.`, `Look first: sketchbook upgrade --from ${from} --dry-run (prints the commit); then rerun with --yes.`);
  let source: string;
  let tmp: string | null = null;
  let commit: string | null = null;
  try {
    if (git) {
      tmp = mkdtempSync(join(tmpdir(), 'sketchbook-upgrade-'));
      const r = spawnSync('git', ['clone', '--depth', '1', '--quiet', '--', from, tmp], { encoding: 'utf8' });
      if (r.status !== 0) throw fail(`git clone ${from} failed: ${r.stderr.trim()}`, 'Check the URL and your access, or clone it yourself and pass the folder.');
      commit = spawnSync('git', ['-C', tmp, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim() || null;
      source = tmp;
    } else source = resolve(root, from);
    if (!existsSync(source)) throw fail(`${from} does not exist.`, 'Pass a Sketchbook folder or a git URL.');
    const m = loadOwnership(source);
    if (!existsSync(join(root, 'harness/manifest.json'))) throw fail('This project has no harness/manifest.json, so upgrade cannot tell which files are yours.', `Review ${from}'s harness/manifest.json, copy it to harness/manifest.json, then run the upgrade again.`);
    if (!existsSync(join(root, 'harness.config.json'))) throw fail('This folder has no harness.config.json: it is not a Sketchbook project, so upgrade writes nothing.', 'sketchbook init creates a project in an empty folder.');
    const local = loadOwnership(root);
    const diff = compareTrees(root, source, local, m);
    const config = readJsonStrict<HarnessConfigJson>(join(root, 'harness.config.json'));
    if (!config) throw new TypeError("Cannot read properties of null (reading 'harnessVersion')");
    const before = config.harnessVersion ?? null;
    const writes = [...diff.add, ...diff.update];
    // A folder upgrade replaces harness-owned files, local edits included: confirmed like a git URL (SB-0116).
    if (writes.length && !dryRun && !yes) throw fail(`upgrade --from ${from} would write ${writes.length} harness-owned file(s), replacing any local edit: ${writes.slice(0, 5).join(', ')}${writes.length > 5 ? ', …' : ''}.`, `Look first: sketchbook upgrade --from ${from} --dry-run; commit (git is the undo), then rerun with --yes.`);
    if (!dryRun) {
      for (const f of [...diff.add, ...diff.update]) { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), readFileSync(join(source, f))); }
      config.harnessVersion = m.version;
      writeFileAtomic(join(root, 'harness.config.json'), JSON.stringify(config, null, 2) + '\n');
    }
    return { from, commit, version: { before, after: m.version }, ...diff, manifest: manifestDiff(local, m), dryRun };
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}
