import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, svg } from 'lit';

import './sign-in.css';

// Lucide "eye", "circle-alert" (ISC), decorative.
const icon = (paths: unknown, slot?: string) =>
  html`<svg slot=${slot ?? nothing} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const eye = icon(svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" />`);
const alertIcon = icon(svg`<circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />`, 'icon');

// The reveal button swaps the field type and says what the next press does.
const togglePassword = (event: Event) => {
  const button = event.currentTarget as HTMLElement;
  const input = button.closest('sb-field')!.querySelector('input')!;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
};

const keepOnPage = (event: Event) => event.preventDefault();

const password = (autocomplete: string, description?: string) => html`<sb-field>
  <sb-field-label>Password</sb-field-label>
  <sb-input-group>
    <input type="password" name="password" autocomplete=${autocomplete} required />
    <sb-input-group-addon align="inline-end">
      <sb-input-group-button size="icon-tiny" aria-label="Show password" @click=${togglePassword}>${eye}</sb-input-group-button>
    </sb-input-group-addon>
  </sb-input-group>
  ${description ? html`<sb-field-description>${description}</sb-field-description>` : nothing}
</sb-field>`;

interface SignInOptions {
  error?: boolean;
  loading?: boolean;
  email?: string;
}

const signIn = ({ error = false, loading = false, email = '' }: SignInOptions = {}) => html`<main class="sign-in">
  <sb-card>
    <sb-card-header>
      <sb-card-title><h1 id="sign-in-title">Sign in</h1></sb-card-title>
      <sb-card-description>Use the email address you work with.</sb-card-description>
    </sb-card-header>
    <sb-card-content>
      <form class="sign-in__form" aria-labelledby="sign-in-title" aria-busy=${loading ? 'true' : nothing} @submit=${keepOnPage}>
        ${error
          ? html`<sb-alert feedback="danger">
              ${alertIcon}
              <sb-alert-title>We could not sign you in</sb-alert-title>
              <sb-alert-description>The email or password is not right. Check both and try again.</sb-alert-description>
            </sb-alert>`
          : nothing}
        <sb-input label="Email" type="email" name="email" autocomplete="email" value=${email || nothing} required></sb-input>
        ${password('current-password')}
        <div class="sign-in__row">
          <sb-checkbox name="remember" label="Keep me signed in"></sb-checkbox>
          <sb-button variant="link" href="#reset-password">Forgot password?</sb-button>
        </div>
        <sb-button type="submit" ?loading=${loading}>Sign in</sb-button>
        <sb-field-separator>or</sb-field-separator>
        <sb-button variant="tertiary">Continue with single sign-on</sb-button>
      </form>
    </sb-card-content>
    <sb-card-footer class="sign-in__aside">
      <sb-typography kind="muted">New here?</sb-typography>
      <sb-button variant="link" href="#sign-up">Create an account</sb-button>
    </sb-card-footer>
  </sb-card>
</main>`;

const meta: Meta = {
  title: 'Patterns/Sign In',
  parameters: { docs: { description: { component: 'Help people sign in or create an account, with password visibility, single sign-on, and a place to explain errors.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => signIn(),
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const WithError: Story = { render: () => signIn({ error: true, email: 'ada@example.com' }) };

export const Loading: Story = { render: () => signIn({ loading: true, email: 'ada@example.com' }) };

export const SignUp: Story = {
  render: () => html`<main class="sign-in">
    <sb-card>
      <sb-card-header>
        <sb-card-title><h1 id="sign-up-title">Create an account</h1></sb-card-title>
        <sb-card-description>It takes a minute. You can invite your team later.</sb-card-description>
      </sb-card-header>
      <sb-card-content>
        <form class="sign-in__form" aria-labelledby="sign-up-title" @submit=${keepOnPage}>
          <sb-input label="Full name" name="name" autocomplete="name" required></sb-input>
          <sb-input label="Email" type="email" name="email" autocomplete="email" required></sb-input>
          ${password('new-password', 'Use at least 12 characters.')}
          <sb-checkbox name="terms" label="I agree to the terms of service" required></sb-checkbox>
          <sb-button type="submit">Create account</sb-button>
        </form>
      </sb-card-content>
      <sb-card-footer class="sign-in__aside">
        <sb-typography kind="muted">Already have an account?</sb-typography>
        <sb-button variant="link" href="#sign-in">Sign in</sb-button>
      </sb-card-footer>
    </sb-card>
  </main>`,
};
