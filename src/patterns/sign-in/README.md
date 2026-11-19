# Sign in

Help people sign in or create an account, with password visibility, single sign-on, and a place to explain errors.

## When to use
The first screen of an app that asks for an email and a password. Use the Sign up story when the same page also creates accounts. Not for multi-step identity checks: chain the onboarding kit after it instead.

## What to replace
- The heading, description and footer text.
- `#reset-password`, `#sign-up` and `#sign-in` with your routes.
- The submit handler (the story only prevents navigation). On failure render the `WithError` alert; while waiting set `loading` on the submit button and `aria-busy` on the form.
- The single sign-on button: remove it, or point it at your provider.

## How to adapt
- Keep the h1 inside the card title and the form's `aria-labelledby` pointing at it.
- Keep the password as a native input inside `sb-field` + `sb-input-group`: the field wires the visible label, the group draws one border around the input and the reveal button.
- Change width and spacing in `sign-in.css` only, with semantic tokens.
