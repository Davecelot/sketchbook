import { createContext } from '@lit/context';

export interface TabsState {
  value: string;
  orientation: 'horizontal' | 'vertical';
  activation: 'automatic' | 'manual';
  select: (value: string) => void;
  trigger: (value: string) => HTMLElement | null;
  panel: (value: string) => HTMLElement | null;
}

export const tabsContext = createContext<TabsState>(Symbol('sb-tabs'));
