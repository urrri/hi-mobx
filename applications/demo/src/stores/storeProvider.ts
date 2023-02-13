import { createContext } from 'react';
import type { RootStore } from './rootStore';

export const StoreContext = createContext<RootStore>({} as RootStore);
export const StoreProvider = StoreContext.Provider;
