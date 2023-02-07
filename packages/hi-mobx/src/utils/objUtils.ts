export const addReadonlyProp = (
  target: unknown,
  propName: PropertyKey,
  value: unknown,
  attributes: Omit<PropertyDescriptor, 'value'> = {}
): void => {
  Object.defineProperty(target, propName, {
    enumerable: false,
    writable: false,
    configurable: true,
    ...attributes,
    value,
  });
};
