const sanitizeUsername = require('../../utils/usernameSanitizer');

test('Deve retornar o mesmo nome se já estiver válido', () => {
  const input = 'luiz';
  const output = sanitizeUsername(input);
  expect(output).toBe('luiz');
});

test('Deve remover espaços em branco no início e fim', () => {
  const input = '  luiz ';
  const output = sanitizeUsername(input);
  expect(output).toBe('luiz');
});

test('Deve converter letras maiúsculas para minúsculas', () => {
  const input = 'LuIz SoArEs';
  const output = sanitizeUsername(input);
  expect(output).toBe('luiz soares');
});
