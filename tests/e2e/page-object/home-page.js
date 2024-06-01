exports.HomePage = class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.loginButton = this.page.locator('#header').getByText('Login');
    this.registerButton = this.page.locator('#header').getByText('Cadastrar');

    this.recentTab = this.page.locator('a', { hasText: 'Recentes' });

    this.buttonRegisterHeader = this.page.locator("a[href='/publicar']");
    this.buttonUserMenu = this.page.locator("button[aria-label='Abrir o menu']");
  }

  async getTitle() {
    const title = this.page.getByRole('heading', { name: 'Nenhum conteúdo encontrado' });
    await title.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async goLogin() {
    await this.loginButton.click();
  }

  async goRegister() {
    await this.registerButton.click();
  }

  async goRecentTab() {
    await this.recentTab.click();
  }

  async getUserLogged() {
    await this.page.locator("button[aria-label='Abrir o menu']").click();
    return await this.page.textContent("ul[role='menu'] li:first-child > a > div > span > div");
  }

  async goPublishContent(fromHeader = true) {
    if (fromHeader) {
      await this.buttonRegisterHeader.click();
    } else {
      await this.buttonUserMenu.click();
      await this.page.locator("ul[role='menu'] a[href='/publicar']").click();
    }
  }
};
