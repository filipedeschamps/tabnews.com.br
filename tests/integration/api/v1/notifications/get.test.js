import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';
import email from 'infra/email';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe('GET /api/v1/notifications', () => {
  test('the content should have parent_id to send notification', async () => {
    const creatorUser = await orchestrator.createUser();
    const userWhoCommented = await orchestrator.createUser();

    const rootContent = await orchestrator.createContent({
      owner_id: creatorUser.id,
      title: 'Meu primeiro conteúdo criado',
      status: 'published',
    });

    const childContent = await orchestrator.createContent({
      owner_id: userWhoCommented.id,
      parent_id: rootContent.id,
      body: 'Conteúdo child',
      status: 'published',
    });

    const response = await fetch(
      `${orchestrator.webserverUrl}/api/v1/contents/${userWhoCommented.username}/${childContent.slug}`
    );

    const responseBody = await response.json();

    await email.send({
      from: userWhoCommented.email,
      to: creatorUser.email,
      subject: `Alguem respondeu ao seu post no conteúdo '${rootContent.title}'`,
      text: childContent.body,
    });

    const emailSent = await orchestrator.getLastEmail();

    expect(responseBody.parent_id).toEqual(rootContent.id);
    expect(childContent.owner_id).not.toEqual(creatorUser.owner_id);
    expect(emailSent.sender.includes(userWhoCommented.email)).toBe(true);
    expect(emailSent.recipients[0].includes(creatorUser.email)).toBe(true);
  });
});
