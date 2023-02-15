import { action, makeObservable } from 'mobx';
import type { HParentStore, HStore } from '../core/hierarchicalStore';
import {
  findChildStore,
  getParentStore,
  getRootStore,
  initStore,
  isHierarchyInitialized,
} from '../core/hierarchicalStore';
import { Callable } from '../utils/callable';

type ExtractRoot<P> = P extends BaseLeafCallableStore<any, any, any, infer R> ? R : HParentStore;

/**
 * Base class for leaf callable Mobx stores. Should be instantiated by BaseStore classes.
 *
 * Allows direct access to parents, root and any store in the hierarchy.
 *
 * Allows calling store as function. Define/override __call method to handle it.
 *
 * Leaf store cannot have children.
 *
 * See BaseStore documentation for additional info.
 */
export class BaseLeafCallableStore<
    TParent extends HParentStore,
    TParams extends unknown[],
    TReturn = unknown,
    TRoot extends HParentStore = ExtractRoot<TParent>
  >
  extends Callable<TParams, TReturn>
  implements HStore
{
  get $parentStore(): TParent {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getParentStore(this)! as TParent;
  }

  get $rootStore(): TRoot {
    return getRootStore(this) as TRoot;
  }

  constructor(parentStore: TParent, onCall: (...params: TParams) => TReturn) {
    super(onCall);
    if (!parentStore) {
      console.error('Leaf store must have parent');
      throw new Error('Leaf store must have parent');
    }
    initStore(this, parentStore);
  }

  onStoreMakeObservable(): void {
    makeObservable(this, undefined, { autoBind: true });
  }

  onStoreInit?(): void;

  onStoreReset?(): void;

  @action.bound
  resetStore(): void {
    if (!isHierarchyInitialized(this)) {
      console.error('Warning: avoid resetting stores while initialization');
    }
    this.onStoreReset ? this.onStoreReset() : this.onStoreInit?.();
  }

  $getStore<T extends HStore = HStore>(name: string): T {
    return findChildStore(this.$rootStore, name) as T;
  }
}
