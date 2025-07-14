import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database.js';
import favorites from 'models/favorites/index.js';

vi.mock('infra/database.js');

describe('Favorites Model', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
  };

  const mockContent = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Content',
    slug: 'test-content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a favorite successfully', async () => {
      const favoriteData = {
        user_id: mockUser.id,
        content_id: mockContent.id,
      };

      const mockResult = {
        rows: [
          {
            id: 'favorite-123',
            user_id: mockUser.id,
            content_id: mockContent.id,
            created_at: new Date(),
          },
        ],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.create(favoriteData);

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('INSERT INTO favorites'),
          values: [mockUser.id, mockContent.id],
        },
        { transaction: undefined },
      );

      expect(result).toStrictEqual(mockResult.rows[0]);
    });

    it('should throw ValidationError when trying to create duplicate favorite', async () => {
      const favoriteData = {
        user_id: mockUser.id,
        content_id: mockContent.id,
      };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = '23505';

      database.query.mockRejectedValue(duplicateError);

      await expect(favorites.create(favoriteData)).rejects.toThrow(ValidationError);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        user_id: mockUser.id,
        // missing content_id
      };

      await expect(favorites.create(invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('remove', () => {
    it('should remove a favorite successfully', async () => {
      const mockResult = {
        rowCount: 1,
        rows: [
          {
            id: 'favorite-123',
            user_id: mockUser.id,
            content_id: mockContent.id,
          },
        ],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.remove(mockUser.id, mockContent.id);

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('DELETE FROM favorites'),
          values: [mockUser.id, mockContent.id],
        },
        { transaction: undefined },
      );

      expect(result).toStrictEqual(mockResult.rows[0]);
    });

    it('should throw NotFoundError when favorite does not exist', async () => {
      const mockResult = {
        rowCount: 0,
        rows: [],
      };

      database.query.mockResolvedValue(mockResult);

      await expect(favorites.remove(mockUser.id, mockContent.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByUser', () => {
    it('should find favorites by user with pagination', async () => {
      const mockResult = {
        rows: [
          {
            id: 'favorite-123',
            user_id: mockUser.id,
            content_id: mockContent.id,
            title: mockContent.title,
            slug: mockContent.slug,
            content_owner_username: 'contentowner',
            total_rows: 1,
          },
        ],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.findByUser(mockUser.id, { page: 1, per_page: 10 });

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('WITH favorite_window'),
          values: [mockUser.id, 10, 0],
        },
        { transaction: undefined },
      );

      expect(result).toStrictEqual(mockResult.rows);
    });

    it('should use default pagination values', async () => {
      const mockResult = { rows: [] };
      database.query.mockResolvedValue(mockResult);

      await favorites.findByUser(mockUser.id);

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('WITH favorite_window'),
          values: [mockUser.id, 30, 0], // default values from validator
        },
        { transaction: undefined },
      );
    });
  });

  describe('findByContent', () => {
    it('should find favorites by content with pagination', async () => {
      const mockResult = {
        rows: [
          {
            id: 'favorite-123',
            user_id: mockUser.id,
            content_id: mockContent.id,
            username: mockUser.username,
            total_rows: 1,
          },
        ],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.findByContent(mockContent.id, { page: 1, per_page: 10 });

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('WITH favorite_window'),
          values: [mockContent.id, 10, 0],
        },
        { transaction: undefined },
      );

      expect(result).toStrictEqual(mockResult.rows);
    });
  });

  describe('exists', () => {
    it('should return true when favorite exists', async () => {
      const mockResult = {
        rows: [{ exists: true }],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.exists(mockUser.id, mockContent.id);

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('SELECT EXISTS'),
          values: [mockUser.id, mockContent.id],
        },
        { transaction: undefined },
      );

      expect(result).toBe(true);
    });

    it('should return false when favorite does not exist', async () => {
      const mockResult = {
        rows: [{ exists: false }],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.exists(mockUser.id, mockContent.id);

      expect(result).toBe(false);
    });
  });

  describe('countByUser', () => {
    it('should return count of user favorites', async () => {
      const mockResult = {
        rows: [{ count: '5' }],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.countByUser(mockUser.id);

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('SELECT COUNT(*)'),
          values: [mockUser.id],
        },
        { transaction: undefined },
      );

      expect(result).toBe(5);
    });
  });

  describe('countByContent', () => {
    it('should return count of content favorites', async () => {
      const mockResult = {
        rows: [{ count: '3' }],
      };

      database.query.mockResolvedValue(mockResult);

      const result = await favorites.countByContent(mockContent.id);

      expect(database.query).toHaveBeenCalledWith(
        {
          text: expect.stringContaining('SELECT COUNT(*)'),
          values: [mockContent.id],
        },
        { transaction: undefined },
      );

      expect(result).toBe(3);
    });
  });
});