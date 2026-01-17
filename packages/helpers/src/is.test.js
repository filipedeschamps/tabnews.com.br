import { isArray, isEqual, isObject, isUndefined } from '.';

describe('helpers', () => {
  describe('is', () => {
    describe('isArray', () => {
      it('should return true if the value is an array', () => {
        expect(isArray([1, 2, 3])).toBe(true);
      });

      it('should return false if the value is not an array', () => {
        expect(isArray('not an array')).toBe(false);
        expect(isArray({ key: 'value' })).toBe(false);
        expect(isArray(null)).toBe(false);
        expect(isArray(undefined)).toBe(false);
      });
    });

    describe('isObject', () => {
      it('should return true if the value is an object', () => {
        expect(isObject({ key: 'value' })).toBe(true);
      });

      it('should return false if the value is not an object', () => {
        expect(isObject([])).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject('string')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(undefined)).toBe(false);
      });
    });

    describe('isEqual', () => {
      it('should return true if values are strictly equal', () => {
        const obj1 = { key: 'value' };
        const obj2 = obj1;

        expect(isEqual(1, 1)).toBe(true);
        expect(isEqual('string', 'string')).toBe(true);
        expect(isEqual(true, true)).toBe(true);
        expect(isEqual(obj1, obj2)).toBe(true);
      });

      it('should return false if values are not strictly equal', () => {
        expect(isEqual(1, '1')).toBe(false);
        expect(isEqual(0, -0)).toBe(false);
        expect(isEqual(0, false)).toBe(false);
        expect(isEqual(true, false)).toBe(false);
        expect(isEqual({}, {})).toBe(false);
      });
    });

    describe('isUndefined', () => {
      it('should return true if the value is undefined', () => {
        expect(isUndefined(undefined)).toBe(true);
      });

      it('should return false if the value is not undefined', () => {
        expect(isUndefined(null)).toBe(false);
        expect(isUndefined(0)).toBe(false);
        expect(isUndefined('')).toBe(false);
      });
    });
  });
});
