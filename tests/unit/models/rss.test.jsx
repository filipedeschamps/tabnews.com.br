// @vitest-environment jsdom
import rss from 'models/rss';

function generateContent(body, title = 'Título') {
  const feed = rss.generateRss2([
    {
      title,
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

    describe('CDATA injection', () => {
      const maliciousText =
        'A]]>B]]><script xmlns="http://www.w3.org/1999/xhtml">alert(document.domain)</script><![CDATA[C';

      function parseFeed(title, body) {
        const feed = rss.generateRss2([
          {
            title,
            body,
            slug: 'titulo',
            owner_username: 'rafael',
            published_at: new Date('2026-08-01T00:00:00.000Z'),
            updated_at: new Date('2026-08-01T00:00:00.000Z'),
          },
        ]);

        const xml = new DOMParser().parseFromString(feed, 'text/xml');

        expect(xml.querySelector('parsererror')).toBeNull();

        return xml;
      }

      it.each([
        ['one', 'A]]>B'],
        ['two', 'A]]>B]]>C'],
        ['consecutive', ']]]]]>>>]]>'],
        ['injected markup', maliciousText],
      ])('should not let a title with %s "]]>" break out of the CDATA section', (_, title) => {
        const xml = parseFeed(title, 'corpo');
        const item = xml.querySelector('item');

        expect(xml.querySelectorAll('script')).toHaveLength(0);
        expect([...item.children].map((child) => child.tagName)).toStrictEqual([
          'title',
          'link',
          'guid',
          'pubDate',
          'description',
          'content:encoded',
          'author',
        ]);
        expect(item.querySelector('title').children).toHaveLength(0);
        expect(item.querySelector('title').textContent.replaceAll('\u200B', '')).toBe(title);
      });

      it('should not let a body with "]]>" break out of the CDATA section', () => {
        const xml = parseFeed('Título', `${maliciousText}\n\n\`\`\`\n${maliciousText}\n\`\`\``);
        const item = xml.querySelector('item');

        expect(xml.querySelectorAll('script')).toHaveLength(0);
        expect(item.querySelector('description').children).toHaveLength(0);
        expect(item.getElementsByTagName('content:encoded')[0].children).toHaveLength(0);
      });
    });
  });
});
