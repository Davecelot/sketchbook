import { nothing } from 'lit';

// Script-capable schemes run code in the page when the link is followed (SB-0115). Browsers drop tabs, newlines and
// leading control characters before they read the scheme ("java\tscript:" still runs), so those go before the test.
const SCRIPT_SCHEME = /^(?:javascript|vbscript|data):/i;
// eslint-disable-next-line no-control-regex -- the C0 range is the point: browsers ignore it inside a scheme
const IGNORED = /[\u0000- ]/g;

export function safeHref(href: string | null | undefined): string | typeof nothing {
  if (href == null) return nothing;
  if (!SCRIPT_SCHEME.test(href.replace(IGNORED, ''))) return href;
  console.warn(
    `Blocked href "${href.slice(0, 40)}": javascript:, vbscript: and data: URLs are not rendered (SB-0115).`,
  );
  return nothing;
}
