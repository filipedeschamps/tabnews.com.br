import { isValidEmail, suggestEmail } from '.';

describe('helpers', () => {
  describe('suggestEmail', () => {
    it('should return null for a correct email', () => {
      const emails = ['user@gmail.com', 'user@yahoo.com.br', 'user@outlook.com.br'];

      emails.forEach((input) => {
        expect(suggestEmail(input)).toBeNull();
      });
    });

    it('should return null for an email with an unknown domain', () => {
      const email = 'user@unknown.com';
      expect(suggestEmail(email)).toBeNull();
    });

    it('should handle emails in uppercase', () => {
      const emails = [
        'USER@GMAIL.COM',
        'name@HotMail.com',
        'userName@outlook.com',
        'mail@yahoo.Com',
        'Unknown@unknowN.cOm',
      ];

      emails.forEach((input) => {
        expect(suggestEmail(input)).toBeNull();
      });
    });

    it('should return null when suggestion is not possible', () => {
      const emails = ['', ' ', '_', 'username', '@', 'a@', '@b', 'c@d', '@.com', '.', '-'];

      emails.forEach((input) => {
        expect(suggestEmail(input)).toBeNull();
      });
    });

    it('should handle emails with subdomains', () => {
      const email = 'user@subdomain.domain.com';
      expect(suggestEmail(email)).toBeNull();
    });

    it('should suggest correct email for typos with country code', () => {
      const typos = [
        { input: 'user@gmail.com.br', expected: 'user@gmail.com' },
        { input: 'name@hotmail.com.ar', expected: 'name@hotmail.com' },
      ];

      typos.forEach(({ input, expected }) => {
        expect(suggestEmail(input)).toBe(expected);
      });
    });

    it('should suggest correct email for emails with special characters', () => {
      const typos = [
        { input: 'user_name@g%mˆa#i!l...com..', expected: 'user_name@gmail.com' },
        { input: 'name@h(o)t_mail.com', expected: 'name@hotmail.com' },
        { input: 'user@sub_domain.domain.com', expected: null },
      ];

      typos.forEach(({ input, expected }) => {
        expect(suggestEmail(input)).toBe(expected);
      });
    });

    it('should handle emails with multiple typos', () => {
      const email = 'user@gmial.coom';
      expect(suggestEmail(email)).toBe('user@gmail.com');
    });

    const testCases = [
      ['', null],
      ['gmail', 'gmail.com'],
      ['gmail.', 'gmail.com'],
      ['gmail.c', 'gmail.com'],
      ['gmail.co', 'gmail.com'],
      ['gmail.coom', 'gmail.com'],
      ['gmail.comm', 'gmail.com'],
      ['gmail.com.', 'gmail.com'],
      ['gmail.com.b', 'gmail.com'],
      ['gmail.com.br', 'gmail.com'],
      ['mail.com', 'gmail.com'],
      ['dmail.com', 'gmail.com'],
      ['gmad.com,', 'gmail.com'],
      ['gimail.com', 'gmail.com'],
      ['mgil.com', 'gmail.com'],
      ['gil.com', 'gmail.com'],
      ['gmaul.com', 'gmail.com'],
      ['gnail.com', 'gmail.com'],
      ['gail.com', 'gmail.com'],
      ['gamail.com', 'gmail.com'],
      ['gamial.com', 'gmail.com'],
      ['gamil.com', 'gmail.com'],
      ['gmail.cpm', 'gmail.com'],
      ['ggmail.com', 'gmail.com'],
      ['gmai.com', 'gmail.com'],
      ['gmaiil.com', 'gmail.com'],
      ['gmail.cm', 'gmail.com'],
      ['gmaild.com', 'gmail.com'],
      ['gmaile.com', 'gmail.com'],
      ['gmaill.com', 'gmail.com'],
      ['gmain.com', 'gmail.com'],
      ['gmaio.com', 'gmail.com'],
      ['gmail.cok', 'gmail.com'],
      ['gmal.com', 'gmail.com'],
      ['gmali.com', 'gmail.com'],
      ['gmil.co', 'gmail.com'],
      ['gmanil.com', 'gmail.com'],
      ['gmaol.com', 'gmail.com'],
      ['gmaqil.com', 'gmail.com'],
      ['gmeil.com', 'gmail.com'],
      ['gmial.com', 'gmail.com'],
      ['gmil.com', 'gmail.com'],
      ['gmmail.com', 'gmail.com'],
      ['gmsil.com', 'gmail.com'],
      ['hmail.com', 'gmail.com'],
      ['ygmail.com', 'gmail.com'],
      ['gmiail.com', 'gmail.com'],
      ['gemail.com', 'gmail.com'],
      ['gmail.con', 'gmail.com'],
      ['gail.com.ar', 'gmail.com'],
      ['gamail.com.ar', 'gmail.com'],
      ['gamial.com.ar', 'gmail.com'],
      ['gamil.com.ar', 'gmail.com'],
      ['ggmail.com.ar', 'gmail.com'],
      ['gmai.com.ar', 'gmail.com'],
      ['gmaiil.com.ar', 'gmail.com'],
      ['gmail.cm.br', 'gmail.com'],
      ['gmail.cm.ar', 'gmail.com'],
      ['gmaild.com.ar', 'gmail.com'],
      ['gmaile.com.ar', 'gmail.com'],
      ['gmaill.com.ar', 'gmail.com'],
      ['gmain.com.ar', 'gmail.com'],
      ['gmaio.com.ar', 'gmail.com'],
      ['gmal.com.ar', 'gmail.com'],
      ['gmali.com.ar', 'gmail.com'],
      ['gmanil.com.ar', 'gmail.com'],
      ['gmaol.com.ar', 'gmail.com'],
      ['gmailee.com', 'gmail.com'],
      ['gmaqil.com.ar', 'gmail.com'],
      ['gmeil.com.ar', 'gmail.com'],
      ['gmial.com.ar', 'gmail.com'],
      ['gmil.com.ar', 'gmail.com'],
      ['gmmail.com.ar', 'gmail.com'],
      ['gmsil.com.ar', 'gmail.com'],
      ['hmail.com.ar', 'gmail.com'],
      ['ygmail.com.ar', 'gmail.com'],
      ['gmail.cim', 'gmail.com'],
      ['gmail.com.ar', 'gmail.com'],
      ['gmailc.om', 'gmail.com'],
      ['gmnail.com', 'gmail.com'],
      ['gmakl.com', 'gmail.com'],
      ['gmol.com', 'gmail.com'],
      ['gmail.cin', 'gmail.com'],
      ['gmail.cim', 'gmail.com'],
      ['gmaiq.com', 'gmail.com'],
      ['gmailc.mo', 'gmail.com'],
      ['hitmail.com', 'hotmail.com'],
      ['htmail.com', 'hotmail.com'],
      ['hotmail.coom', 'hotmail.com'],
      ['hotmail.comm', 'hotmail.com'],
      ['hotnail.ckm', 'hotmail.com'],
      ['hatmail.com', 'hotmail.com'],
      ['hotomail.com', 'hotmail.com'],
      ['otmail.com', 'hotmail.com'],
      ['hoitmail.com', 'hotmail.com'],
      ['hoimail.com', 'hotmail.com'],
      ['hotnail.com', 'hotmail.com'],
      ['homail.com', 'hotmail.com'],
      ['homtail.com', 'hotmail.com'],
      ['homtmail.com', 'hotmail.com'],
      ['hormail.com', 'hotmail.com'],
      ['hotail.com', 'hotmail.com'],
      ['hotamail.com', 'hotmail.com'],
      ['hotamil.com', 'hotmail.com'],
      ['hotmaail.com', 'hotmail.com'],
      ['hotmai.com', 'hotmail.com'],
      ['hotmaiil.com', 'hotmail.com'],
      ['hotmail.con', 'hotmail.com'],
      ['hotmail.co', 'hotmail.com'],
      ['hotmail.cm', 'hotmail.com'],
      ['hotmaill.com', 'hotmail.com'],
      ['hotmail.net', 'hotmail.com'],
      ['hotmail.ocm', 'hotmail.com'],
      ['hotmailt.com', 'hotmail.com'],
      ['hotmal.com', 'hotmail.com'],
      ['hotmial.com', 'hotmail.com'],
      ['hotmiail.com', 'hotmail.com'],
      ['hotmil.co', 'hotmail.com'],
      ['hotmil.com', 'hotmail.com'],
      ['hotmmail.com', 'hotmail.com'],
      ['hotmqil.com', 'hotmail.com'],
      ['hotmsil.com', 'hotmail.com'],
      ['htoamil.com', 'hotmail.com'],
      ['htomail.com', 'hotmail.com'],
      ['hoymail.com', 'hotmail.com'],
      ['hootmail.com', 'hotmail.com'],
      ['hotmi.com', 'hotmail.com'],
      ['hotmail.com.com', 'hotmail.com'],
      ['hotma.com', 'hotmail.com'],
      ['hotmali.com', 'hotmail.com'],
      ['hotrmail.com', 'hotmail.com'],
      ['hotmail.cim', 'hotmail.com'],
      ['hotmail.cin', 'hotmail.com'],
      ['bol.com', 'bol.com.br'],
      ['yahoo.coom', 'yahoo.com'],
      ['yahoo.comm', 'yahoo.com'],
      ['yahoo.con', 'yahoo.com'],
      ['yaho.com', 'yahoo.com'],
      ['yahoo.com.', 'yahoo.com'],
      ['yahoo.com.v', 'yahoo.com.br'],
      ['yahoo.com.brr', 'yahoo.com.br'],
      ['yahoo.com.bt', 'yahoo.com.br'],
      ['protonmil.com', 'protonmail.com'],
      ['outlok.com', 'outlook.com'],
      ['outlook.con', 'outlook.com'],
      ['outloo.com', 'outlook.com'],
      ['outlook.cm', 'outlook.com'],
      ['outlook.comm', 'outlook.com'],
      ['outlook.co', 'outlook.com'],
      ['outlook.com.', 'outlook.com'],
      ['outlook.com.v', 'outlook.com.br'],
      ['outlook.com.brr', 'outlook.com.br'],
      ['outlook.com.bt', 'outlook.com.br'],
      ['prontomail.com', 'protonmail.com'],
      ['zipmail.combr', 'zipmail.com.br'],
    ];

    it.each(testCases)('should suggest correct email for %s', (domain, expected) => {
      const input = `user@${domain}`;
      const expectedEmail = expected === null ? null : `user@${expected}`;
      expect(suggestEmail(input)).toBe(expectedEmail);
    });
  });

  describe('isValidEmail', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user_name@example.com',
      'user-name@example.com',
      'user+name@example.com',
      'user@example.co.uk',
      'user@example.io',
      'user@example.travel',
      'user@example.museum',
      'user@example.jobs',
    ];

    it.each(validEmails)('should return true for valid email: %s', (validEmail) => {
      expect(isValidEmail(validEmail)).toBe(true);
    });

    const invalidEmails = [
      '',
      'user',
      '@',
      'user@',
      '@example',
      '@example.com',
      'user@ex@mple.com',
      'user@@example.com',
      'userexample.com',
      'user@.com',
      'user@example',
      'user@example.',
      'user@.example.com',
      'user@-example.com',
      'user@example-.com',
      'user@.example.com',
      'user@..example.com',
      'user@example..com',
      'user@exa..mple.com',
      'user@exa--mple.com',
      'user@example.com.',
      'user@example.com..',
      'user@example.com_',
      'user@example.com+',
    ];

    it.each(invalidEmails)('should return false for invalid email: %s', (invalidEmail) => {
      expect(isValidEmail(invalidEmail)).toBe(false);
    });
  });
});
