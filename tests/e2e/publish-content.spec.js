import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { PublishContentPage } from './page-object/publish-content-page';
import { UserContentPage } from './page-object/user-content-page';

test.beforeAll('Running orchestrator', async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

test.describe('Publish content', () => {
  test.describe('Anonymous user', () => {
    test('should not to publish content by header and menu', async ({ page }) => {
      const homePage = new HomePage(page);
      await expect(homePage.buttonRegisterHeader).toHaveCount(0);
      await expect(homePage.buttonUserMenu).toHaveCount(0);
    });
  });

  test.describe('Default user', () => {
    test.beforeAll('Creating default user', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'defaultuser',
        email: 'email_default_user@gmail.com',
        password: 'password_default_user',
      });
      await orchestrator.activateUser(defaultUser);
    });

    test.beforeEach('Navigating for login page and log in', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goToPage();
      await loginPage.login('email_default_user@gmail.com', 'password_default_user');
    });

    test('should to publish content by header', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goPublishContent();

      let publishContentPage = new PublishContentPage(page);
      const title = await publishContentPage.getTitle();
      expect(title).toBe('Publicar novo conteúdo · TabNews');

      const contentTitleExpected = 'Publicação realizada por usuário padrão vindo pela header';
      await publishContentPage.publish(contentTitleExpected, 'body de conteúdo '.repeat(50));

      const userContentPage = new UserContentPage(page, contentTitleExpected);
      let contentTitle = await userContentPage.getContentTitle();
      await expect(contentTitle).toHaveText(contentTitleExpected);
    });

    test('should to publish content by menu', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goPublishContent(false);

      let publishContentPage = new PublishContentPage(page);
      const title = await publishContentPage.getTitle();
      expect(title).toBe('Publicar novo conteúdo · TabNews');

      const contentTitleExpected = 'Publicação realizada por usuário padrão vindo pela menu do usuário';
      await publishContentPage.publish(contentTitleExpected, 'body de conteúdo '.repeat(50));

      const userContentPage = new UserContentPage(page, contentTitleExpected);
      let contentTitle = await userContentPage.getContentTitle();
      await expect(contentTitle).toHaveText(contentTitleExpected);
    });
  });
});
