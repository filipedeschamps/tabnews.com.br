import bcryptjs from 'bcryptjs';
import webserver from 'infra/webserver.js';

async function hash(password) {
  return await bcryptjs.hash(password, getNumberOfSaltRounds());
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

function getNumberOfSaltRounds() {
  let saltRounds = 14;

  if (!webserver.isLambdaServer()) {
    saltRounds = 1;
  }

  return saltRounds;
}

export default Object.freeze({
  hash,
  compare,
});
