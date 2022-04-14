class LoginPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.emailSelector = '#email';
    this.password = '#password';
    this.loginButtonSelector = 'button[type="submit"]';
    this.successMessageSelector = '#login-success-msg';
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async fillLoginFormAndSubmit(user) {
    await this.page.fill(this.emailSelector, user.email);
    await this.page.fill(this.password, user.password);

    await this.page.click(this.loginButtonSelector);
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = LoginPage;
