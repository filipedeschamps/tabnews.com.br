import { isObject } from './is';

/**
 * Splits the configuration object into processors and state objects.
 *
 * @param {Object} config - The configuration object to split.
 * @param {Object} defaultProcessors - The default processors to use if `isInitial` is true.
 * @param {boolean} isInitial - Flag indicating if the initial processors should be used.
 * @returns {Object} An object containing two properties:
 *   - `processors`: An object with the processors for each field.
 *   - `state`: An object with the state for each field.
 */
export function splitConfig(config = {}, defaultProcessors = {}, isInitial) {
  const processors = {};
  const state = {};

  Object.keys(config).forEach((field) => {
    const fieldConfig = config[field];

    processors[field] = isInitial ? { ...defaultProcessors } : {};

    if (!isObject(fieldConfig)) {
      state[field] = { value: fieldConfig };
    } else {
      const updatedState = { ...fieldConfig };

      Object.keys(defaultProcessors).forEach((key) => {
        if (fieldConfig[key]) {
          processors[field][key] = fieldConfig[key];
          delete updatedState[key];
        }
      });

      state[field] = updatedState;
    }
  });

  return { processors, state };
}
