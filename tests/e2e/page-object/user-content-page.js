exports.UserContentPage = class UserContentPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} contentTitle
   */
  constructor(page, contentTitle) {
    this.page = page;
    this.contentTitle = contentTitle;
  }

  async getContentTitle() {
    const contentTitle = this.page.getByRole('heading', { name: this.contentTitle });
    await contentTitle.waitFor({ state: 'visible' });

    return contentTitle;
  }

  async deleteContent() {
    const buttonEditContent = this.page.locator('button[aria-label="Editar conteúdo"]');
    await buttonEditContent.waitFor({ state: 'visible' });
    await buttonEditContent.click();

    await this.page.locator('ul[role="menu"] li[data-variant="danger"]').click();
    await this.page.locator('button', { hasText: 'Sim' }).click();
  }
};
