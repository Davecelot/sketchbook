import { createContext } from '@lit/context';

export type Collapsible = 'offcanvas' | 'none';

export interface SidebarState {
  expanded: boolean;
  narrow: boolean;
  drawerOpen: boolean;
  collapsible: Collapsible;
  activate: (trigger: HTMLElement) => void;
  closeDrawer: () => void;
  setCollapsible: (value: Collapsible) => void;
  sidebar: () => HTMLElement | null;
}

export const sidebarContext = createContext<SidebarState>(Symbol('sb-sidebar'));
