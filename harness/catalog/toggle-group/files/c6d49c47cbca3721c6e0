import { createContext } from '@lit/context';

export interface ToggleGroupContext {
  selection: 'single' | 'multiple';
  variant: 'ghost' | 'tertiary';
  size: 'medium' | 'small' | 'large';
  spacing: number;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  value: string[];
  toggle: (value: string) => void;
}

export const toggleGroupContext = createContext<ToggleGroupContext>(Symbol('sb-toggle-group'));
