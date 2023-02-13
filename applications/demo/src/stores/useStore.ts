import { useContext } from 'react';
import { HStore } from '@urrri/hi-mobx';
import { StoreContext } from './storeProvider';
import type { RootStore } from './rootStore';

const defaultSelector = <TStore extends HStore>(root: RootStore) => root as unknown as TStore;
export const useStore = <TStore extends HStore = RootStore>(
  selector: (root: RootStore) => TStore = defaultSelector
): TStore => selector(useContext(StoreContext));
