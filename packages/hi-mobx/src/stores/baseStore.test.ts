// @ts-nocheck

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { BaseStore } from './baseStore';
/**
 * leaf store
 */
class A extends BaseStore {}

/**
 * leaf store
 */
class B extends BaseStore {}

/**
 * private leaf store
 */
class P1 extends BaseStore {
  onStoreInit() {}

  onStoreRelationsInit() {}
}

/**
 * private leaf store
 */
class P2 extends BaseStore {
  onStoreInit() {}

  onStoreRelationsInit() {}
}

/**
 * non-BaseStore
 */
class E {}

/**
 * store with auto named children and child with shared name (S)
 */
class C extends BaseStore {
  constructor(parent) {
    super(parent, { children: { A, B, S: A, E }, privateChildren: { priv: B } });
    this.afterConstructor();
  }

  afterConstructor() {}

  onStoreInit() {}

  onStoreRelationsInit() {}
}

/**
 * store with user named children and child with shared name (S)
 */
class D extends BaseStore {
  priv2 = this.$createStore(P1);

  constructor(parent) {
    super(parent, { children: { X: A, Y: B, S: B } });
    this.afterConstructor();
  }

  onStoreInit() {
    this.priv = this.$createStore(A);
  }

  onStoreReset() {} // for mocking

  afterConstructor() {} // for mocking

  onStoreRelationsInit() {} // for mocking
}

/**
 * root store with children hierarchy
 */
class R extends BaseStore {
  constructor() {
    super(null, { children: { C, D, E } });
  }
}

describe('BaseStore', () => {
  /* eslint-disable no-console */
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = () => {};
  });

  afterEach(() => {
    console.warn = originalWarn;
  });
  /* eslint-enable no-console */

  it('has access to root store', () => {
    const root = new R();

    expect(root.$rootStore).toEqual(root);
    expect(root.D.X.$rootStore).toEqual(root);
  });

  it('has direct access to child store', () => {
    const root = new R();

    expect(root.D.X).toBeInstanceOf(A);
    expect(root.C.B).toBeInstanceOf(B);
    expect(root.D.N).toBeUndefined();
    expect(root.D.X).not.toEqual(root.C.A);
  });

  it('has access to parent store', () => {
    const root = new R();

    expect(root.D.X.$parentStore).toBeInstanceOf(D);
    expect(root.D.X.$parentStore.$parentStore).toEqual(root);
  });

  it('allows find any store', () => {
    const root = new R();

    expect(root.$getStore('Y')).toBeInstanceOf(B);
    expect(root.$getStore('A')).toBeInstanceOf(A);
    expect(root.$getStore('E')).toBeInstanceOf(E);
    expect(root.$getStore('N')).toBeUndefined();
    expect(root.C.A.$getStore('Y')).toBeInstanceOf(B);
    expect(root.C.A.$getStore('N')).toBeUndefined();
    expect(() => root.$getStore('S')).toThrowError();
    expect(() => root.$getStore('C.S')).not.toThrowError();
    expect(root.$getStore('D.S')).toBeInstanceOf(B);
  });

  it('allows find child store', () => {
    const root = new R();

    expect(root.$getChildStore('Y')).toBeInstanceOf(B);
    expect(root.$getChildStore('A')).toBeInstanceOf(A);
    expect(root.$getChildStore('E')).toBeInstanceOf(E);
    expect(root.$getChildStore('N')).toBeUndefined();
    expect(root.C.$getChildStore('A')).toBeInstanceOf(A);
    expect(root.C.$getChildStore('X')).toBeUndefined();
    expect(root.C.$getChildStore('N')).toBeUndefined();
    expect(root.C.$getChildStore('S')).toBeInstanceOf(A);
    expect(root.D.$getChildStore('S')).toBeInstanceOf(B);
  });

  it('initializes after construction', () => {
    const afterConstructor = vi.spyOn(C.prototype, 'afterConstructor').mockImplementation(function afterConstructor() {
      expect(this.$getStore('X')).toBeUndefined();
      expect(onStoreInit).not.toBeCalled();
    });
    const onStoreInit = vi.spyOn(C.prototype, 'onStoreInit').mockImplementation(function onStoreInit() {
      expect(this.$getStore('X')).toBeInstanceOf(A);
      expect(afterConstructor).toBeCalled();
      expect(onStoreRelationsInit).not.toBeCalled();
    });

    const onStoreRelationsInit = vi.spyOn(C.prototype, 'onStoreRelationsInit').mockImplementation(() => {
      expect(onStoreInit).toBeCalled();
    });

    expect(afterConstructor).not.toBeCalled();
    expect(onStoreInit).not.toBeCalled();
    expect(onStoreRelationsInit).not.toBeCalled();

    // eslint-disable-next-line no-new
    new R();

    expect(afterConstructor).toBeCalled();
    expect(onStoreInit).toBeCalled();
    expect(onStoreRelationsInit).toBeCalled();

    vi.restoreAllMocks();
  });

  it('initializes dynamically created private stores', () => {
    // p1 - constructed till the end of constructor
    // p2 - constructed while initialization

    const p1Init = vi.spyOn(P1.prototype, 'onStoreInit');
    const p1FinalInit = vi.spyOn(P1.prototype, 'onStoreRelationsInit');
    const p2Init = vi.spyOn(P2.prototype, 'onStoreInit');
    const p2FinalInit = vi.spyOn(P2.prototype, 'onStoreRelationsInit');

    const afterConstructor = vi.spyOn(D.prototype, 'afterConstructor').mockImplementation(function afterConstructor() {
      // p1 - still not initialized
      expect(this.$getChildStore('priv2')).toBeInstanceOf(P1);
      expect(p1Init).not.toBeCalled();

      this.priv3 = this.$createStore(P1);

      expect(this.$getChildStore('priv3')).toBeInstanceOf(P1);
      expect(p1Init).not.toBeCalled();
    });
    const onStoreInit = vi.spyOn(D.prototype, 'onStoreInit').mockImplementation(function onStoreInit() {
      // p1 - still not initialized
      expect(p1Init).not.toBeCalled();

      // p2 - immediately initialized and finalized
      expect(p2Init).not.toBeCalled();

      this.priv4 = this.$createStore(P2);

      expect(this.$getChildStore('priv4')).toBeInstanceOf(P2);
      expect(p2FinalInit).toBeCalledTimes(1);
    });

    const onStoreRelationsInit = vi
      .spyOn(D.prototype, 'onStoreRelationsInit')
      .mockImplementation(function onStoreRelationsInit() {
        // p1 - only initialized, not finalized
        expect(p1Init).toBeCalledTimes(2);
        expect(p1FinalInit).not.toBeCalled();

        // p2 - immediately initialized and finalized
        expect(p2FinalInit).toBeCalledTimes(1);

        this.priv5 = this.$createStore(P2);

        expect(this.$getChildStore('priv5')).toBeInstanceOf(P2);
        expect(p2FinalInit).toBeCalledTimes(2);
      });

    expect(afterConstructor).not.toBeCalled();
    expect(onStoreInit).not.toBeCalled();
    expect(onStoreRelationsInit).not.toBeCalled();

    const root = new R();

    expect(afterConstructor).toBeCalled();
    expect(onStoreInit).toBeCalled();
    expect(onStoreRelationsInit).toBeCalled();

    // p1 - all finalized
    expect(p1Init).toBeCalledTimes(2);
    expect(p1FinalInit).toBeCalledTimes(2);

    // p2 - immediately initialized and finalized
    expect(p2FinalInit).toBeCalledTimes(2);

    const disconnected = root.$getStore('D').$createStore(P2);

    expect(disconnected).toBeInstanceOf(P2);
    expect(p2FinalInit).toBeCalledTimes(3);

    vi.restoreAllMocks();
  });

  it('creates private store', () => {
    const root = new R();

    expect(root.A).toBeInstanceOf(A);
    expect(root.priv).toBeUndefined();
    expect(root.$getStore('priv')).toBeUndefined();
    expect(root.$getStore('D.priv')).toBeInstanceOf(A);
    expect(root.$getStore('C.priv')).toBeInstanceOf(B);
    expect(root.D.$getChildStore('priv')).toBeInstanceOf(A);
  });

  it('resets store without onStoreReset', () => {
    const onStoreInitC = vi.spyOn(C.prototype, 'onStoreInit').mockImplementation(() => {});

    expect(onStoreInitC).not.toBeCalled();

    const root = new R();

    expect(onStoreInitC).toBeCalledTimes(1);

    root.$getStore('C').resetStore();

    expect(onStoreInitC).toBeCalledTimes(2);
  });

  it('resets store with onStoreReset', () => {
    const onStoreInitD = vi.spyOn(D.prototype, 'onStoreInit').mockImplementation(() => {});
    const onStoreResetD = vi.spyOn(D.prototype, 'onStoreReset').mockImplementation(() => {});

    expect(onStoreInitD).not.toBeCalled();
    expect(onStoreResetD).not.toBeCalled();

    const root = new R();

    expect(onStoreInitD).toBeCalledTimes(1);
    expect(onStoreResetD).not.toBeCalled();

    root.$getStore('D').resetStore();

    expect(onStoreInitD).toBeCalledTimes(1);
    expect(onStoreResetD).toBeCalledTimes(1);
  });
});
