exports.RegisterPage = class RegisterPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.buttonRegister = this.page.locator('button[type=submit]');
  }

  async getTitle() {
    const title = this.page.getByRole('heading', { name: 'Cadastro' });
    await title.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async makeRegisterUserDefault(username, email, password) {
    await this.fillField('name', username);
    await this.fillField('email', email);
    await this.fillField('password', password);
    await this.page.locator('input[data-test-id=terms-accepted]').check();

    await this.buttonRegister.click();
    await this.buttonRegister.waitFor({ state: 'detached' });
  }

  async fillField(id, value) {
    await this.page.locator(`#${id}`).fill(value);
  }
};
