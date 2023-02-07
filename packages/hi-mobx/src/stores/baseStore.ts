import { action } from 'mobx';
import {
  getCustomMeta,
  getParent,
  getRoot,
  initHierarchyFromRoot,
  isHierarchyInitialized,
  setCustomMeta,
} from '../core/hierarchical';
import {
  createStore,
  findChildStore,
  HParentStore,
  HStore,
  HStoreConstructor,
  initHierarchy,
  initStoreWithChildren,
  StoreCreator,
  StoreMeta,
} from '../core/hierarchicalStore';

function reRegisterExistingDuplicatedStore($rootStore: Record<string, HStore>, name: string) {
  // do nothing, if service property getter found (registered on previous duplication)
  if (Object.getOwnPropertyDescriptor($rootStore, name)?.get) return;

  const prevStore = $rootStore[name];
  if (!prevStore) return;

  const prevStoreHName = getCustomMeta<{ hName: string }>(prevStore).hName;
  if (!(prevStoreHName && prevStoreHName !== name)) return;

  // if registered store is not own child of $rootStore - re-register it under fully qualified name

  $rootStore[prevStoreHName] = prevStore; // eslint-disable-line no-param-reassign
  // eslint-disable-next-line no-console
  console.warn(
    `Warning: Store name "${name}" is duplicated. Store is registered under fully qualified name "${prevStoreHName}"`
  );
  // under simple name register service property getter that throws error
  delete $rootStore[name]; // eslint-disable-line no-param-reassign
  Object.defineProperty($rootStore, name, {
    get() {
      throw new Error(`Use fully qualified name to access "${name}" store`);
    },
  });
}

function registerChildrenOnRoot(topStore: HStore, names: string[]): void {
  const { children } = getCustomMeta<StoreMeta>(topStore);
  if (!children) return;
  const $rootStore = topStore.$rootStore as unknown as Record<string, HStore>;

  Object.entries(children).forEach(([name, child]) => {
    const childNames = [...names, name];
    const hName = childNames.join('.');
    setCustomMeta(child, { hName });
    // if current parent is not root
    if (($rootStore as unknown) !== topStore) {
      if (Object.prototype.hasOwnProperty.call($rootStore, name)) {
        // name already registered on rootSore - allow only unique names
        reRegisterExistingDuplicatedStore($rootStore, name);
        // register new child in root ( fully qualified name)
        $rootStore[hName] = child;
        // eslint-disable-next-line no-console
        console.warn(
          `Warning: Store name "${name}" is duplicated. Store is registered under fully qualified name "${hName}"`
        );
      } else {
        // register also in root (as simple name)
        $rootStore[name] = child;
      }
    }
    registerChildrenOnRoot(child, childNames);
  });
}

export const onInitHierarchy = (root: HStore): void => {
  // following functions rerun themselves hierarchically on each child;
  registerChildrenOnRoot(root, []);
  initHierarchy(root);
};

export type BaseStoreOptions = {
  children?: Record<string, StoreCreator>;
  privateChildren?: Record<string, StoreCreator>;
  onBeforeInit?: (store: HParentStore) => void;
};

/**
 * The base class for Mobx stores, allowing you to combine them into a hierarchy
 * and have direct access to parents, children, root and any store in the hierarchy.
 *
 * Initialization sequence:
 *
 * constructor -> (building a hierarchy) -> onStoreInit -> (makeObservable) -> onStoreRelationsInit
 *
 * Each lifecycle event/action is called for all hierarchy, then applied next one in sequence
 *
 * If private child store is created till the end of constructor, it will be initialized as part of main hierarchy.
 * Otherwise, it will be initialized immediately on creation ($createStore will return initialized store)
 *
 * Use onStoreRelationsInit to set reactions and other relations between stores
 *
 * Resetting store:
 *
 * Use store.resetStore() for that.
 *
 * Avoid resetting other stores from initialization events, use onStoreReset for that.
 *
 * If store overrides onStoreReset handler, it will be called for resetting store instead of onStoreInit.
 *
 * If defined both onStoreInit and onStoreReset, then first one will be called during initialization and second one during resetting;
 * To prevent code duplication you can remove onStoreReset or call onStoreInit manually from it
 */
export class BaseStore implements HParentStore {
  get $parentStore(): HParentStore {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getParent(this)!;
  }

  get $rootStore(): HParentStore {
    return getRoot(this);
  }

  constructor(parentStore: HParentStore, { children, privateChildren, onBeforeInit }: BaseStoreOptions = {}) {
    initStoreWithChildren(this, parentStore, children, privateChildren);

    onBeforeInit?.(this);

    initHierarchyFromRoot(this, onInitHierarchy);
  }

  $createStore<TStore extends HStore, TParams extends Array<unknown>>(
    StoreClass: HStoreConstructor<TStore, TParams>,
    ...params: TParams
  ): TStore {
    return createStore(this, StoreClass, ...params);
  }

  onStoreInit?(): void;

  onStoreReset?(): void;

  @action.bound
  resetStore(): void {
    if (!isHierarchyInitialized(this)) {
      console.error('Warning: avoid resetting stores while initialization');
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // -@ts-ignore
    this.onStoreReset ? this.onStoreReset() : this.onStoreInit?.();
  }

  $getStore<T extends HStore = HStore>(name: string): T {
    return findChildStore(this.$rootStore, name) as T;
  }

  $getChildStore<T extends HStore = HStore>(name: string): T {
    return findChildStore(this, name) as T;
  }
}