import { defaultTabCashForAdCreation } from 'tests/constants-for-tests';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe('GET /api/v1/sponsored-beta', () => {
  describe('Anonymous user', () => {
    const adsRequestBuilder = new RequestBuilder('/api/v1/sponsored-beta');
    let owner;

    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
      owner = await orchestrator.createUser();

      orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: owner.id,
        amount: 100 * defaultTabCashForAdCreation,
      });
    });

    it('should never get default content', async () => {
      await orchestrator.createContent({
        owner_id: owner.id,
        title: 'Content',
        status: 'published',
        type: 'content',
      });

      const { response, responseBody } = await adsRequestBuilder.get();

      expect.soft(response.status).toBe(200);
      expect(responseBody).toEqual([]);
    });

    it('should never get unpublished ad', async () => {
      await orchestrator.createContent({
        owner_id: owner.id,
        title: 'Draft Ad',
        status: 'draft',
        type: 'ad',
      });

      const deletedAd = await orchestrator.createContent({
        owner_id: owner.id,
        title: 'Deleted Ad',
        status: 'published',
        type: 'ad',
      });

      await orchestrator.updateContent(deletedAd.id, { status: 'deleted' });

      const { response, responseBody } = await adsRequestBuilder.get();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual([]);
    });

    it('should return ads', async () => {
      const createdAds = await createAds(4, owner);

      const { response, responseBody } = await adsRequestBuilder.get();

      expect.soft(response.status).toBe(200);

      expect(createdAds).toContainEqual(responseBody[0]);
      expect(createdAds).toContainEqual(responseBody[1]);
      expect(createdAds).toContainEqual(responseBody[2]);
      expect(createdAds).toContainEqual(responseBody[3]);
    });

    it('should limit the number of ads returned', async () => {
      const createdAds = await createAds(3, owner);

      const { response, responseBody } = await adsRequestBuilder.get('?per_page=2');

      expect.soft(response.status).toBe(200);
      expect.soft(responseBody).toHaveLength(2);

      expect(createdAds).toContainEqual(responseBody[0]);
      expect(createdAds).toContainEqual(responseBody[1]);
    });
  });
});

async function createAds(count, owner) {
  const ads = [];
  for (let i = 0; i < count; i++) {
    const ad = await orchestrator.createContent({
      owner_id: owner.id,
      title: `Ad #${i}`,
      status: 'published',
      type: 'ad',
    });

    ads.push({
      id: ad.id,
      title: ad.title,
      slug: ad.slug,
      owner_username: owner.username,
      source_url: ad.source_url,
      type: 'markdown',
    });
  }

  return ads;
}
