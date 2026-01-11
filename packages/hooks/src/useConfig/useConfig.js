import { splitConfig } from '@tabnews/helpers';
import { useCallback, useMemo } from 'react';

import { useMergedState } from '../useMergedState';

/**
 * Custom hook to manage configuration and state processing.
 *
 * @param {Object} initialConfig - The initial configuration object.
 * @param {Object} defaultProcessors - An object containing the default functions for each processor.
 * @returns {Object} An object containing:
 *   - {Object} processors - The current processors.
 *   - {Function} split - Function to split the configuration.
 *   - {Object} state - The current state.
 *   - {Function} updateProcessors - Function to update the processors through a merge.
 *   - {Function} updateState - Function to update the state through a deep merge.
 */
export function useConfig(initialConfig, defaultProcessors) {
  const split = useCallback(
    (config, isInitial) => splitConfig(config, defaultProcessors, isInitial),
    [defaultProcessors],
  );

  const config = useMemo(() => split(initialConfig, true), [initialConfig, split]);

  const [processors, updateProcessors] = useMergedState(config.processors);
  const [state, updateState] = useMergedState(config.state);

  return { processors, split, state, updateProcessors, updateState };
}
