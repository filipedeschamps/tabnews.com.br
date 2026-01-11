/**
 * Checks if the given value is an array.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is an array, false otherwise.
 */
export const isArray = (value) => Array.isArray(value);

/**
 * Compares two values for equality.
 * @param {*} value1 - The first value to compare.
 * @param {*} value2 - The second value to compare.
 * @returns {boolean} True if the values are equal, false otherwise.
 */
export const isEqual = Object.is;

/**
 * Checks if the given value is an object.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is an object, false otherwise.
 */
export const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Checks if the given value is undefined.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is undefined, false otherwise.
 */
export const isUndefined = (value) => typeof value === 'undefined';
