import { createContext } from '@lit/context';

export interface AccordionState {
  selection: 'single' | 'multiple';
  collapsible: boolean;
  disabled: boolean;
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

export interface AccordionItemState {
  value: string;
  open: boolean;
  disabled: boolean;
  /** An open item of a single, non-collapsible accordion cannot be closed. */
  locked: boolean;
  trigger: () => HTMLElement | null;
  content: () => HTMLElement | null;
}

export const accordionContext = createContext<AccordionState>(Symbol('sb-accordion'));
export const accordionItemContext = createContext<AccordionItemState>(Symbol('sb-accordion-item'));
