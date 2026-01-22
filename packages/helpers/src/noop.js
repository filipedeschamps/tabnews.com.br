/**
 * Returns the input value as is.
 * @param {*} value - The value to return.
 * @returns {*} The same value that was passed in.
 */
export function identity(value) {
  return value;
}

/**
 * A no-operation function that does nothing.
 * @returns {void}
 */
export function noop() {}

/**
 * Returns null.
 * @returns {null} Always returns null.
 */
export function returnNull() {
  return null;
}
