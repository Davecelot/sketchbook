export type LitHost = HTMLElement & { requestUpdate(): void; updateComplete: Promise<unknown> };
