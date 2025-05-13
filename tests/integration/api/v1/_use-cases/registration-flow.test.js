import { version as uuidVersion } from 'uuid';

import activation from 'models/activation.js';
import password from 'models/password.js';
import session from 'models/session.js';
import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe('Use case: Registration Flow (all successfully)', () => {
  let postUserResponseBody;
  let tokenObjectInDatabase;
  let postSessionResponseBody;
  let parsedCookiesFromPost;

  test('Create account (successfully)', async () => {
    const postUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'RegularRegistrationFlow',
        email: 'RegularRegistrationFlow@gmail.com',
        password: 'RegularRegistrationFlowPassword',
      }),
    });

    postUserResponseBody = await postUserResponse.json();

    expect.soft(postUserResponse.status).toBe(201);
    expect(uuidVersion(postUserResponseBody.id)).toBe(4);
    expect(postUserResponseBody.username).toBe('RegularRegistrationFlow');
    expect(postUserResponseBody.features).toStrictEqual(['read:activation_token']);
    expect(Date.parse(postUserResponseBody.created_at)).not.toBeNaN();
    expect(Date.parse(postUserResponseBody.updated_at)).not.toBeNaN();
    expect(postUserResponseBody).not.toHaveProperty('email');
    expect(postUserResponseBody).not.toHaveProperty('password');

    const createdUserInDatabase = await user.findOneByUsername('RegularRegistrationFlow');
    const passwordsMatch = await password.compare('RegularRegistrationFlowPassword', createdUserInDatabase.password);

    expect(passwordsMatch).toBe(true);

    const userInDatabase = await user.findOneById(postUserResponseBody.id);
    expect(userInDatabase.email).toBe('regularregistrationflow@gmail.com');
  });

  test('Receive email (successfully)', async () => {
    const activationEmail = await orchestrator.waitForFirstEmail();

    tokenObjectInDatabase = await activation.findOneTokenByUserId(postUserResponseBody.id);
    const activationPageEndpoint = `${activation.getActivationPageEndpoint()}/${tokenObjectInDatabase.id}`;

    expect(activationEmail.sender).toBe('<contato@tabnews.com.br>');
    expect(activationEmail.recipients).toStrictEqual(['<regularregistrationflow@gmail.com>']);
    expect(activationEmail.subject).toBe('Ative seu cadastro no TabNews');
    expect(activationEmail.text).toContain(postUserResponseBody.username);
    expect(activationEmail.html).toContain(postUserResponseBody.username);
    expect(activationEmail.text).toContain(activationPageEndpoint);
    expect(activationEmail.html).toContain(activationPageEndpoint);
  });

  test('Activate (successfully)', async () => {
    const activationApiEndpoint = activation.getActivationApiEndpoint();
    const activationApiResponse = await fetch(activationApiEndpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token_id: tokenObjectInDatabase.id,
      }),
    });
    const activationApiResponseBody = await activationApiResponse.json();

    expect.soft(activationApiResponse.status).toBe(200);
    expect(uuidVersion(activationApiResponseBody.id)).toBe(4);
    expect(activationApiResponseBody.id).toBe(tokenObjectInDatabase.id);
    expect(activationApiResponseBody.used).toBe(true);
    expect(Date.parse(activationApiResponseBody.created_at)).not.toBeNaN();
    expect(Date.parse(activationApiResponseBody.updated_at)).not.toBeNaN();
    expect(activationApiResponseBody).not.toHaveProperty('password');
    expect(activationApiResponseBody).not.toHaveProperty('email');
    expect(activationApiResponseBody).not.toHaveProperty('user_id');

    const activatedUserInDatabase = await user.findOneByUsername('RegularRegistrationFlow');
    expect(activatedUserInDatabase.features).toStrictEqual([
      'create:session',
      'read:session',
      'create:content',
      'create:content:text_root',
      'create:content:text_child',
      'update:content',
      'update:user',
    ]);
  });

  test('Login (successfully)', async () => {
    const postSessionResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'RegularRegistrationFlow@gmail.com',
        password: 'RegularRegistrationFlowPassword',
      }),
    });

    postSessionResponseBody = await postSessionResponse.json();

    expect.soft(postSessionResponse.status).toBe(201);
    expect(postSessionResponseBody.token.length).toBe(96);
    expect(uuidVersion(postSessionResponseBody.id)).toBe(4);
    expect(Date.parse(postSessionResponseBody.expires_at)).not.toBeNaN();
    expect(Date.parse(postSessionResponseBody.created_at)).not.toBeNaN();
    expect(Date.parse(postSessionResponseBody.updated_at)).not.toBeNaN();

    const sessionObjectInDatabase = await session.findOneById(postSessionResponseBody.id);
    expect(sessionObjectInDatabase.user_id).toBe(postUserResponseBody.id);

    parsedCookiesFromPost = orchestrator.parseSetCookies(postSessionResponse);
    expect(parsedCookiesFromPost.session_id.name).toBe('session_id');
    expect(parsedCookiesFromPost.session_id.value).toBe(postSessionResponseBody.token);
    expect(parsedCookiesFromPost.session_id.maxAge).toBe(60 * 60 * 24 * 30);
    expect(parsedCookiesFromPost.session_id.path).toBe('/');
    expect(parsedCookiesFromPost.session_id.httpOnly).toBe(true);
  });

  test('Get user (successfully)', async () => {
    const getUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
      method: 'GET',
      headers: {
        cookie: `session_id=${parsedCookiesFromPost.session_id.value}`,
      },
    });

    const getUserResponseBody = await getUserResponse.json();

    expect.soft(getUserResponse.status).toBe(200);
    expect(getUserResponseBody).toStrictEqual({
      id: postUserResponseBody.id,
      username: postUserResponseBody.username,
      email: 'regularregistrationflow@gmail.com',
      description: '',
      notifications: true,
      features: [
        'create:session',
        'read:session',
        'create:content',
        'create:content:text_root',
        'create:content:text_child',
        'update:content',
        'update:user',
      ],
      tabcoins: 0,
      tabcash: 0,
      created_at: postUserResponseBody.created_at,
      updated_at: getUserResponseBody.updated_at,
    });
  });
});
