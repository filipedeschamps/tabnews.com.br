exports.LoginPage = class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async getTitle() {
    const title = this.page.getByRole('heading', { name: 'Login' });
    await title.waitFor({ state: 'visible' });

    return await this.page.title();
  }

  async makeLoginUserDefault(email, password) {
    await this.fillField('email', email);
    await this.fillField('password', password);

    await this.makeLogin();
  }

  async fillField(id, value) {
    await this.page.locator(`#${id}`).fill(value);
  }

  async makeLogin() {
    let buttonLogin = this.page.locator('button[type=submit]');
    await buttonLogin.click();
    await buttonLogin.waitFor({ state: 'detached' });
  }
};
