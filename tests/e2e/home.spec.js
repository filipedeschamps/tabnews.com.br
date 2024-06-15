import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { RecentPage } from './page-object/recent-page';

const titleHome = 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia';

test.beforeAll('Running orchestrator, creating default user and content', async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  const defaultUser = await orchestrator.createUser({
    username: 'defaultuser',
    email: 'email_default_user@gmail.com',
    password: 'password_default_user',
  });
  await orchestrator.activateUser(defaultUser);

  await orchestrator.createContent({
    owner_id: defaultUser.id,
    title: 'Content created by default user',
    status: 'published',
  });
});

test.beforeEach('Navigating to home page', async ({ page }) => {
  await page.goto('/');
});

test.describe('Home page', () => {
  test.describe('Anonymous user', () => {
    test('should be able to visit relevants and recents tab', async ({ page }) => {
      const homePage = new HomePage(page);

      const titleHomePage = await homePage.getTitle();
      await expect(titleHomePage).toBe(titleHome);

      let contentCreatedRelevantTab = await page.getByText('Content created by default user').textContent();
      await expect(contentCreatedRelevantTab).toBe('Content created by default user');

      await homePage.goRecentTab();

      let recentPage = new RecentPage(page);
      let titleRecentPage = await recentPage.getTitle();
      await expect(titleRecentPage).toBe('Página 1 · Recentes · TabNews');

      let contentCreatedRecentTab = await page.getByText('Content created by default user').textContent();
      await expect(contentCreatedRecentTab).toBe('Content created by default user');
    });
  });

  test.describe('Default user', () => {
    test.beforeEach('Navigating to login page and log in', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goToPage();
      await loginPage.login('email_default_user@gmail.com', 'password_default_user');
    });

    test('should be able to visit relevants and recents tab', async ({ page }) => {
      const homePage = new HomePage(page);

      const titleHomePage = await homePage.getTitle();
      await expect(titleHomePage).toBe(titleHome);

      let contentCreatedRelevantTab = await page.getByText('Content created by default user').textContent();
      await expect(contentCreatedRelevantTab).toBe('Content created by default user');

      await homePage.goRecentTab();

      let recentPage = new RecentPage(page);
      let titleRecentPage = await recentPage.getTitle();
      await expect(titleRecentPage).toBe('Página 1 · Recentes · TabNews');

      let contentCreatedRecentTab = await page.getByText('Content created by default user').textContent();
      await expect(contentCreatedRecentTab).toBe('Content created by default user');
    });
  });
});
