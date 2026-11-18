import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/typography/contract.json';
import contractDoc from '../../../spec/components/typography/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { kind: string; text: string };

const sample: Record<string, string> = {
  h1: 'Quarterly planning guide',
  h2: 'Before you start',
  h3: 'Collect your inputs',
  h4: 'Optional extras',
  p: 'A short paragraph of body copy shows the line height and the measure of running text.',
  blockquote: 'A quotation is set apart from the text around it by an indented bar.',
  'inline-code': 'npm run build',
  lead: 'One sentence that introduces what follows.',
  large: 'Review your changes',
  small: 'Email address',
  muted: 'Shown only to you.',
};

const meta: Meta<Args> = {
  title: 'Components/Typography',
  component: 'sb-typography',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: { ...argTypesFrom(contract), text: { control: 'text' } },
  args: { ...(argsFrom(contract) as Args), text: sample.p },
  render: ({ kind, text }) => html`<sb-typography kind=${kind}>${text}</sb-typography>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    matrixOf(contract, ({ kind }) =>
      kind === 'list'
        ? html`<sb-typography kind="list"><li>First item</li><li>Second item</li></sb-typography>`
        : html`<sb-typography kind=${kind}>${sample[kind ?? '']}</sb-typography>`,
    ),
};

export const Article: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<article style="max-width: 40rem">
    <sb-typography kind="h1">${sample.h1}</sb-typography>
    <sb-typography kind="p">${sample.p}</sb-typography>
    <sb-typography kind="h2">${sample.h2}</sb-typography>
    <sb-typography kind="p">Run <sb-typography kind="inline-code">${sample['inline-code']}</sb-typography> and check the output.</sb-typography>
    <sb-typography kind="blockquote">${sample.blockquote}</sb-typography>
    <sb-typography kind="h3">${sample.h3}</sb-typography>
    <sb-typography kind="p">The checklist has three steps:</sb-typography>
    <sb-typography kind="list"><li>Gather the files</li><li>Review each one</li><li>Send the summary</li></sb-typography>
    <sb-typography kind="h4">${sample.h4}</sb-typography>
    <sb-typography kind="muted">${sample.muted}</sb-typography>
  </article>`,
};

export const InlineCode: Story = {
  args: { kind: 'inline-code', text: sample['inline-code'] },
};

export const Lead: Story = { args: { kind: 'lead', text: sample.lead } };

export const Muted: Story = { args: { kind: 'muted', text: sample.muted } };
