import { computed, observable, runInAction } from 'mobx';
import { addReadonlyProp } from '../utils/objUtils';
import { BaseStore } from './baseStore';
import { DataVersion } from '../utils/dataVersion';
import { $createAsyncAction, AsyncActionCallback, AsyncActionOptions, AsyncActionStore } from './asyncActionStore';
import { HParentStore } from '../core/hierarchicalStore';
import { Awaitable } from '../utils/types';

const dataFieldMeta = Symbol('store-data-field-meta');

type ValueOrGetter<T = unknown> = (() => T) | T;

interface DataFieldMeta {
  name: string;
  defaultValue: ValueOrGetter;
}

interface IDataInitReset extends Object {
  onDataInit?(): void;

  onDataReset?(): void;
}

/**
 * Base class for default data processing: loading and storing data, processing of loading states and errors.
 *
 * Allows creating additional actions for extended data processing, based on {@link AsyncActionStore}
 *
 * Resetting data:
 *
 * When you inherit this class you need to add custom data field and decorate it with autoData decorator,
 * This decorator allows defining default value, which will be auto applied to custom data field on init/reset
 *
 * If you want to init and reset data field(s) in custom way - override onDataInit;
 *
 * If you want to separate resetting data from initialization - override onDataReset;
 *
 * Note: NEVER override onStoreInit or onStoreReset, because it can break coherence of the data
 *
 */
export abstract class BaseDataStore<
    TParent extends HParentStore,
    TData = unknown,
    TLoadParams extends unknown[] = unknown[]
  >
  extends BaseStore<TParent>
  implements IDataInitReset
{
  [dataFieldMeta]?: DataFieldMeta;

  /**
   * true, if data store contains new or old data (also while loading is in progress)
   */
  @observable hasData = false;

  /**
   * true, if loading request is in progress (note, store can contain old data during loading)
   */
  @observable isLoading = false;

  /**
   * true, if loading (or data post-processing) is failed
   */
  @observable isLoadingFailed = false;

  /**
   * true, if store contains data and loading process finished
   */
  @computed get isLoaded(): boolean {
    return this.hasData && !this.isLoading;
  }

  // data version processing for AsyncActionStore
  #dataVersion = new DataVersion();

  // load version processing for multi-load race prevention
  #loadVersion = new DataVersion();

  /**
   * Decorator for creating custom automatic data field
   * @param defaultValueOrGetter
   * @example
   * ```js
   *   @BaseDataStore.autoData(()=>[])
   *   @observable.shallow
   *   myDataArray;
   * ```
   */
  static autoData =
    (defaultValueOrGetter?: (() => unknown) | unknown) =>
    (obj: unknown, name = 'data', params?: unknown) => {
      const target = obj as Record<string | symbol, unknown>;
      if (!target[dataFieldMeta]) {
        addReadonlyProp(target, dataFieldMeta, { name, defaultValue: defaultValueOrGetter });
        if (!params) {
          // for manual call - define auto data field and manually decorate it to observable
          target[name] = undefined;
          observable.ref(target, name);
        }
      }
    };

  #reset = () => {
    this.#dataVersion.next();
    this.hasData = false;
    this.isLoading = false;
    this.isLoadingFailed = false;
    const dataMeta = this[dataFieldMeta];
    if (dataMeta) {
      const { name, defaultValue: value } = dataMeta;
      (this as Record<string, unknown>)[name] = typeof value === 'function' ? value() : value;
    }
  };

  /**
   * Override to init and reset store data to initial state.
   * This is used for first store data initialization and for resetting store data by calling
   * resetStore. If defined onDataReset, then this function will not be called for resetting.
   *
   * > NOTE: DO NOT override onStoreInit, override this instead.
   *
   */
  onDataInit?(): void;

  /**
   * Override for resetting store data.
   * Adding this function will replace calling of onDataInit for resetting data
   */
  onDataReset?(): void;

  /**
   * Do not override for DataStore, override {@link onDataReset} instead
   */
  onStoreReset?(): void;

  /**
   * Do not override for DataStore, override {@link onDataInit} instead
   */
  onStoreInit(): void {
    this.#reset();
    this.onDataInit?.();

    // prepare for resetting data if defined handler for that
    if (!this.onStoreReset && this.onDataReset) {
      this.onStoreReset = () => {
        this.#reset();
        this.onDataReset?.();
      };
    }
  }

  /**
   * Call this function to start data (re)loading;
   *
   * Don't override it unnecessarily, override handlers instead;
   *
   * @param params - params, that will be passed to onLoad, onSuccess, and onError handlers
   */
  async load(...params: TLoadParams): Promise<void> {
    if (!this.onLoad) {
      console.error('DataStore: Override onLoad to load data');
      throw new Error('DataStore: Override onLoad to load data');
    }
    this.#loadVersion.next();
    const isCurrentLoad = this.#loadVersion.pin();
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const data: TData = await this.onLoad(...params);
      isCurrentLoad() &&
        runInAction(() => {
          this.#dataVersion.next();
          this.hasData = true;
          this.onSuccess ? this.onSuccess(data, ...params) : this.#onSuccessDefault(data);
          this.isLoading = false;
          this.isLoadingFailed = false;
        });
    } catch (error) {
      isCurrentLoad() &&
        runInAction(() => {
          this.#dataVersion.next();
          this.hasData = false;
          this.onError?.(error, ...params);
          this.isLoading = false;
          this.isLoadingFailed = true;
        });
      throw error;
    }
  }

  /**
   * Allows creating additional actions for extended data processing, based on {@link AsyncActionStore}
   * @param onAction - async handler for action processing
   * @param options
   * @param options.onBefore - sync handler for action pre-processing; returned value will be passed to onSuccess/onError as second argument;
   * @param options.onSuccess - sync handler for action post-processing (e.g. storing results); receives results from onAction;
   * @param options.onError - sync handler for action error handling
   * @returns instance of callable store, which can be called as function and also can be accessed as store to reach action processing and error states
   */
  $createAsyncAction<
    TParams extends unknown[] = [],
    TResult = unknown,
    TPreRes = unknown,
    TError = unknown,
    TStoreParent extends BaseDataStore<TParent, TData, TLoadParams> = BaseDataStore<TParent, TData, TLoadParams>
  >(
    this: TStoreParent,
    onAction: AsyncActionCallback<TParams, TResult>,
    options: Omit<AsyncActionOptions<TParams, TResult, TPreRes, TError>, 'pinVersion'> = {}
  ): AsyncActionStore<TStoreParent, TParams, TResult, TPreRes, TError> {
    return $createAsyncAction(this, onAction, {
      ...options,
      pinVersion: this.#dataVersion.pin,
    });
  }

  /**
   * Override to process data loading (can be async).
   * Returns data (or Promise, resolving to data), that should be stored.
   * Expected to be asynchronous.
   * @param params - parameters received by "load"
   * @returns returns loaded data or promise resolving to loaded data
   */
  abstract onLoad(...params: TLoadParams): Awaitable<TData>;

  /**
   * Override to store loaded (by onLoad) data, only if you need extended data storage process;
   *
   * To easily assign loaded data to a custom data property, define custom property using {@link autoData};
   *
   * If onSuccess is not overridden and custom data property is not defined, loaded data will be stored to the default "data" property;
   *
   * Expected to change observables synchronously;
   *
   * @param data - any data, received from onLoad handler
   * @param params - parameters received by "load"
   * @returns should be synchronous, returned data ignored
   */
  onSuccess?(data: TData, ...params: TLoadParams): void;
  #onSuccessDefault(data: TData) {
    const name = this[dataFieldMeta]?.name;
    if (!name) {
      console.error(`Auto data field is not defined.
  This can happen if custom data field is not decorated with @autoData.
  If this was intended (for custom data processing), override onSuccess to store custom data.`);
      throw new Error(`Data field is not defined`);
    }
    (this as Record<string, unknown>)[name] = data;
  }

  /**
   * Override to handle error, thrown by onLoad handler
   * Expected to change store synchronously;
   * @param error - error, caught from onLoad
   * @param params - parameters received by "load"
   * @returns should be synchronous, returned data ignored
   */
  onError?(error: Error, ...params: TLoadParams): void;
}

export const $createDataStore = <
  TData = unknown,
  TField extends string = 'data',
  TLoadParams extends unknown[] = unknown[],
  TMembers extends Record<string, unknown> = Record<never, never>,
  TParent extends HParentStore = HParentStore
>(
  parentStore: TParent,
  onLoad: (...params: TLoadParams) => Awaitable<TData>,
  {
    name = 'data' as TField,
    defaultValue,
    members,
  }: { name?: TField; defaultValue?: ValueOrGetter<TData>; members?: TMembers } = {}
): BaseDataStore<TParent, TData, TLoadParams> & TMembers & { [p in TField]: TData } =>
  parentStore.$createStore(
    // @ts-ignore
    class extends BaseDataStore<TParent, TData, TLoadParams> {
      onLoad = onLoad;
    },
    {
      onBeforeInit: (dataStore) => {
        Object.assign(dataStore, members);
        BaseDataStore.autoData(defaultValue)(dataStore, name);
      },
    }
  ) as BaseDataStore<TParent, TData, TLoadParams> & TMembers & { [p in TField]: TData };

// class X extends BaseStore<B> {
//   x = 1;
// }
// class Y extends BaseStore<X> {
//   y = 1;
// }
//
// class B extends BaseDataStore<R, string> {
//   // eslint-disable-next-line class-methods-use-this
//   onLoad(): Promise<string> | string {
//     this.y = this.x.$createStore(Y);
//     return 'undefined';
//   }
//
//   y?: Y;
//
//   x = this.$createStore(X);
// }
// class R extends BaseStore<undefined, R> {
//   b = this.$createStore(B);
//
//   // eslint-disable-next-line unicorn/consistent-function-scoping
//   c = $createDataStore(this, () => 'ttt');
// }
//
// const r = new R(undefined);
// const r1 = r.b.y?.$rootStore;
// const r2 = r.c.$parentStore;
// const r3 = r.b.x.$parentStore;
// r.$parentStore
