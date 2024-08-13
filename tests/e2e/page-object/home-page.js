exports.HomePage = class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.buttonLogin = this.page.getByLabel('Login');
    this.buttonUserMenu = this.page.getByLabel('Abrir o menu');
  }

  async goLogin() {
    await this.buttonLogin.click();
  }

  async getUserLogged() {
    await this.buttonUserMenu.click();
    return await this.page.textContent("ul[role='menu'] li:first-child > a > div > span > div");
  }
};
