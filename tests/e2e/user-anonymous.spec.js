import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { RecentPage } from './page-object/recent-page';
import { RegisterPage } from './page-object/register-page';

const titleHome = 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia';

test.beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('should be able to register', async ({ page }) => {
  let homePage = new HomePage(page);

  let title = await homePage.getTitle();
  await expect(title).toBe(titleHome);

  await homePage.goRegister();

  const registerPage = new RegisterPage(page);
  title = await registerPage.getTitle();
  await expect(title).toBe('Cadastro · TabNews');
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

test('should be able to login as user default', async ({ page }) => {
  const defaultUser = await orchestrator.createUser({
    username: 'default_user',
    email: 'email_default_user@gmail.com',
    password: 'password_default_user',
  });
  await orchestrator.activateUser(defaultUser);

  let homePage = new HomePage(page);

  let title = await homePage.getTitle();
  await expect(title).toBe(titleHome);

  await homePage.goLogin();

  const loginPage = new LoginPage(page);
  title = await loginPage.getTitle();
  await expect(title).toBe('Login · TabNews');
  await loginPage.makeLoginUserDefault('email_default_user@gmail.com', 'password_default_user');

  let username = await homePage.getUserLogged();
  expect(username).toBe('default_user');
});
