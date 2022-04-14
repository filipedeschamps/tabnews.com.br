// import { expect, test } from '@playwright/test';

const { expect, test } = require('@playwright/test');
const CadastroPage = require('../pages/cadastroPage');

test('Should create a new user', async ({ page }) => {
  const newUser = {
    username: 'test-automation',
    email: 'testautomation@tabnews.com.br',
    password: 'super-easy-password',
  };

  const cadastroPage = new CadastroPage(page);

  await test.step('Navigate to the Cadastro Page', async () => {
    await cadastroPage.navigate();
    await expect(page.locator(cadastroPage.usernameSelector)).toBeVisible();

    await cadastroPage.fillCadastroFormAndSubmit(newUser);
  });
});
