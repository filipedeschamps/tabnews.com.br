import { v4 as uuidV4 } from 'uuid';

import prestige from 'models/prestige';

describe('prestige model', () => {
  describe('getByContentId', () => {
    it('should call database.query', async () => {
      const contentId = 'content_id';
      const transaction = null;
      const database = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      await prestige.getByContentId(contentId, { transaction, database });

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.any(String),
          values: [contentId],
        },
        { transaction }
      );
    });

    it('should return 0 and 0 for a content ID not found', async () => {
      const database = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      const result = await prestige.getByContentId('content_id', { database });

      expect(result.initialTabcoins).toBe(0);
      expect(result.totalTabcoins).toBe(0);
    });

    it('should return the initial and total tabcoins for a "root" content', async () => {
      const database = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { type: 'create:content:text_root', amount: 2 },
            { type: 'other_type', amount: 1 },
            { type: 'other_type', amount: 1 },
            { type: 'other_type', amount: -1 },
          ],
        }),
      };

      const result = await prestige.getByContentId('content_id', { database });

      expect(result.initialTabcoins).toBe(2);
      expect(result.totalTabcoins).toBe(3);
    });

    it('should return the initial and total tabcoins for a "child" content', async () => {
      const database = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { type: 'create:content:text_child', amount: 3 },
            { type: 'other_type', amount: -1 },
            { type: 'other_type', amount: 1 },
            { type: 'other_type', amount: 1 },
            { type: 'other_type', amount: 1 },
          ],
        }),
      };

      const result = await prestige.getByContentId('content_id', { database });

      expect(result.initialTabcoins).toBe(3);
      expect(result.totalTabcoins).toBe(5);
    });

    it('should return initial equal to 0 if there is no initial tabcoin', async () => {
      const database = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { type: 'other_type', amount: 1 },
            { type: 'other_type', amount: -1 },
            { type: 'other_type', amount: 1 },
          ],
        }),
      };

      const result = await prestige.getByContentId('content_id', { database });

      expect(result.initialTabcoins).toBe(0);
      expect(result.totalTabcoins).toBe(1);
    });
  });

  describe('getByUserId', () => {
    it('should call database.query', async () => {
      const userId = uuidV4();
      const timeOffset = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
      const isRoot = true;
      const limit = 10;
      const offset = 3;
      const transaction = null;
      const database = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      await prestige.getByUserId(userId, { timeOffset, isRoot, limit, transaction, database });

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.any(String),
          values: [userId, timeOffset, isRoot, limit, offset],
        },
        { transaction }
      );
    });

    it('should return 0 when there are no rows', async () => {
      const userId = uuidV4();
      const timeOffset = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
      const isRoot = true;
      const limit = 10;
      const transaction = null;
      const database = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      const result = await prestige.getByUserId(userId, { timeOffset, isRoot, limit, transaction, database });

      expect(result).toBe(0);
    });

    it('should return the correct prestige level for root contents', async () => {
      const userId = 1;
      const timeOffset = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
      const isRoot = true;
      const limit = 10;
      const transaction = null;
      const database = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { tabcoins: 1 },
            { tabcoins: 2 },
            { tabcoins: 3 },
            { tabcoins: 4 },
            { tabcoins: 5 },
            { tabcoins: 6 },
            { tabcoins: 7 },
            { tabcoins: 8 },
            { tabcoins: 9 },
            { tabcoins: 10 },
          ],
        }),
      };

      const result = await prestige.getByUserId(userId, { timeOffset, isRoot, limit, transaction, database });

      expect(result).toBe(11);
    });

    it('should return the correct prestige level for child contents', async () => {
      const userId = 1;
      const timeOffset = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
      const isRoot = false;
      const limit = 10;
      const transaction = null;
      const database = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { tabcoins: 8 },
            { tabcoins: 7 },
            { tabcoins: 6 },
            { tabcoins: 5 },
            { tabcoins: 4 },
            { tabcoins: 3 },
            { tabcoins: 2 },
            { tabcoins: 1 },
          ],
        }),
      };

      const result = await prestige.getByUserId(userId, { timeOffset, isRoot, limit, transaction, database });

      expect(result).toBe(10);
    });
  });

  describe('calcTabcoinsAverage', () => {
    const cases = [
      // [tabcoins[], average]
      [[], 1], // default value
      [[1], 1],
      [[0], 0],
      [[0, 0], 0],
      [[1, 2, 3, 4], 2.5],
      [[-1, 5], 2],
      [[-2, -7, -4], -13 / 3],
    ];

    test.each(cases)('given %p values, returns mean %d', (array, expected) => {
      const tabcoinsObjectArray = array.map((tabcoins) => ({ tabcoins }));

      expect(prestige.calcTabcoinsAverage(tabcoinsObjectArray)).toBe(expected);
    });
  });

  describe('calcPrestigeLevel', () => {
    const cases = [
      // isRoot, tabcoinsMean, prestigeLevel
      [true, -1, -1],
      [true, 0.5, -1],
      [true, 0.51, 0],
      [true, 1.1, 0],
      [true, 1.11, 1],
      [true, 1.2, 1],
      [true, 1.21, 2],
      [true, 1.3, 2],
      [true, 1.31, 3],
      [true, 1.4, 3],
      [true, 1.41, 4],
      [true, 1.6, 4],
      [true, 1.61, 5],
      [true, 1.8, 5],
      [true, 1.81, 6],
      [true, 2.1, 6],
      [true, 2.11, 7],
      [true, 2.4, 7],
      [true, 2.41, 8],
      [true, 3, 8],
      [true, 3.1, 9],
      [true, 4, 9],
      [true, 4.1, 10],

      [false, -1, -1],
      [false, 0.4, -1],
      [false, 0.41, 0],
      [false, 1.0, 0],
      [false, 1.01, 1],
      [false, 1.1, 1],
      [false, 1.11, 2],
      [false, 1.2, 2],
      [false, 1.21, 3],
      [false, 1.25, 3],
      [false, 1.26, 4],
      [false, 1.3, 4],
      [false, 1.31, 5],
      [false, 1.5, 5],
      [false, 1.51, 6],
      [false, 1.7, 6],
      [false, 1.71, 7],
      [false, 2.0, 7],
      [false, 2.01, 8],
      [false, 3, 8],
      [false, 3.1, 9],
      [false, 4, 9],
      [false, 4.1, 10],
    ];

    test.each(cases)('given isRoot %p and mean equal to %d, returns prestige %d', (isRoot, tabcoins, expected) => {
      expect(prestige.calcPrestigeLevel(tabcoins, isRoot)).toBe(expected);
    });
  });
});
