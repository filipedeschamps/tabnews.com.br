import find from './find';
import review from './review';
import rules from './rules';

export default Object.freeze({
  ...rules,
  ...review,
  ...find,
});
