// Vite's import.meta.glob, as the Foundations pages (eager, one export) and .storybook/preview.ts (lazy) use it.
// The full vite/client types are not loaded so the library typecheck stays free of bundler globals.
interface ImportMeta {
  glob<T = unknown>(pattern: string | string[], options: { eager: true; import?: string }): Record<string, T>;
  glob<T = unknown>(pattern: string | string[]): Record<string, () => Promise<T>>;
}
