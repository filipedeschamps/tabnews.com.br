import { expect, test } from '@playwright/test';

import orchestrator from 'tests/orchestrator';

import { HomePage } from './page-object/home-page';
import { LoginPage } from './page-object/login-page';
import { PublishContentPage } from './page-object/publish-content-page';
import { UserPostPage } from './page-object/user-post-page';

test.beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  const defaultUser = await orchestrator.createUser({
    username: 'defaultuser',
    email: 'emaildefaultuser@gmail.com',
    password: 'passworddefaultuser',
  });
  await orchestrator.activateUser(defaultUser);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');

  const homePage = new HomePage(page);
  await homePage.goLogin();

  const loginPage = new LoginPage(page);
  await loginPage.makeLoginUserDefault('emaildefaultuser@gmail.com', 'passworddefaultuser');
});

test('should can be to publish content by header', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goPublishContent();

  let publishContentPage = new PublishContentPage(page);
  const title = await publishContentPage.getTitle();
  expect(title).toBe('Publicar novo conteúdo · TabNews');

  const postTitleExpected = 'Publicação realizada por usuário padrão vindo pela header';
  await publishContentPage.publish(postTitleExpected, 'body de conteúdo '.repeat(50));

  const userPostPage = new UserPostPage(page, postTitleExpected);
  let postTitle = await userPostPage.getPostTitle();
  await expect(postTitle).toHaveText(postTitleExpected);
});

test('should can be to publish content by menu', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goPublishContent(false);

  let publishContentPage = new PublishContentPage(page);
  const title = await publishContentPage.getTitle();
  expect(title).toBe('Publicar novo conteúdo · TabNews');

  const postTitleExpected = 'Publicação realizada por usuário padrão vindo pela menu do usuário';
  await publishContentPage.publish(postTitleExpected, 'body de conteúdo '.repeat(50));

  const userPostPage = new UserPostPage(page, postTitleExpected);
  let postTitle = await userPostPage.getPostTitle();
  await expect(postTitle).toHaveText(postTitleExpected);
});
