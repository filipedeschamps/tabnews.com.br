const fs = require('node:fs');
const { join, resolve } = require('path');

const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false,
});

seedDatabase();

async function seedDatabase() {
  console.log('> Seeding database...');

  await client.connect();
  await seedDevelopmentUsers();
  await createFirewallFunctions();
  await client.end();

  console.log('\n> Database seeded!');
}

async function seedDevelopmentUsers() {
  await insertUser('admin', 'admin@admin.com', '$2a$04$v0hvAu/y6pJ17LzeCfcKG.rDStO9x5ficm2HTLZIfeDBG8oR/uQXi', [
    'create:session',
    'read:session',
    'create:content',
    'create:content:text_root',
    'create:content:text_child',
    'update:content',
    'update:user',
    'ban:user',
    'read:migration',
    'create:migration',
    'update:content:others',
  ]);
  await insertUser('user', 'user@user.com', '$2a$04$v0hvAu/y6pJ17LzeCfcKG.rDStO9x5ficm2HTLZIfeDBG8oR/uQXi', [
    'create:session',
    'read:session',
    'create:content',
    'create:content:text_root',
    'create:content:text_child',
    'update:content',
    'update:user',
  ]);
  await addUserFeaturesByUsername('admin', ['create:recovery_token:username']);

  console.log('------------------------------');
  console.log('> You can now Login to TabNews using the following credentials:');
  console.log('> "admin@admin.com" + "password"');
  console.log('> "user@user.com" + "password"');
  console.log('------------------------------');

  async function insertUser(username, email, passwordHash, features) {
    try {
      const query = {
        text: 'INSERT INTO users (username, email, password, features) VALUES($1, $2, $3, $4) RETURNING *;',
        values: [username, email, passwordHash, features],
      };

      await client.query(query);
    } catch (error) {
      // Probably there's a better way to do this
      if (!error.detail.includes('already exists')) {
        throw error;
      }
    }
  }

  async function addUserFeaturesByUsername(username, features) {
    try {
      const getUserByUsernameQuery = {
        text: 'SELECT features FROM users WHERE username = $1;',
        values: [username],
      };
      const resultFromGetUserByUsernameQuery = await client.query(getUserByUsernameQuery);
      const user = resultFromGetUserByUsernameQuery.rows[0];

      const newFeatures = [];
      const newFeatureCandidatesWithoutDuplicates = new Set([...features]);

      newFeatureCandidatesWithoutDuplicates.forEach((newFeatureCandidate) => {
        if (!user.features.includes(newFeatureCandidate)) {
          newFeatures.push(newFeatureCandidate);
        }
      });

      const updateUserFeaturesQuery = {
        text: `
          UPDATE users SET features = array_cat(features, $1), updated_at = (now() at time zone 'utc')
          WHERE username = $2
          RETURNING *;
        `,
        values: [newFeatures, username],
      };

      await client.query(updateUserFeaturesQuery);
    } catch (error) {
      throw error;
    }
  }
}

async function createFirewallFunctions() {
  console.log('\n> Creating Firewall functions...');
  const proceduresPath = join(resolve('.'), 'infra', 'stored-procedures');
  const procedures = fs.readdirSync(proceduresPath);

  for (const procedureFile of procedures) {
    const procedureQuery = fs.readFileSync(`${proceduresPath}/${procedureFile}`, 'utf8');
    await client.query(procedureQuery);
  }
  console.log('> Firewall functions created!');
}
