import { afterEach } from 'vitest';

import notification, { create, setLastCleanupAt } from 'models/notification';

const mocks = vi.hoisted(() => {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
});

vi.mock('infra/database', () => {
  return {
    default: {
      query: mocks.query,
      transaction: vi.fn().mockResolvedValue({
        query: mocks.query,
        release: mocks.release,
      }),
      errorCodes: {
        SERIALIZATION_FAILURE: '40001',
      },
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Notification model operations Database', () => {
  describe('create', () => {
    it('should call database.query with correct parameters', async () => {
      const mockData = {
        user_id: 1,
        type: 'reply',
        entity_id: 2,
        content_link: 'http://example.com',
        message: 'Test message',
      };
      mocks.query.mockResolvedValue({ rows: [mockData] });

      await create(mockData);

      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][0]).toContain('DELETE FROM notifications');
      expect(calls[1][0].text.replaceAll(/\s+/g, ' ')).toContain('INSERT INTO notifications');
      expect(calls[1][0].values).toStrictEqual([1, 'reply', 2, 'http://example.com', 'Test message']);
    });

    it('should call database.query with correct parameters with delete in cache', async () => {
      const mockData = {
        user_id: 1,
        type: 'reply',
        entity_id: 2,
        content_link: 'http://example.com',
        message: 'Test message',
      };
      mocks.query.mockResolvedValue({ rows: [mockData] });

      setLastCleanupAt(Date.now());
      await create(mockData);

      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain('INSERT INTO notifications');
      expect(calls[0][0].values).toStrictEqual([1, 'reply', 2, 'http://example.com', 'Test message']);
    });
  });
  describe('read', () => {
    it('should call database.query with correct parameters', async () => {
      // Arrange
      const mockNotificationId = 1;
      const mockUserId = 1;

      // Act
      await notification.read(mockNotificationId, mockUserId);

      // Assert
      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain('UPDATE notifications SET is_read = TRUE');
      expect(calls[0][0].values).toStrictEqual([mockNotificationId, mockUserId]);
    });
  });
  describe('markAllAsRead', () => {
    it('should call database.query with correct parameters', async () => {
      // Arrange
      const mockUserId = 1;

      // Act
      await notification.markAllAsRead(mockUserId);

      // Assert
      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain('UPDATE notifications SET is_read = TRUE');
      expect(calls[0][0].values).toStrictEqual([mockUserId]);
    });
  });

  describe('count', () => {
    it('should call database.query with correct parameters', async () => {
      // Arrange
      const mockWhere = { user_id: 1, is_read: false };
      mocks.query.mockResolvedValue({ rows: [{ count: '3' }] });

      // Act
      await notification.count({ where: mockWhere });

      // Assert
      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain(
        'SELECT COUNT(1) FROM notifications WHERE user_id = $1 AND is_read = $2',
      );
      expect(calls[0][0].values).toStrictEqual([1, false]);
    });
  });

  describe('findAll', () => {
    it('should call database.query with correct parameters', async () => {
      // Arrange
      const mockWhere = { user_id: 1 };
      const mockOptions = { limit: 10, offset: 0 };
      mocks.query.mockResolvedValue({ rows: [] });

      // Act
      await notification.findAll({ where: mockWhere }, mockOptions);

      // Assert
      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT $2 OFFSET $3',
      );
      expect(calls[0][0].values).toStrictEqual([1, 10, 0]);
    });

    it('should call database.query without where', async () => {
      // Arrange
      const mockOptions = { limit: 10, offset: 0 };
      mocks.query.mockResolvedValue({ rows: [] });

      // Act
      await notification.findAll({}, mockOptions);

      // Assert
      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain(
        'SELECT * FROM notifications ORDER BY is_read ASC, created_at DESC LIMIT $1 OFFSET $2',
      );
      expect(calls[0][0].values).toStrictEqual([10, 0]);
    });

    it('should call database.query without limit and offset', async () => {
      // Arrange
      const mockWhere = { user_id: 1 };
      mocks.query.mockResolvedValue({ rows: [] });

      // Act
      await notification.findAll({ where: mockWhere });

      // Assert
      const calls = mocks.query.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].text.replaceAll(/\s+/g, ' ')).toContain(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT $2 OFFSET $3',
      );
      expect(calls[0][0].values).toStrictEqual([1, 5, 0]);
    });
  });
});
