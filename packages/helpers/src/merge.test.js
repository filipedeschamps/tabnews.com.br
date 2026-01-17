import { deepMerge } from '.';

describe('helpers', () => {
  describe('deepMerge', () => {
    it('should merge two simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: 1, b: 3, c: 4 });
    });

    it('should perform deep merge on nested objects', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 }, d: 4 };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: { b: 1, c: 2 }, d: 4 });
    });

    it('should override primitive values with objects', () => {
      const target = { a: 1 };
      const source = { a: { b: 2 } };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: { b: 2 } });
    });

    it('should override objects with primitive values', () => {
      const target = { a: { b: 1 } };
      const source = { a: 2 };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: 2 });
    });

    it('should merge arrays by reference', () => {
      const target = { a: [1, 2, 3] };
      const source = { a: [4, 5] };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: [4, 5] });
    });

    it('should not treat null as an object', () => {
      const target = { a: { b: 1 } };
      const source = { a: null };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: null });
    });

    it('should work with undefined values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined, c: undefined };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: 1, b: 2, c: undefined });
      expect(deepMerge(target, {})).toStrictEqual(target);
      expect(deepMerge(target, undefined)).toStrictEqual(target);
    });

    it('should not modify source or target objects directly', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 } };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: { b: 1, c: 2 } });
      expect(target).toStrictEqual({ a: { b: 1 } });
      expect(source).toStrictEqual({ a: { c: 2 } });
    });

    it('should merge objects with arrays and other types', () => {
      const target = { a: [1, 2, 3], b: { c: 1 } };
      const source = { a: [4, 5], b: 2 };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: [4, 5], b: 2 });
    });

    it('should merge deep objects recursively', () => {
      const target = { a: { b: { c: 1 } } };
      const source = { a: { b: { d: 2 } } };
      const result = deepMerge(target, source);

      expect(result).toStrictEqual({ a: { b: { c: 1, d: 2 } } });
    });
  });
});
