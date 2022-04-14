class MailCatcherPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.searchSelector = 'input[type=search]';
    this.emailSourceSelector = '#message > header > nav > ul > li.format.tab.source > a';
    this.emailBodySelector = 'body > pre';
  }

  async navigateToActivationLink(user) {
    await this.page.goto('http://localhost:1080/');
    await this.page.fill(this.searchSelector, user.email);
    await this.page.press(this.searchSelector, 'Enter');
    await this.page.click(`text=${user.email}`);

    const emailContentUrl = await this.page.evaluate(() => document.querySelector('#message > iframe').src);
    await this.page.goto(emailContentUrl);

    const emailContent = await this.page.textContent(this.emailBodySelector);
    const activationLink = await emailContent.match(/\bhttp:.*localhost.*cadastro.ativar.*/);
    await this.page.goto(activationLink[0]);
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = MailCatcherPage;
