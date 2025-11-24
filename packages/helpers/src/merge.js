import { isEqual, isObject, isUndefined } from './is';

/**
 * Deeply merges two objects.
 * @param {*} target - The target object to merge into.
 * @param {*} source - The source object to merge from.
 * @returns {*} - The merged object.
 */
export function deepMerge(target, source) {
  if (isUndefined(source)) {
    return target;
  }

  if (!isObject(source) || !isObject(target) || isEqual(target, source)) {
    return source;
  }

  const output = { ...target };

  Object.keys(source).forEach((key) => {
    output[key] = deepMerge(target[key], source[key]);
  });

  return output;
}
