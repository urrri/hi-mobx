/**
 * no constraint constructor
 */
export type AbstractConstructor<T = unknown> = abstract new (...params: never[]) => T;

/**
 * Takes record of named constructors and converts them to named instances
 */
export type InstantiateClasses<TList extends Record<keyof TList, AbstractConstructor>> = {
  [P in keyof TList]: InstanceType<TList[P]>;
};
