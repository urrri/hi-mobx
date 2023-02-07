/**
 * Using this class as super class allows calling instance as function.
 *
 * Define __call on the subclass to handle the call.
 *
 * __call will receive arguments from the call and the instance as this, returned values will be returned from the call
 */
export class Callable<TParams extends unknown[], TReturn = unknown> extends Function {
  __call: (...params: TParams) => TReturn;

  constructor(onCall: (...params: TParams) => TReturn) {
    // We create a new Function object using `super`, with a `this` reference
    // to itself (the Function object) provided by `arguments.callee`.
    // Pro: a simple way for the dynamic fn to reference itself.
    // Con: callee and caller of arguments are deprecated in strict mode,
    // their use have performance concerns, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments/callee

    super('return arguments.callee.__call.apply(arguments.callee, arguments)');
    // We can't use the rest operator because of the strict mode rules.
    // But we can use the rest operator instead of apply:
    // super('return arguments.callee.__call(...arguments)')

    if (!onCall) throw new Error('onCallHandler should be specified');
    // eslint-disable-next-line no-underscore-dangle
    this.__call = onCall;
  }
}
