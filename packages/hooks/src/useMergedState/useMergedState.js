import { deepMerge } from '@tabnews/helpers';
import { useReducer } from 'react';

/**
 * Custom hook that returns a stateful value and a function to update it.
 * The state is initialized with the provided initial state and updates
 * are merged deeply using the deepMerge function.
 *
 * @param {*} initialState - The initial state object.
 * @returns {[*, Function]} - An array containing the current state and a function to update it by merging.
 */
export function useMergedState(initialState) {
  return useReducer(deepMerge, initialState);
}
