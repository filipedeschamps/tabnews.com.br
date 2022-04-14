class CadastroPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameSelector = '#username';
    this.emailSelector = '#email';
    this.password = '#password';
    this.submitButton = 'button[type="submit"]';
    this.registerSuccessSelector = '#register-success-msg';
  }

  async navigate() {
    await this.page.goto('/cadastro');
  }

  async fillCadastroFormAndSubmit(user) {
    await this.page.fill(this.usernameSelector, user.username);
    await this.page.fill(this.emailSelector, user.email);
    await this.page.fill(this.password, user.password);

    await this.page.click(this.submitButton);
    await this.page.waitForSelector(this.registerSuccessSelector);
  }
}

module.exports = CadastroPage;
