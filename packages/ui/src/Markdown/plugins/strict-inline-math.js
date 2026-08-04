const DOLLAR_SIGN = 36;

// Whitespace that is not a line ending. A formula may be broken across lines, and no price is written
// with the break glued to the currency symbol, so only the spaces of Pandoc count as padding.
const PADDED = /^[^\S\r\n]|[^\S\r\n]$/;

/**
 * Narrows the inline math of `remark-math`, which pairs any two dollar signs of a paragraph and turns
 * "entre R$ 3 e R$ 5" into a formula. Two rules are enough for every way a price is written:
 *
 * 1. the content cannot begin or end with a space, which is the rule of Pandoc ("R$ 3 e R$ 5");
 * 2. the opening `$` cannot be glued to the right of a letter while the content begins with a digit
 *    and carries a letter, which is a currency symbol, its value and the symbol of the next price
 *    ("R$3 e R$5"). A digit on the left is a coefficient ("3$2x$") and a content of digits alone is a
 *    formula ("x$2$"), so neither is a price.
 *
 * The other rule of Pandoc, that the closing `$` cannot be followed by a digit, only adds false
 * negatives here: it rejects "$n$1" and "2$\times$3" without catching a single price these two miss.
 *
 * Has to run after `@bytemd/plugin-math`, since it hardens the construct that plugin registers.
 * @returns {import('bytemd').BytemdPlugin}
 */
export function strictInlineMathPlugin() {
  return {
    remark: (processor) =>
      processor.use(function () {
        const extensions = this.data('micromarkExtensions') ?? [];

        extensions.forEach((extension, index) => {
          const construct = extension.text?.[DOLLAR_SIGN];

          if (construct) {
            extensions[index] = { ...extension, text: { ...extension.text, [DOLLAR_SIGN]: harden(construct) } };
          }
        });
      }),
  };
}

/**
 * Rejects the match only after the original tokenizer runs, which is when the whole span is known.
 * micromark restores the point of a construct that fails, so the dollar sign goes back to being text
 * and the rest of the line — emphasis included — is parsed as if math had never matched.
 */
function harden(construct) {
  return {
    ...construct,
    tokenize(effects, ok, nok) {
      const start = this.now();
      const previousCode = this.previous;

      const after = (code) => {
        const value = this.sliceSerialize({ start, end: this.now() });

        return isFalsePositive(value, previousCode) ? nok(code) : ok(code);
      };

      return construct.tokenize.call(this, effects, after, nok);
    },
  };
}

function isFalsePositive(value, previousCode) {
  // `$$formula$$` is the way out of both rules, and ruling it out is also what makes the slice below
  // safe: micromark closes a sequence with as many dollar signs as it opened, so a single one is left
  // on each end.
  if (value.startsWith('$$')) return false;

  const content = value.slice(1, -1);

  return PADDED.test(content) || (/^\d/.test(content) && /\p{L}/u.test(content) && isLetter(previousCode));
}

// Codes below zero are the line endings and the virtual spaces of micromark, and `null` is the start
// of the content.
function isLetter(code) {
  return code > 0 && /\p{L}/u.test(String.fromCodePoint(code));
}
