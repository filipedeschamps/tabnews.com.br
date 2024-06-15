import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { RegisterConfirmPage } from './page-object/register-confirm-page';
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
    test('should be able to register, validate email and log in', async ({ page }) => {
      let homePage = new HomePage(page);

      const titleHome = 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia';
      let title = await homePage.getTitle();
      await expect(title).toBe(titleHome);

      await homePage.goRegister();

      const registerPage = new RegisterPage(page);
      title = await registerPage.getTitle();
      await expect(title).toBe('Cadastro · TabNews');

      await registerPage.register('e2etests', 'e2e_tests@playwright.com', 'e2e_tests');

      const registerConfirmPage = new RegisterConfirmPage(page);
      let message = await registerConfirmPage.getMessage();
      expect(message).toContain('Confira seu e-mail: e2e_tests@playwright.com');
      expect(message).toContain('Você receberá um link para confirmar seu cadastro e ativar a sua conta.');

      await registerConfirmPage.goLogin();

      const loginPage = new LoginPage(page);
      await loginPage.login('e2e_tests@playwright.com', 'e2e_tests', false);

      let expectedMessage = await loginPage.getGlobalErrorMessage();
      expect(expectedMessage).toContain(
        'O seu usuário ainda não está ativado. Verifique seu email, pois acabamos de enviar um novo convite de ativação.',
      );

      const user = await orchestrator.findUserByEmail('e2e_tests@playwright.com');
      await orchestrator.activateUser(user);

      await loginPage.login('e2e_tests@playwright.com', 'e2e_tests');

      homePage = new HomePage(page);
      let usernameUserLogged = await homePage.getUserLogged();
      expect(usernameUserLogged).toBe('e2etests');
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

      const loginPage = new LoginPage(page);
      await loginPage.goToPage();
      await loginPage.login('email_default_user@gmail.com', 'password_default_user');

      const homePage = new HomePage(page);
      await expect(homePage.buttonRegister).toHaveCount(0);
    });
  });
});
