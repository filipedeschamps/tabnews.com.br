import bcryptjs from 'bcryptjs';

async function hash(password) {
  return await bcryptjs.hash(password, getNumberOfSaltRounds());
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

function getNumberOfSaltRounds() {
  let saltRounds = 14;

  if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI) {
    saltRounds = 1;
  }

  return saltRounds;
}

export default Object.freeze({
  hash,
  compare,
});
