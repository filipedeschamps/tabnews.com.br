import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import activation from 'models/activation.js';
import authentication from 'models/authentication';
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
      method: 'post',
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

    expect(postUserResponse.status).toEqual(201);
    expect(uuidVersion(postUserResponseBody.id)).toEqual(4);
    expect(postUserResponseBody.username).toEqual('RegularRegistrationFlow');
    expect(postUserResponseBody.features).toEqual(['read:activation_token']);
    expect(Date.parse(postUserResponseBody.created_at)).not.toEqual(NaN);
    expect(Date.parse(postUserResponseBody.updated_at)).not.toEqual(NaN);
    expect(postUserResponseBody).not.toHaveProperty('email');
    expect(postUserResponseBody).not.toHaveProperty('password');

    const createdUserInDatabase = await user.findOneByUsername('RegularRegistrationFlow');
    const passwordsMatch = await password.compare('RegularRegistrationFlowPassword', createdUserInDatabase.password);

    expect(passwordsMatch).toBe(true);

    const userInDatabase = await user.findOneById(postUserResponseBody.id);
    expect(userInDatabase.email).toEqual('regularregistrationflow@gmail.com');
  });

  test('Receive email (successfully)', async () => {
    const activationEmail = await orchestrator.getLastEmail();

    tokenObjectInDatabase = await activation.findOneTokenByUserId(postUserResponseBody.id);
    const activationPageEndpoint = `${activation.getActivationPageEndpoint()}/${tokenObjectInDatabase.id}`;

    expect(activationEmail.sender).toEqual('<contato@tabnews.com.br>');
    expect(activationEmail.recipients).toEqual(['<regularregistrationflow@gmail.com>']);
    expect(activationEmail.subject).toEqual('Ative seu cadastro no TabNews');
    expect(activationEmail.text.includes(postUserResponseBody.username)).toBe(true);
    expect(activationEmail.text.includes(activationPageEndpoint)).toBe(true);
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

    expect(activationApiResponse.status).toEqual(200);
    expect(uuidVersion(activationApiResponseBody.id)).toEqual(4);
    expect(activationApiResponseBody.id).toEqual(tokenObjectInDatabase.id);
    expect(activationApiResponseBody.used).toEqual(true);
    expect(Date.parse(activationApiResponseBody.created_at)).not.toEqual(NaN);
    expect(Date.parse(activationApiResponseBody.updated_at)).not.toEqual(NaN);
    expect(activationApiResponseBody).not.toHaveProperty('password');
    expect(activationApiResponseBody).not.toHaveProperty('email');
    expect(activationApiResponseBody).not.toHaveProperty('user_id');

    const activatedUserInDatabase = await user.findOneByUsername('RegularRegistrationFlow');
    expect(activatedUserInDatabase.features).toEqual([
      'create:session',
      'read:session',
      'create:content',
      'create:content:text_root',
      'create:content:text_child',
      'update:content',
      'update:user',
      'auth:2fa:enable',
      'auth:2fa:disable',
    ]);
  });

  test('Login (successfully)', async () => {
    const postSessionResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'RegularRegistrationFlow@gmail.com',
        password: 'RegularRegistrationFlowPassword',
      }),
    });

    postSessionResponseBody = await postSessionResponse.json();

    expect(postSessionResponse.status).toEqual(201);
    expect(postSessionResponseBody.token.length).toEqual(96);
    expect(uuidVersion(postSessionResponseBody.id)).toEqual(4);
    expect(Date.parse(postSessionResponseBody.expires_at)).not.toEqual(NaN);
    expect(Date.parse(postSessionResponseBody.created_at)).not.toEqual(NaN);
    expect(Date.parse(postSessionResponseBody.updated_at)).not.toEqual(NaN);

    const sessionObjectInDatabase = await session.findOneById(postSessionResponseBody.id);
    expect(sessionObjectInDatabase.user_id).toEqual(postUserResponseBody.id);

    parsedCookiesFromPost = authentication.parseSetCookies(postSessionResponse);
    expect(parsedCookiesFromPost.session_id.name).toEqual('session_id');
    expect(parsedCookiesFromPost.session_id.value).toEqual(postSessionResponseBody.token);
    expect(parsedCookiesFromPost.session_id.maxAge).toEqual(60 * 60 * 24 * 30);
    expect(parsedCookiesFromPost.session_id.path).toEqual('/');
    expect(parsedCookiesFromPost.session_id.httpOnly).toEqual(true);
  });

  test('Get user (successfully)', async () => {
    const getUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
      method: 'get',
      headers: {
        cookie: `session_id=${parsedCookiesFromPost.session_id.value}`,
      },
    });

    const getUserResponseBody = await getUserResponse.json();

    expect(getUserResponse.status).toEqual(200);
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
        'auth:2fa:enable',
        'auth:2fa:disable',
      ],
      tabcoins: 0,
      tabcash: 0,
      created_at: postUserResponseBody.created_at,
      updated_at: getUserResponseBody.updated_at,
    });
  });
});
