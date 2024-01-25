import { isContentTooShort } from 'utils/content';

describe('.isContentTooShort', () => {
  it('Should return true when content is shorter than minimumNumWords', async () => {
    const minimumNumWords = 5;
    const content = 'já concordei ctg.';
    expect(isContentTooShort(content, minimumNumWords)).toBe(true);
  });

  it('Should return false when content is NOT shorter than minimumNumWords', async () => {
    const minimumNumWords = 5;
    const content = 'palhaçada que você disse para flávia beber cachaça!';
    expect(isContentTooShort(content, minimumNumWords)).toBe(false);
  });

  it('Should return true when content is empty', async () => {
    const minimumNumWords = 5;
    const content = '';
    expect(isContentTooShort(content, minimumNumWords)).toBe(true);
  });
});
