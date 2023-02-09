import { get } from 'lodash';
import { makeObservable } from 'mobx';
import {
  forEachNode,
  getCustomMeta,
  getParent,
  HNode,
  initHierarchyFromRoot,
  initNode,
  isHierarchyCreated,
  markHierarchyCreated,
  setCustomMeta,
  isHierarchyInitialized as isNodeHierarchyInitialized,
  getRoot,
} from './hierarchical';
import { uncapitalizeKeys, UncapitalizeRecordKeys } from '../utils/stringUtils';
import { InstantiateClasses } from '../utils/types';

interface IInitReset extends Object {
  /**
   * Override to init and reset store values to initial state.
   * This is used for first store initialization and for resetting store values by calling
   * resetStore. If defined onStoreReset, then this function will not be called for resetting.
   *
   * > NOTE: Dynamically created private children can still be not available.
   *
   * > NOTE: Do not use it for setting reactions or other relations (use onStoreRelationsInit)
   *
   * > NOTE: When called for first init, stores can still be not observable and will not react
   * to any changes
   */
  onStoreInit?(): void;

  /**
   * Override for resetting store values.
   * Adding this function will replace calling of onStoreInit for resetting data
   *
   * > NOTE: use this function to reset child stores (do not use onStoreInit for that)
   */
  onStoreReset?(): void;

  /**
   * Override to init store relations (reactions, passing callbacks, etc..).
   *
   * At the time all hierarchy is ready, stores are made observable and have initial data
   * (except dynamically created private children, which are initialized independently at the time of the creation)
   */
  onStoreRelationsInit?(): void;

  /**
   * Resets store by calling onStoreInit.
   *
   * Add onStoreReset to store if you need different initializations than on store creation.
   * Otherwise, override onStoreInit
   */
  resetStore(): void;
}

export interface HStore extends HNode<HParentStore>, IInitReset {
  readonly $parentStore: HParentStore;
  readonly $rootStore: HParentStore;

  /**
   * Searches for a store by name or by fully qualified name ("parents.children") among all stores in the hierarchy, starting with rootStore.
   * If store name is duplicated and so registered under hierarchical name, then searching by own name will throw error.
   * @param name - name of store to search for
   * @returns returns first found store if one
   * @throws Error when searching by duplicated name. Use fully qualified name for this search
   * @example
   *   this.getStore('MyStore')
   *    or
   *   this.getStore('MyGrandPaStore.MyParentStore.MyStore')
   */
  $getStore<T extends HStore = HStore>(name: string): T;
}

export interface HParentStore extends HStore {
  /**
   * Creates private store or private store hierarchy.
   *
   * Created store and its children will NOT be registered on the rootStore, but they receive parent/root stores.
   *
   * It will not be assigned to the parent store, but it can be done by the function caller.
   * In this case it can be found by fully qualified or relative hierarchical name.
   *
   * If the function is called when outer hierarchy is ready, then immediate initHierarchy will be called starting from the store.
   * Otherwise, created store will be initialized as part of outer hierarchy starting from root store
   *
   * @param StoreClass - class of the store to create
   * @param params - extra parameters for the class constructor
   * (excluding first parentStore parameter)
   */
  $createStore<TStore extends HStore, TParams extends unknown[]>(
    StoreClass: HStoreConstructor<TStore, TParams>,
    ...params: TParams
  ): TStore;

  /**
   * Searches for a store by name or by relative hierarchical name ("child.subChildren") among all stores in the hierarchy, starting with current store.
   * If duplicated names found, then first found will be returned.
   * Using on rootStore can throw Error with duplicated names (see {@link $getStore})
   * @param {string} name - name of store to search for
   * @returns {BaseStore} returns first found store if one
   * @example
   *  this.$getChildStore('MyStore')
   *  or
   *  myGrandPaStore.$getChildStore('MyParentStore.MyStore')   */
  $getChildStore<T extends HStore = HStore>(name: string): T;
}

export interface HRootStore extends HParentStore {
  readonly $parentStore: never;
}

export interface StoreMeta {
  children?: Record<string, HStore>;
  privateChildren?: Record<string, HStore>;
  namelessUninitialized?: HStore[];
  dynamicBranch?: boolean;
}

/**
 * hierarchical store constructor type. allows passing store class as newable objects
 */
export interface HStoreConstructor<TStore extends HStore = HStore, TParams extends unknown[] = never[]> {
  new (parent: HParentStore, ...params: TParams): TStore;
}

// export type HStoreConstructor<T extends HStore = HStore, P extends unknown[] = []> = new (
//   parent: HParentStore,
//   ...params: P
// ) => T;

type StoreFactory = (parent: HParentStore) => HStore;

export type StoreCreator = HStoreConstructor | StoreFactory;

type CustomMeta = Record<never, never>;

export const getStoreMeta = <TMeta extends CustomMeta>(store: HStore | undefined): StoreMeta & TMeta =>
  getCustomMeta<StoreMeta & TMeta>(store) || ({} as StoreMeta & TMeta);

export const setStoreMeta = <TMeta extends CustomMeta>(
  store: HStore,
  values: Partial<TMeta> & Partial<StoreMeta>
): void => setCustomMeta(store, values);

export const isHierarchyInitialized = (store: HStore): boolean | undefined => isNodeHierarchyInitialized(store);

export const getParentStore = (store: HStore): HParentStore | undefined => getParent(store);

export const getRootStore = (store: HStore): HParentStore => getRoot(store);

export function createChildren(
  parentStore: HParentStore,
  children: Record<string, StoreCreator> | undefined
): Record<string, HStore> | undefined {
  if (!children) return;
  const stores: Record<string, HStore> = {};
  Object.entries(children).forEach(([name, creator]) => {
    if (Object.prototype.hasOwnProperty.call(parentStore, name)) {
      console.error(
        `Store "${name}" cannot be assigned to parent, because this name is already in use. Verify for duplications.`
      );
      return;
    }
    let store: HStore;
    try {
      const StoreClass = creator as HStoreConstructor;
      store = new StoreClass(parentStore);
    } catch {
      store = (creator as StoreFactory)(parentStore);
    }
    if (store) {
      const storeRecord = parentStore as unknown as Record<string, HStore>;
      storeRecord[name] = store;
      stores[name] = store;
    } else {
      console.error(`Store "${name}" cannot be created`);
    }
  });
  return stores;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerNamelessStores = (store: HStore): void => {
  const meta = getStoreMeta(store);
  const { children = {}, namelessUninitialized } = meta;
  if (!namelessUninitialized?.length) return;
  let added = false;
  Object.entries(store).forEach(([key, member]) => {
    // check if already registered
    if (children[key]) return;
    // find and register
    if (member && namelessUninitialized.includes(member)) {
      children[key] = member;
      added = true;
    }
  });
  if (added) {
    meta.children = children; // for case, when children was undefined
  }
};

/**
 * runs action for each store hierarchically, starting specified one.
 *
 * @function
 * @param action - function to call
 *
 * @param topNode - top store in hierarchy
 *
 * @param childrenFirst - run action from children to parent; default - false
 */
export const forEachStore = forEachNode<HStore, StoreMeta>((storeMeta: StoreMeta) => {
  const { children, privateChildren, namelessUninitialized } = storeMeta;
  return [...Object.values(children || {}), ...Object.values(privateChildren || {}), ...(namelessUninitialized || [])];
});

/**
 * This function initializes stores hierarchically.
 * It should be called for the root store by {@link initHierarchyFromRoot} (when all stores are
 * created)
 * or for the top dynamically created story, when all sub-stories are created.
 *
 * Note: Child stores are initializing after parents (except created out of construction time).
 * @param topStore - store to start initialization from
 * @see createHRoot
 * @see initHierarchyFromRoot
 */
export function initHierarchy(topStore: HStore): void {
  // pre-init store props
  forEachStore((store: IInitReset) => {
    store.onStoreInit?.();
  }, topStore);

  // make store observable
  forEachStore((store) => {
    try {
      makeObservable(store, undefined, { autoBind: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('makeObservable failed on', store.constructor.name, ':\n', error.message);
    }
  }, topStore);

  // init store relations
  forEachStore((store: IInitReset) => store.onStoreRelationsInit?.(), topStore);

  // find all directly assigned child stores and register under member names
  forEachStore(registerNamelessStores, topStore);

  // cleanup saved nameless stores
  forEachStore((store) => delete getStoreMeta(store).namelessUninitialized, topStore, true);
}

/**
 * Creates static or dynamic hierarchical store and initialize it if necessary.
 *
 * Dynamic stores are stores, created out of construction time of their parent stores or as part
 * of creation other dynamic store (in dynamic branch)
 * @param currentStore - parent store of the creating one
 * @param StoreClass - store constructor
 * @param params - store constructor parameters
 */
export function createStore<TStore extends HStore, TParams extends unknown[]>(
  currentStore: HParentStore,
  StoreClass: HStoreConstructor<TStore, TParams>,
  ...params: TParams
): TStore {
  // if main hierarchy created,
  // mark that we are building dynamic branch to allow initialization branch from top
  type DynamicProgress = { dynamicHierarchyInProgress?: boolean };
  const $ = getStoreMeta<DynamicProgress>(currentStore);
  const hierarchyCreated = isHierarchyCreated(currentStore);
  if (hierarchyCreated) {
    $.dynamicHierarchyInProgress = true;
  }

  try {
    const store = new StoreClass(currentStore, ...params);

    if (hierarchyCreated) {
      // if main hierarchy is ready,

      // mark created store as created in dynamic hierarchy to prevent making global references
      setStoreMeta(store, { dynamicBranch: true });

      // remove progress flag
      $.dynamicHierarchyInProgress = false;

      // init from created story if it is on top of dynamic branch
      const $parentMeta = getStoreMeta<DynamicProgress>(getParentStore(currentStore));
      if (!$parentMeta.dynamicHierarchyInProgress) {
        initHierarchy(store);
      }
    } else {
      // otherwise just add to hierarchy to init in main cycle
      ($.namelessUninitialized ||= []).push(store);
    }
    return store;
  } finally {
    // finally remove the flag as it should be used only in scope of this function
    delete $.dynamicHierarchyInProgress;
  }
}

export const initStore = (store: HStore, parentStore: HParentStore): void => initNode(store, parentStore);

export function initStoreWithChildren(
  store: HParentStore,
  parentStore: HParentStore,
  children?: Record<string, StoreCreator>,
  privateChildren?: Record<string, StoreCreator>
): void {
  initNode(store, parentStore, (storeMeta: StoreMeta) => {
    storeMeta.children = createChildren(store, children); // eslint-disable-line no-param-reassign
    storeMeta.privateChildren = createChildren(store, privateChildren); // eslint-disable-line no-param-reassign
  });
  markHierarchyCreated(store); // todo: remove
}

/**
 * searches for a store by (non-hierarchical) name among all stores in the hierarchy, starting with current store.
 * @param topStore - store to start searching on
 * @param name - name of store to search for
 * @returns returns first store found, if any
 */
export function findChildStore(topStore: HParentStore, name: string): HStore | undefined {
  const store = get(topStore, name);
  if (store) return store;

  const find = (parent: HStore): HStore | undefined => {
    const { children } = getStoreMeta(parent);
    if (!children) return;

    if (children[name]) return children[name];

    // eslint-disable-next-line no-restricted-syntax
    for (const child of Object.values(children)) {
      const childStore = find(child);
      if (childStore) return childStore;
    }
  };
  return find(topStore);
}

/**
 * creates root store with specified list of child stores and based on specified class;
 * @param list - list of store constructors
 * @param RootStoreClass - constructor of the root store class
 * @param onInitHierarchy - custom hierarchy initialization, defaults to {@link initHierarchy}
 */
export const createHRoot = <
  TRoot extends HStoreConstructor<HRootStore>,
  TList extends Record<keyof TList, HStoreConstructor>
>(
  list: TList,
  RootStoreClass: TRoot,
  onInitHierarchy: (root: HStore) => void = initHierarchy
): InstanceType<TRoot> & UncapitalizeRecordKeys<InstantiateClasses<TList>> => {
  const root = new RootStoreClass(null as never);
  setStoreMeta(root, { children: createChildren(root, uncapitalizeKeys(list)) });

  markHierarchyCreated(root);

  initHierarchyFromRoot(root, onInitHierarchy);

  return root as never;
};
