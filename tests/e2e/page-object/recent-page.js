exports.RecentPage = class RecentPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.relevantTab = this.page.locator('a[data-test-id=relevants]');
  }

  async getTitle() {
    const publishTab = this.page.locator('a', { hasText: 'Publicações' });
    await publishTab.waitFor({ state: 'visible' });

    return this.page.title();
  }

  async goRelevantTab() {
    await this.relevantTab.click();
  }

  async getContents() {
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
