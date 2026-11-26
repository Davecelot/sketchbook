import type { Command } from '../types.mjs';

export default {
  name: 'workspace',
  group: 'project',
  summary: 'Review project status and check findings in a read-only terminal workspace. Requires an interactive terminal; use status and check for plain or JSON output.',
  args: [],
  options: {},
  examples: ['sketchbook workspace'],
  mutates: false,
  interactiveOnly: true,
  async run({ root, args, json, human }) {
    if (args.length) return { errors: [{ msg: 'Workspace does not take arguments.', fix: 'Run sketchbook help workspace.' }] };
    if (json || !human || !process.stdin.isTTY || !process.stdout.isTTY || process.env.TERM === 'dumb') {
      return { errors: [{ msg: 'Workspace needs an interactive terminal and runs without --json.', fix: 'Use sketchbook status and sketchbook check. Both accept --json.' }] };
    }
    const { workspace } = await import('../workspace.mjs');
    const { code, handoff } = await workspace({ root, input: process.stdin, output: process.stdout });
    if (handoff) process.stdout.write(`${handoff}\n`);
    return { exitCode: code };
  },
} satisfies Command;
