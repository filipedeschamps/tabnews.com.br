exports.RecentPage = class RecentPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.relevantTab = this.page.locator('header').locator('div', { hasText: 'Relevantes' }).nth(1);
  }

  async getTitle() {
    const publishTab = this.page.locator('a', { hasText: 'Publicações' });
    await publishTab.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async goRelevantTab() {
    await this.relevantTab.click();
  }

  async getPosts() {
    const publishTab = this.page.locator('a', { hasText: 'Publicações' });
    await publishTab.waitFor({ state: 'visible' });

    return this.page.locator('main ol li div > a');
  }

  async reload() {
    const publishTab = this.page.locator('a', { hasText: 'Publicações' });
    await publishTab.waitFor({ state: 'visible' });

    await this.page.reload();
  }
};
