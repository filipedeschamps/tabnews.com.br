import { identity, noop, returnNull } from '.';

describe('helpers', () => {
  describe('No-Op and Identity Functions', () => {
    const inputs = [, 42, '42', 'hello', null, undefined, { key: 'value' }, [1, 2, 3]];

    it('should have 8 test inputs', () => {
      expect(inputs).toHaveLength(8);
    });

    describe('identity', () => {
      it('should return the same value that is passed in', () => {
        inputs.forEach((input) => {
          expect(identity(input)).toStrictEqual(input);
        });
      });
    });

    describe('noop', () => {
      it('should not throw an error when called', () => {
        inputs.forEach((input) => {
          expect(noop(input)).toBeUndefined();
        });
      });
    });

    describe('returnNull', () => {
      it('should return null', () => {
        inputs.forEach((input) => {
          expect(returnNull(input)).toBeNull();
        });
      });
    });
  });
});
