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
};
