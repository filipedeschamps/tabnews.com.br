import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { RegisterPage } from './page-object/register-page';

test.beforeAll('Running orchestrator', async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

test.beforeEach('Navigating for home page', async ({ page }) => {
  await page.goto('/');
});

test.describe('Register user', () => {
  test.describe('Anonymous user', () => {
    test('should be able to register', async ({ page }) => {
      let homePage = new HomePage(page);

      const titleHome = 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia';
      let title = await homePage.getTitle();
      await expect(title).toBe(titleHome);

      await homePage.goRegister();

      const registerPage = new RegisterPage(page);
      title = await registerPage.getTitle();
      await expect(title).toBe('Cadastro · TabNews');

      // TODO: preencher página e cadastrar usuário e fazer validações
    });
  });

  test.describe('Default user logged', () => {
    test('should not be able to register with user logged', async ({ page }) => {
      const defaultUser = await orchestrator.createUser({
        username: 'defaultuser',
        email: 'email_default_user@gmail.com',
        password: 'password_default_user',
      });
      await orchestrator.activateUser(defaultUser);

      let homePage = new HomePage(page);
      await homePage.goLogin();

      const loginPage = new LoginPage(page);
      await loginPage.makeLoginUserDefault('email_default_user@gmail.com', 'password_default_user');

      homePage = new HomePage(page);
      await expect(homePage.registerButton).toHaveCount(0);
    });
  });
});
