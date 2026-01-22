import { act, renderHook } from '@testing-library/react';

import { useConfig } from '.';

describe('hooks', () => {
  describe('useConfig', () => {
    const defaultProcessors = { p1: () => 'Default p1', p2: () => 'Default p2' };
    const initialConfig = {
      f1: { p1: () => 'Initial p1', s1: 'Initial s1' },
      f2: { p2: () => 'Initial p2', s1: 'Initial s1', s2: 'Initial s2' },
    };

    const expectedConfig = {
      processors: {
        f1: { ...defaultProcessors, p1: initialConfig.f1.p1 },
        f2: { ...defaultProcessors, p2: initialConfig.f2.p2 },
      },
      state: {
        f1: { s1: 'Initial s1' },
        f2: { s1: 'Initial s1', s2: 'Initial s2' },
      },
      updateProcessors: expect.any(Function),
      updateState: expect.any(Function),
      split: expect.any(Function),
    };

    it('should initialize with the given initial config', () => {
      const { result } = renderHook(() => useConfig(initialConfig, defaultProcessors));

      expect(result.current).toStrictEqual(expectedConfig);
    });

    it('should update processors state', () => {
      const { result } = renderHook(() => useConfig(initialConfig, defaultProcessors));
      const p2 = () => 'Custom p2';

      act(() => {
        result.current.updateProcessors({ f2: { p2 } });
      });

      expect(result.current.processors).toStrictEqual({
        ...expectedConfig.processors,
        f2: { ...expectedConfig.processors.f2, p2 },
      });
    });

    it('should not update processors when passed an empty object', () => {
      const { result } = renderHook(() => useConfig(initialConfig, defaultProcessors));

      act(() => result.current.updateProcessors({}));
      expect(result.current.processors).toStrictEqual(expectedConfig.processors);

      act(() => result.current.updateProcessors());
      expect(result.current.processors).toStrictEqual(expectedConfig.processors);
    });

    it('should update state', () => {
      const { result } = renderHook(() => useConfig(initialConfig, defaultProcessors));

      act(() => {
        result.current.updateState({ f1: { s2: 'state2' } });
      });

      expect(result.current.state).toStrictEqual({
        ...expectedConfig.state,
        f1: { s1: 'Initial s1', s2: 'state2' },
      });
    });

    it('should not update state when passed an empty object', () => {
      const { result } = renderHook(() => useConfig(initialConfig, defaultProcessors));

      act(() => result.current.updateState({}));
      expect(result.current.state).toStrictEqual(expectedConfig.state);

      act(() => result.current.updateState());
      expect(result.current.state).toStrictEqual(expectedConfig.state);
    });

    it('should memoize split function', () => {
      const { result, rerender } = renderHook(({ config }) => useConfig(config, defaultProcessors), {
        initialProps: { config: initialConfig },
      });

      const initialSplit = result.current.split;

      rerender({ config: { processors: { p1: () => 'Custom p1' }, state: { s2: 'state2' } } });

      expect(result.current.split).toBe(initialSplit);
    });
  });
});
