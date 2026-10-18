import { parseContent } from 'models/thumbnail.jsx';

const ZWSP = '​';

function parseTitle(title) {
  return parseContent({ title, owner_username: 'user', published_at: '2026-10-18T12:00:00.000Z' }).title;
}

describe('thumbnail model', () => {
  describe('parseContent', () => {
    it('should add a zero-width space between an emoji and the following space', () => {
      expect(parseTitle('🚀 Lançamos o TabNews')).toBe(`🚀${ZWSP} Lançamos o TabNews`);
      expect(parseTitle('Lançamos 🎉🔥 hoje')).toBe(`Lançamos 🎉🔥${ZWSP} hoje`);
    });

    it('should handle emoji sequences as a single emoji', () => {
      expect(parseTitle('👩‍❤️‍💋‍👨 casal')).toBe(`👩‍❤️‍💋‍👨${ZWSP} casal`);
      expect(parseTitle('👍🏽 tom de pele')).toBe(`👍🏽${ZWSP} tom de pele`);
      expect(parseTitle('🇧🇷 bandeira')).toBe(`🇧🇷${ZWSP} bandeira`);
      expect(parseTitle('🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia')).toBe(`🏴󠁧󠁢󠁳󠁣󠁴󠁿${ZWSP} Escócia`);
      expect(parseTitle('❤️ coração')).toBe(`❤️${ZWSP} coração`);
      expect(parseTitle('1️⃣ keycap')).toBe(`1️⃣${ZWSP} keycap`);
    });

    it('should not change text when no emoji is followed by a space', () => {
      expect(parseTitle('Título sem emoji')).toBe('Título sem emoji');
      expect(parseTitle('Antes do emoji 🚀')).toBe('Antes do emoji 🚀');
      expect(parseTitle('Pontuação depois 🎉!')).toBe('Pontuação depois 🎉!');
      expect(parseTitle('Ação, coração e função: Ç ã õ')).toBe('Ação, coração e função: Ç ã õ');
    });

    it('should apply to the parent title and to titles from the body', () => {
      const parsed = parseContent(
        { body: '**🚀 Corpo** em markdown', owner_username: 'user', published_at: '2026-10-18T12:00:00.000Z' },
        { title: '🔥 Título pai' },
      );

      expect(parsed.title).toBe(`🚀${ZWSP} Corpo em markdown`);
      expect(parsed.parentTitle).toBe(`🔥${ZWSP} Título pai`);
    });
  });
});
