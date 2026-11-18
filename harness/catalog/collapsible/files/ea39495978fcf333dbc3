import { createContext } from '@lit/context';

export interface CollapsibleState {
  expanded: boolean;
  disabled: boolean;
  toggle: () => void;
  content: () => HTMLElement | null;
}

export const collapsibleContext = createContext<CollapsibleState>(Symbol('sb-collapsible'));
