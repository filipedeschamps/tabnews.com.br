import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';

test.beforeAll('Running orchestrator', async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

test.beforeEach('Navigating for login page', async ({ page }) => {
  let loginPage = new LoginPage(page);
  await loginPage.goToPage();
});

test.describe('Login user', () => {
  test('should not be able to login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.fill('email', 'email_not_exist@gmail.com');
    await loginPage.fill('password', 'password_invalid');
    await loginPage.clickLoginButton(false);

    let expectedMessage = await loginPage.getGlobalErrorMessage();
    expect(expectedMessage).toContain('Dados não conferem. Verifique se os dados enviados estão corretos.');
  });

  test('should be able to login', async ({ page }) => {
    const defaultUser = await orchestrator.createUser({
      username: 'defaultuser',
      email: 'email_default_user@gmail.com',
      password: 'password_default_user',
    });
    await orchestrator.activateUser(defaultUser);

    const loginPage = new LoginPage(page);
    await loginPage.fill('email', 'email_default_user@gmail.com');
    await loginPage.fill('password', 'password_default_user');
    await loginPage.clickLoginButton();

    const homePage = new HomePage(page);
    let username = await homePage.getUserLogged();
    expect(username).toBe('defaultuser');
  });
});
