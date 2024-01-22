import { isContentTooShort } from 'utils/content';

describe('isContentTooShort', () => {
  it('Should return true when content is shorter than the minimum number of words', async () => {
    const content = 'já concordei ctg.';
    expect(isContentTooShort(content)).toBe(true);
  });

  it('Should return false when content is exactly the minimum number of letters and words', async () => {
    const content = 'teste curto antes áéíóú çãâôz';
    expect(isContentTooShort(content)).toBe(false);
  });

  it('Should return false when content is beyond the the minimum number of letters and words', async () => {
    const content = 'testando palavras compridas também acentuadas';
    expect(isContentTooShort(content)).toBe(false);
  });

  it('Should return true when content is empty', async () => {
    const content = '';
    expect(isContentTooShort(content)).toBe(true);
  });
});
