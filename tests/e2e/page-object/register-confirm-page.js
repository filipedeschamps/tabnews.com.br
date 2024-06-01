exports.RegisterConfirmPage = class RegisterConfirmPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.buttonLogin = this.page.locator('a[data-test-id=login]');
  }

  async getMessage() {
    return this.page.locator('main > div').textContent();
  }

  async goLogin() {
    await this.buttonLogin.click();
  }
};
