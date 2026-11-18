import { createContext } from '@lit/context';

export interface DialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Escape or a backdrop click: fires the cancelable sb-cancel, then closes unless it was prevented. */
  dismiss: () => void;
}

export const dialogContext = createContext<DialogState>(Symbol('sb-dialog'));
