import { action } from 'mobx';
import type { HParentStore, HStore } from '../core/hierarchicalStore';
import { findChildStore } from '../core/hierarchicalStore';
import { getParent, getRoot, initNode, isHierarchyInitialized } from '../core/hierarchical';
import { Callable } from '../utils/callable';

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
export class BaseLeafCallableStore<TParams extends unknown[], TReturn = unknown>
  extends Callable<TParams, TReturn>
  implements HStore
{
  get $parentStore(): HParentStore {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getParent(this)!;
  }

  get $rootStore(): HParentStore {
    return getRoot(this);
  }

  constructor(parentStore: HParentStore, onCall: (...params: TParams) => TReturn) {
    super(onCall);
    if (!parentStore) {
      console.error('Leaf store must have parent');
      throw new Error('Leaf store must have parent');
    }
    initNode(this, parentStore);
  }

  @action.bound
  resetStore(): void {
    if (!isHierarchyInitialized(this)) {
      console.error('Warning: avoid resetting stores while initialization');
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.onStoreReset ? this.onStoreReset() : this.onStoreInit?.();
  }

  $getStore<T extends HStore = HStore>(name: string): T {
    return findChildStore(this.$rootStore, name) as T;
  }
}
