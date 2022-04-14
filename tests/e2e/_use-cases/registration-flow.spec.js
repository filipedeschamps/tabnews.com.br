// import { expect, test } from '@playwright/test';

const { expect, test } = require('@playwright/test');
const CadastroPage = require('../pages/cadastroPage');
const MailCatcherPage = require('../pages/mailCatcherPage');
const LoginPage = require('../pages/loginPage');

test('Should create a new user and Log In', async ({ page }) => {
  const random = `${Date.now()}${Math.floor(Math.random() * 10)}`;

  const newUser = {
    username: `user${random}`,
    email: `user${random}@tabnews.com.br`,
    password: 'super-easy-password',
  };

  const cadastroPage = new CadastroPage(page);
  const mailCatcherPage = new MailCatcherPage(page);
  const loginPage = new LoginPage(page);

  await test.step('Navigate to the Cadastro Page and Submits the Register form', async () => {
    await cadastroPage.navigate();
    await expect(page.locator(cadastroPage.usernameSelector)).toBeVisible();

    await cadastroPage.fillCadastroFormAndSubmit(newUser);

    const isFormVisible = await page.isVisible('form');
    await expect(isFormVisible).toBeFalsy();

    const isCheckYourEmailMsgVisible = await page.isVisible(`text=${newUser.email}`);
    await expect(isCheckYourEmailMsgVisible).toBeTruthy();
  });

  await test.step('Confirm and Activate the User Account', async () => {
    await mailCatcherPage.navigateToActivationLink(newUser);
  });

  await test.step('Log in TabNews', async () => {
    await loginPage.navigate();
    await loginPage.fillLoginFormAndSubmit(newUser);

    await expect(page).toHaveURL('/login/sucesso');
    const isSuccessMessageVisible = await page.isVisible(loginPage.successMessageSelector);
  });
});
