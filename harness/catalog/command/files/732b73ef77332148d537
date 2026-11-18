import { createContext } from '@lit/context';

export interface CommandState {
  label: string;
  active: HTMLElement | null;
  list: HTMLElement | null;
  search: (text: string) => void;
  activate: (item: HTMLElement) => void;
}

export const commandContext = createContext<CommandState>(Symbol('sb-command'));
