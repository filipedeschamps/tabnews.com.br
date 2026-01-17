import { act, renderHook } from '@testing-library/react';

import { useMergedState } from '.';

describe('hooks', () => {
  describe('useMergedState', () => {
    it('should initialize with the given initial state', () => {
      const initialState = { a: 1, b: 2 };
      const { result } = renderHook(() => useMergedState(initialState));

      const [state] = result.current;
      expect(state).toStrictEqual(initialState);
    });

    it('should merge state updates with the current state', () => {
      const initialState = { a: 1, b: 2 };
      const { result } = renderHook(() => useMergedState(initialState));

      const [, dispatch] = result.current;
      act(() => {
        dispatch({ b: 3, c: 4 });
      });

      const [state] = result.current;
      expect(state).toStrictEqual({ a: 1, b: 3, c: 4 });
    });

    it('should perform deep merge on nested objects', () => {
      const initialState = { a: { b: 1 } };
      const { result } = renderHook(() => useMergedState(initialState));

      const [, dispatch] = result.current;
      act(() => {
        dispatch({ a: { c: 2 }, d: 4 });
      });

      const [state] = result.current;
      expect(state).toStrictEqual({ a: { b: 1, c: 2 }, d: 4 });
    });

    it('should not modify the initial state directly', () => {
      const initialState = { a: { b: 1 } };
      const { result } = renderHook(() => useMergedState(initialState));

      const [, dispatch] = result.current;
      act(() => {
        dispatch({ a: { c: 2 } });
      });

      const [state] = result.current;
      expect(state).toStrictEqual({ a: { b: 1, c: 2 } });
      expect(initialState).toStrictEqual({ a: { b: 1 } });
    });

    it('should handle updates with undefined values', () => {
      const initialState = { a: 1, b: 2 };
      const { result } = renderHook(() => useMergedState(initialState));

      const [, dispatch] = result.current;
      act(() => {
        dispatch({ b: undefined, c: undefined });
      });

      const [state] = result.current;
      expect(state).toStrictEqual({ a: 1, b: 2, c: undefined });
    });

    it('should merge arrays by reference', () => {
      const initialState = { a: [1, 2, 3] };
      const { result } = renderHook(() => useMergedState(initialState));

      const [, dispatch] = result.current;
      act(() => {
        dispatch({ a: [4, 5] });
      });

      const [state] = result.current;
      expect(state).toStrictEqual({ a: [4, 5] });
    });

    it('should merge deep objects recursively', () => {
      const initialState = { a: { b: { c: 1 } } };
      const { result } = renderHook(() => useMergedState(initialState));

      const [, dispatch] = result.current;
      act(() => {
        dispatch({ a: { b: { d: 2 } } });
      });

      const [state] = result.current;
      expect(state).toStrictEqual({ a: { b: { c: 1, d: 2 } } });
    });
  });
});
