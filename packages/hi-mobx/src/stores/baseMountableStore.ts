import type { EffectCallback } from 'react';
import { observable, runInAction } from 'mobx';
import { BaseStore } from './baseStore';
import { HParentStore } from '../core/hierarchicalStore';

export class BaseMountableStore<TMountableParams extends unknown[] = []> extends BaseStore<HParentStore> /* todo */ {
  /**
   * Related component is mounted, but have not finished state initialization
   */
  @observable isMounted = false;

  /**
   * Related component is mounted, and ready (state initialized)
   */
  @observable isReady = false;

  /**
   * Use this to allow actions on mount/unmount of related component,
   *
   * @param params - params for {@link onMount}
   * @returns useEffect Destructor
   *
   * @example
   *  function MyComponent({ MyMountableStore:{ mountEffect } }){
   *
   *    React.useEffect(mountEffect, [mountEffect]);
   *    // or
   *    React.useEffect(() => mountEffect(params), [mountEffect]);
   *  }
   */
  /**
   *
   * @param params - params for {@link onMount}
   */
  mountEffect = (...params: TMountableParams): ReturnType<EffectCallback> => {
    (async () => {
      runInAction(() => {
        this.isMounted = true;
      });
      await this.onMount?.(...params);
      runInAction(() => {
        this.isReady = true;
      });
    })();
    return () => {
      runInAction(() => {
        this.isReady = false;
        this.isMounted = false;
        this.onLeave?.();
      });
    };
  };

  /**
   * Called, when related component is mounted.
   *
   * Override to handle any sync/async state initializations.
   */
  onMount?(...params: TMountableParams): unknown | Promise<unknown>;

  /**
   * Called, when related component is unmounted.
   *
   * Override to clean up state.
   */
  onLeave?(): void;
}
