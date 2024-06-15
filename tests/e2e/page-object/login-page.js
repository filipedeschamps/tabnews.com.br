const { HomePage } = require('./home-page');

exports.LoginPage = class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.buttonLogin = this.page.locator('button[type=submit]');
  }

  async goToPage() {
    await this.page.goto('/');

    const homePage = new HomePage(this.page);
    await homePage.goLogin();
  }

  async makeLoginUserDefault(email, password, validDetached = true) {
    await this.fillField('email', email);
    await this.fillField('password', password);

    await this.makeLogin(validDetached);
  }

  async fillField(id, value) {
    await this.page.locator(`#${id}`).fill(value);
  }

  async makeLogin(validDetached = true) {
    await this.buttonLogin.click();
    if (validDetached) {
      await this.buttonLogin.waitFor({ state: 'detached' });
    }
  }

  async getGlobalErrorMessage() {
    return await this.page.locator('div[data-test-id=global-error-message]').textContent();
  }
};
