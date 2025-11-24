import { trimEnd, trimStart, truncate } from './strings';

describe('helpers', () => {
  describe('trimStart', () => {
    it('should remove invisible characters from the start of a string', () => {
      const input = '\u034f\u034fHello';
      const result = trimStart(input);
      expect(result).toBe('Hello');
    });

    it('should return the same string if no invisible characters are at the start', () => {
      const input = 'Hello';
      const result = trimStart(input);
      expect(result).toBe('Hello');
    });
  });

  describe('trimEnd', () => {
    it('should remove invisible characters from the end of a string', () => {
      const input = 'Hello\u034f\u034f';
      const result = trimEnd(input);
      expect(result).toBe('Hello');
    });

    it('should return the same string if no invisible characters are at the end', () => {
      const input = 'Hello';
      const result = trimEnd(input);
      expect(result).toBe('Hello');
    });
  });

  describe('truncate', () => {
    it('should truncate a string to the specified maxLength and append "..."', () => {
      const input = 'This is a long string.';
      const result = truncate(input, 10);
      expect(result).toBe('This is...');
    });

    it('should return the original string if it is shorter than maxLength', () => {
      const input = 'Short';
      const result = truncate(input, 10);
      expect(result).toBe('Short');
    });

    it('should return the original string if maxLength is not provided', () => {
      const input = 'No max length';
      const result = truncate(input);
      expect(result).toBe('No max length');
    });

    it('should return the original string if maxLength is not a number', () => {
      const input = 'Max length is not a number';
      const result = truncate(input, 'not a number');
      expect(result).toBe(input);
    });

    it('should return the same object if input is not a string', () => {
      const input = 1234567890;
      const result = truncate(input, 5);
      expect(result).toBe(input);
    });

    it('should return empty string if maxLength is 0', () => {
      const input = 'Max length = 0';
      const result = truncate(input, 0);
      expect(result).toBe('');
    });

    it('should return empty string if maxLength is negative', () => {
      const input = 'negative max length';
      const result = truncate(input, -5);
      expect(result).toBe('');
    });

    it('should handle empty strings', () => {
      const input = '';
      const result = truncate(input, 10);
      expect(result).toBe(input);
    });

    it('should truncate ellipsis if maxLength is less than ellipsis length', () => {
      const input = 'This is a long string.';
      const result = truncate(input, 2);
      expect(result).toBe('..');
    });

    it('should not truncate if content fits, even when maxLength < ellipsis length', () => {
      const input = '👩‍❤️‍💋‍👨';
      expect(input).toHaveLength(11);
      const result = truncate(input, 2);
      expect(result).toBe('👩‍❤️‍💋‍👨');
    });

    it('should not truncate when grapheme count is below maxLength', () => {
      const input = 'Hello 👩‍❤️‍💋‍👨!';
      expect(input).toHaveLength(18);

      const result = truncate(input, 15);
      expect(result).toBe(input);
    });

    it('should handle emojis correctly', () => {
      const input = '😀 This is a long string with emojis.';
      const result = truncate(input, 12);
      expect(result).toBe('😀 This is...');
    });

    it('should handle emojis at the truncation point', () => {
      const emoji = '👩‍❤️‍💋‍👨';
      expect(emoji).toHaveLength(11);
      const input = `Truncate this ${emoji} string.`;

      expect(truncate(input, 16)).toBe('Truncate this...');
      expect(truncate(input, 17)).toBe('Truncate this...');
      expect(truncate(input, 18)).toBe('Truncate this 👩‍❤️‍💋‍👨...');
      expect(truncate(input, 19)).toBe('Truncate this 👩‍❤️‍💋‍👨...');
      expect(truncate(input, 20)).toBe('Truncate this 👩‍❤️‍💋‍👨 s...');
    });
  });
});
