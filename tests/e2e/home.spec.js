import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { RecentPage } from './page-object/recent-page';

const titleHome = 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia';

test.beforeAll('Running orchestrator', async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

test.beforeEach('Navigating for home page', async ({ page }) => {
  await page.goto('/');
});

test.describe('Home page', () => {
  test.describe('Anonymous user', () => {
    test('should be able to see relevants and recents tab', async ({ page }) => {
      let homePage = new HomePage(page);

      let titleHomePage = await homePage.getTitle();
      await expect(titleHomePage).toBe(titleHome);

      await homePage.goRecentTab();

      let recentPage = new RecentPage(page);
      let titleRecentPage = await recentPage.getTitle();
      await expect(titleRecentPage).toBe('Página 1 · Recentes · TabNews');

      await recentPage.goRelevantTab();
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

    test.beforeEach('Navigating for login page', async ({ page }) => {
      await page.goto('/');

      const homePage = new HomePage(page);
      await homePage.goLogin();

      const loginPage = new LoginPage(page);
      await loginPage.makeLoginUserDefault('email_default_user@gmail.com', 'password_default_user');
    });

    test('should be able to see relevants and recents tab', async ({ page }) => {
      let homePage = new HomePage(page);

      let titleHomePage = await homePage.getTitle();
      await expect(titleHomePage).toBe(titleHome);

      await homePage.goRecentTab();

      let recentPage = new RecentPage(page);
      let titleRecentPage = await recentPage.getTitle();
      await expect(titleRecentPage).toBe('Página 1 · Recentes · TabNews');

      await recentPage.goRelevantTab();
    });
  });
});
