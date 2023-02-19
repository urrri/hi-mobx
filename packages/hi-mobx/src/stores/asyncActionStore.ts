import { observable, runInAction } from 'mobx';
import type { HParentStore } from '../core/hierarchicalStore';
import { BaseLeafCallableStore } from './baseLeafCallableStore';
import { PinVersion } from '../utils/dataVersion';
import { HStoreOptions } from '../core/hierarchicalStore';

export type AsyncActionOptions<TParams extends unknown[], TResult = unknown, TPreRes = unknown, TError = unknown> = {
  /**
   * sync handler for action pre-processing; returned value will be passed to onSuccess/onError as second argument;
   * @param params
   */
  onBefore?: (...params: TParams) => TPreRes;
  /**
   * sync handler for action pre-processing; returned value will be passed to onSuccess/onError as second argument;
   * @param data
   * @param fromBefore
   * @param params
   */
  onSuccess?: (data: TResult, fromBefore: TPreRes | undefined, ...params: TParams) => void;
  /**
   * sync handler for action error handling
   * @param error
   * @param fromBefore
   * @param params
   */
  onError?: (error: TError, fromBefore: TPreRes | undefined, ...params: TParams) => void;
  /**
   * function that returns isCurrent function see {@link DataVersion}
   */
  pinVersion?: PinVersion;
};

export type AsyncActionCallback<TParams extends unknown[], TResult> = (...params: TParams) => TResult;

/**
 * Creates action store, which can be called directly as function and can also be accessed as store for action state
 *
 * Do not use directly, use {@link $createAsyncAction} instead
 */
export class AsyncActionStore<
  TParent extends HParentStore,
  TParams extends unknown[] = [],
  TResult = unknown,
  TPreRes = unknown,
  TError = unknown
> extends BaseLeafCallableStore<TParent, TParams, Promise<void>> {
  @observable isInProgress = false;

  @observable isFailed = false;

  constructor(
    options: HStoreOptions<TParent>,
    onAction: AsyncActionCallback<TParams, TResult>,
    { onBefore, onSuccess, onError, pinVersion }: AsyncActionOptions<TParams, TResult, TPreRes, TError> = {}
  ) {
    super(options, async (...params: TParams): Promise<void> => {
      if (this.isInProgress) {
        throw new Error('Action is in progress');
      }
      const isCurrent = pinVersion ? pinVersion() : () => true;
      let preRes: TPreRes | undefined;
      runInAction(() => {
        this.isInProgress = true;
        preRes = onBefore?.(...params);
      });
      try {
        const data = await onAction(...params);
        runInAction(() => {
          isCurrent() && onSuccess?.(data, preRes, ...params);
          this.isInProgress = false;
          this.isFailed = false;
        });
      } catch (error) {
        runInAction(() => {
          isCurrent() && onError?.(error, preRes, ...params);
          this.isInProgress = false;
          this.isFailed = true;
        });
        throw error;
      }
    });
  }
}

/**
 * Allows creating actions, based on {@link AsyncActionStore}
 * @param parentStore - parent store, where action store will be added
 * @param onAction - async handler for action processing
 * @param options
 * @param options.onBefore - sync handler for action pre-processing; returned value will be passed to onSuccess/onError as second argument;
 * @param options.onSuccess - sync handler for action post-processing (e.g. storing results); receives results from onAction;
 * @param options.onError - sync handler for action error handling
 * @param options.pinVersion - function that returns isCurrent function see {@link DataVersion}
 * @returns instance of callable store, which can be called as function and also can be accessed as store to reach action processing and error states
 */
export const $createAsyncAction = <
  TParams extends unknown[] = [],
  TResult = unknown,
  TPreRes = unknown,
  TError = unknown,
  TParent extends HParentStore = HParentStore
>(
  parentStore: TParent,
  onAction: AsyncActionCallback<TParams, TResult>,
  options: AsyncActionOptions<TParams, TResult, TPreRes, TError> = {}
): AsyncActionStore<TParent, TParams, TResult, TPreRes, TError> =>
  // @ts-ignore
  parentStore.$createStore(AsyncActionStore, onAction, options);
