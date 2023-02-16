import { createHRoot, finalizeAsHRoot, HParentStore, HStoreConstructor } from '../core/hierarchicalStore';
import { BaseStore, onInitHierarchy } from './baseStore';

export class BaseRootStore<TRoot extends BaseRootStore<any> = BaseRootStore<any>> extends BaseStore<
  null | undefined,
  TRoot
> {
  // implements HRootStore
  // get $parentStore(): never {
  //   return super.$parentStore as never;
  // }
  // constructor(parent: never) {
  //   super(null as never);
  // }
}

/**
 * creates root store with specified list of child stores and based on specified class;
 * @param list - list of store constructors
 * @param RootStoreClass - constructor of the root store class, default: BaseStore
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createRoot = <
  TList extends Record<keyof TList, HStoreConstructor>,
  TRoot extends HStoreConstructor<HParentStore, undefined> = typeof BaseRootStore
>(
  list: TList,
  RootStoreClass: TRoot = BaseRootStore as TRoot
): ReturnType<typeof createHRoot<TRoot, TList>> => createHRoot(list, RootStoreClass, onInitHierarchy);

// const r = createRoot({}, BaseRootStore);

// class X extends BaseStore<R> {}
//
// class R extends BaseStore<never, R> {
//   x = this.$createStore(X);
// }
//
// const r = new R(null as never);
// r.$parentStore.

export const finalizeAsRoot = <TRoot extends HStoreConstructor<HParentStore, undefined>>(
  RootClass: TRoot
): TRoot & (new () => InstanceType<TRoot>) => finalizeAsHRoot(RootClass, onInitHierarchy);
