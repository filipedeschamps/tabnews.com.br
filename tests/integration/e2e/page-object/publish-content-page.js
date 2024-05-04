exports.PublishContentPage = class PublishContentPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async getTitle() {
    const title = this.page.getByRole('heading', { name: 'Publicar novo conteúdo' });
    await title.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async publish(title, content) {
    await this.fillField('title', title);
    await this.fillContent(content);

    await this.page.locator('button[type=submit]').click();
  }

  async fillField(id, value) {
    await this.page.locator(`#${id}`).fill(value);
  }

  async fillContent(value) {
    await this.page.locator('div').getByText('Corpo da publicação').press('Tab');
    await this.page.keyboard.type(value);
  }
};
