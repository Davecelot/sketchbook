import { createContext } from '@lit/context';

export type AvatarImageStatus = 'idle' | 'loaded' | 'error';

export interface AvatarState {
  status: AvatarImageStatus;
  report: (status: AvatarImageStatus) => void;
}

export const avatarContext = createContext<AvatarState>(Symbol('sb-avatar'));
