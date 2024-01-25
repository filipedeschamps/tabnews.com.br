import { isContentTooShort } from 'utils/content';

describe('.isContentTooShort', () => {
  it('Should return true when content is shorter than numCharacters', async () => {
    const numCharacters = 5;
    const content = 'já concordei ctg.';
    expect(isContentTooShort(content, numCharacters)).toBe(true);
  });

  it('Should return false when content is NOT shorter than numCharacters', async () => {
    const numCharacters = 5;
    const content = 'palhaçada que você disse para flávia beber cachaça!';
    expect(isContentTooShort(content, numCharacters)).toBe(false);
  });
});
