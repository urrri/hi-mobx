import { createHRoot, HRootStore, HStoreConstructor } from '../core/hierarchicalStore';
import { BaseStore, onInitHierarchy } from './baseStore';

export class BaseRootStore extends BaseStore implements HRootStore {
  get $parentStore(): never {
    return super.$parentStore as never;
  }
}

/**
 * creates root store with specified list of child stores and based on specified class;
 * @param list - list of store constructors
 * @param RootStoreClass - constructor of the root store class, default: BaseStore
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createRoot = <
  TList extends Record<keyof TList, HStoreConstructor>,
  TRoot extends HStoreConstructor<BaseRootStore>
>(
  list: TList,
  RootStoreClass: TRoot = BaseRootStore as TRoot
): ReturnType<typeof createHRoot<TRoot, TList>> => createHRoot(list, RootStoreClass, onInitHierarchy);
