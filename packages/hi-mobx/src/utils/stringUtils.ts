/**
 * type that un-capitalizes string keys of the record type
 */
export type UncapitalizeRecordKeys<T extends Record<keyof T, unknown>> = {
  [P in keyof T as P extends string ? Uncapitalize<P> : P]: T[P];
};

/**
 * un-capitalizes keys of the record
 */
export const uncapitalizeKeys = <T extends Record<keyof T, unknown>>(record: T): UncapitalizeRecordKeys<T> => {
  const res = {};
  Object.keys(record).forEach((key) => key.replace(/^([A-Z])/, (m: string) => m[0]?.toLowerCase() || ''));
  return res as UncapitalizeRecordKeys<T>;
};
