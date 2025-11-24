import { splitConfig } from '.';

describe('helpers', () => {
  describe('splitConfig', () => {
    it('should split config into processors and state for initial config', () => {
      const config = {
        field1: { processor: 'processor', value: 'stateValue1' },
        field2: 'stateValue2',
      };
      const defaultProcessors = { processor: 'defaultProcessor' };
      const isInitial = true;

      const result = splitConfig(config, defaultProcessors, isInitial);

      expect(result).toStrictEqual({
        processors: {
          field1: { processor: 'processor' },
          field2: { processor: 'defaultProcessor' },
        },
        state: {
          field1: { value: 'stateValue1' },
          field2: { value: 'stateValue2' },
        },
      });
    });

    it('should split config into processors and state for non-initial config', () => {
      const config = {
        field1: { processor: 'processor', value: 'stateValue1' },
        field2: 'stateValue2',
      };
      const defaultProcessors = { processor: 'defaultProcessor' };
      const isInitial = false;

      const result = splitConfig(config, defaultProcessors, isInitial);

      expect(result).toStrictEqual({
        processors: {
          field1: { processor: 'processor' },
          field2: {},
        },
        state: {
          field1: { value: 'stateValue1' },
          field2: { value: 'stateValue2' },
        },
      });
    });

    it('should handle empty config and defaultProcessors', () => {
      const config = {};
      const defaultProcessors = {};
      const isInitial = true;

      const result = splitConfig(config, defaultProcessors, isInitial);

      expect(result).toStrictEqual({
        processors: {},
        state: {},
      });
    });

    it('should handle non-object fieldConfig', () => {
      const config = {
        field1: 'stateValue1',
        field2: undefined,
      };
      const defaultProcessors = { processor: 'defaultProcessor' };
      const isInitial = true;

      const result = splitConfig(config, defaultProcessors, isInitial);

      expect(result).toStrictEqual({
        processors: {
          field1: { processor: 'defaultProcessor' },
          field2: { processor: 'defaultProcessor' },
        },
        state: {
          field1: { value: 'stateValue1' },
          field2: { value: undefined },
        },
      });
    });

    it('should not modify the original config object', () => {
      const config = {
        field1: { processor: 'processor', value: 'stateValue1' },
      };
      const defaultProcessors = { processor: 'defaultProcessor' };
      const isInitial = true;

      const originalConfig = JSON.parse(JSON.stringify(config));

      splitConfig(config, defaultProcessors, isInitial);

      expect(config).toStrictEqual(originalConfig);
    });
  });
});
