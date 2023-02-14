import type { KeyboardEvent } from 'react';

export const onEnterPress = (cb: any) => (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    cb();
  }
};
