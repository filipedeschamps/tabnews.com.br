exports.RecentPage = class RecentPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async getTitle() {
    const publishTab = this.page.locator('a', { hasText: 'Publicações' });
    await publishTab.waitFor({ state: 'visible' });

    return this.page.title();
  }
};
