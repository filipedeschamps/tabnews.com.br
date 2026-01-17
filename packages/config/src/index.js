import { ask } from './ask';
import * as envs from './envs';
import * as logger from './logger';
import * as test from './tester';

const tn = {
  ask,
  envs,
  logger,
  test,
};

export default tn;
export { ask, envs, logger, test };
