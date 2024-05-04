exports.RegisterPage = class RegisterPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async getTitle() {
    const title = this.page.getByRole('heading', { name: 'Cadastro' });
    await title.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async fillField(id, value) {
    await this.page.locator(`#${id}`).fill(value);
  }
};
