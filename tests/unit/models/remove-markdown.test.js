import logger from 'infra/logger';
import removeMarkdown from 'models/remove-markdown';

describe('remove-markdown model', () => {
  vi.mock('infra/logger', () => ({
    default: {
      error: vi.fn(),
    },
  }));

  describe('customRemoveMarkdown', () => {
    it('should remove markdown and return a single line by default', () => {
      const input = '# Heading\n\nThis is **bold** text.';
      const result = removeMarkdown(input);
      expect(result).toBe('Heading This is bold text.');
    });

    it('should preserve line breaks if oneLine is false', () => {
      const input = '# Heading\n\nThis is **bold** text.';
      const result = removeMarkdown(input, { oneLine: false });
      expect(result).toBe('Heading\n\nThis is bold text.');
    });

    it('should trim the output by default', () => {
      const input = '   Heading   ';
      const result = removeMarkdown(input);
      expect(result).toBe('Heading');
    });

    it('should not trim the output if trim option is false', () => {
      const input = '   Heading   ';
      const result = removeMarkdown(input, { trim: false });
      expect(result).toBe(' Heading ');
    });

    it('should truncate the output if maxLength is provided', () => {
      const input = 'This is a very long text that should be truncated.';
      const result = removeMarkdown(input, { maxLength: 20 });
      expect(result).toBe('This is a very lo...');
    });

    it('should handle emojis correctly when truncating', () => {
      const input = '😀 This is a very long text that should be truncated.';
      const result = removeMarkdown(input, { maxLength: 20 });
      expect(result).toBe('😀 This is a very...');
    });

    it('should handle emojis at the truncation point', () => {
      const emoji = '👩‍❤️‍💋‍👨';
      expect(emoji).toHaveLength(11);
      const input = `Truncate this ${emoji} string.`;

      expect(removeMarkdown(input, { maxLength: 16 })).toBe('Truncate this...');
      expect(removeMarkdown(input, { maxLength: 17 })).toBe('Truncate this...');
      expect(removeMarkdown(input, { maxLength: 18 })).toBe('Truncate this 👩‍❤️‍💋‍👨...');
      expect(removeMarkdown(input, { maxLength: 19 })).toBe('Truncate this 👩‍❤️‍💋‍👨...');
      expect(removeMarkdown(input, { maxLength: 20 })).toBe('Truncate this 👩‍❤️‍💋‍👨 s...');
    });

    it('should handle errors gracefully and return the original input', () => {
      const input = {
        content: 'This is a test',
      };

      expect(removeMarkdown(input)).toStrictEqual(input);
      expect(logger.error).toHaveBeenCalledOnce();
      expect(() => removeMarkdown(input)).not.toThrow();
    });
  });
});
