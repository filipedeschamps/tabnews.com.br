exports.UserPostPage = class UserPostPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} postTitle
   */
  constructor(page, postTitle) {
    this.page = page;
    this.postTitle = postTitle;
  }

  async getPostTitle() {
    const postTitle = this.page.getByRole('heading', { name: this.postTitle });
    await postTitle.waitFor({ state: 'visible' });

    return postTitle;
  }

  async deletePost() {
    const buttonEditContent = this.page.locator('button[aria-label="Editar conteúdo"]');
    await buttonEditContent.waitFor({ state: 'visible' });
    await buttonEditContent.click();

    await this.page.locator('ul[role="menu"] li[data-variant="danger"]').click();
    await this.page.locator('button', { hasText: 'Sim' }).click();
  }
};
