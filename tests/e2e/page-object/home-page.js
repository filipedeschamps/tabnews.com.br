exports.HomePage = class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.recentTab = this.page.locator('a[data-test-id=recents]');

    this.buttonLogin = this.page.locator('a[data-test-id=login]');
    this.buttonRegister = this.page.locator('a[data-test-id=register]');

    this.buttonUserMenu = this.page.locator("button[aria-label='Abrir o menu']");
    this.buttonRegisterHeader = this.page.locator('a[data-test-id=publish]');
  }

  async getTitle() {
    const title = this.page.getByLabel('Relevantes');
    await title.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async goLogin() {
    await this.buttonLogin.click();
  }

  async goRegister() {
    await this.buttonRegister.click();
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
