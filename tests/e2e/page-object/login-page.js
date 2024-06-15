const { HomePage } = require('./home-page');

exports.LoginPage = class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.buttonLogin = this.page.locator('button[type=submit]');
  }

  async login(email, password, detachedLoginButton = true) {
    await this.fill('email', email);
    await this.fill('password', password);

    await this.clickLoginButton(detachedLoginButton);
  }

  async goToPage() {
    await this.page.goto('/');

    const homePage = new HomePage(this.page);
    await homePage.goLogin();
  }

  async fill(id, value) {
    await this.page.locator(`#${id}`).fill(value);
  }

  async clickLoginButton(detached = true) {
    await this.buttonLogin.click();

    if (detached) {
      await this.buttonLogin.waitFor({ state: 'detached' });
    }
  }

  async getGlobalErrorMessage() {
    return await this.page.locator('div[data-test-id=global-error-message]').textContent();
  }
};
