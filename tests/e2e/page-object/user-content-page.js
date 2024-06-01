exports.UserContentPage = class UserContentPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} contentTitle
   */
  constructor(page, contentTitle) {
    this.page = page;
    this.contentTitle = contentTitle;

    this.buttonEditContent = this.page.locator('button[aria-label="Editar conteúdo"]');
  }

  async getContentTitle() {
    const contentTitle = this.page.getByRole('heading', { name: this.contentTitle });
    await contentTitle.waitFor({ state: 'visible' });

    return contentTitle;
  }

  async deleteContent() {
    this.buttonEditContent.waitFor({ state: 'visible' });
    this.buttonEditContent.click();

    await this.page.locator('ul[role="menu"] li[data-variant="danger"]').click();
    await this.page.locator('button', { hasText: 'Sim' }).click();
  }
};
