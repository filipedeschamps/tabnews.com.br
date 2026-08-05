import rss from 'models/rss';

function generateContent(body) {
  const feed = rss.generateRss2([
    {
      title: 'Título',
      body,
      slug: 'titulo',
      owner_username: 'rafael',
      published_at: new Date('2026-08-01T00:00:00.000Z'),
      updated_at: new Date('2026-08-01T00:00:00.000Z'),
    },
  ]);

  return /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/.exec(feed)[1];
}

describe('rss model', () => {
  describe('generateRss2', () => {
    it('should keep the inline math readable, since the feed is read without the KaTeX stylesheet', () => {
      const content = generateContent('A energia é $E = mc^2$ no total.');

      expect(content).toContain('E = mc^2');
      expect(content).not.toContain('katex');
    });

    it('should keep the display math readable', () => {
      const content = generateContent('$$\nx^2 + y^2 = z^2\n$$');

      expect(content).toContain('x^2 + y^2 = z^2');
    });
  });
});
