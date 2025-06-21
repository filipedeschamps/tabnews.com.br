import { randomUUID as uuidV4 } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import review from 'models/firewall/review';
import user from 'models/user';

const mocks = vi.hoisted(() => {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
});

vi.mock('models/user', () => ({
  default: {
    findAll: vi.fn(),
    addFeatures: vi.fn(),
  },
}));

function createOptions(users) {
  return {
    event: {
      metadata: {
        users: users || [uuidV4()],
      },
    },
    transaction: {
      query: mocks.query,
      release: mocks.release,
    },
  };
}

describe('review.unblockUsers()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add read:activation_token for user with empty features list', () => {
    const userId = uuidV4();
    const options = createOptions([userId]);

    user.findAll.mockResolvedValueOnce([{ id: userId, features: [] }]);
    user.addFeatures.mockImplementation((userIds, featuresToAdd) => {
      return userIds.map((id) => ({ id, features: featuresToAdd }));
    });

    return review.unblockUsers(options).then((result) => {
      expect(user.findAll).toHaveBeenCalledWith({ where: { id: [userId] } }, options);
      expect(user.addFeatures).toHaveBeenCalledWith([userId], ['read:activation_token'], {
        ...options,
        withBalance: true,
        ignoreUpdatedAt: true,
      });
      expect(result).toStrictEqual({
        users: [{ id: userId, features: ['read:activation_token'] }],
      });
    });
  });

  it('should add read:activation_token for user with only "nuked" feature', () => {
    const userId = uuidV4();
    const options = createOptions([userId]);

    user.findAll.mockResolvedValueOnce([{ id: userId, features: ['nuked'] }]);
    user.addFeatures.mockImplementation((userIds, featuresToAdd) => {
      return userIds.map((id) => ({ id, features: featuresToAdd }));
    });

    return review.unblockUsers(options).then((result) => {
      expect(user.findAll).toHaveBeenCalledWith({ where: { id: [userId] } }, options);
      expect(user.addFeatures).toHaveBeenCalledWith([userId], ['read:activation_token'], {
        ...options,
        withBalance: true,
        ignoreUpdatedAt: true,
      });
      expect(result).toStrictEqual({
        users: [{ id: userId, features: ['read:activation_token'] }],
      });
    });
  });

  it('should add create:session and read:session for user with non-nuked feature', () => {
    const userId = uuidV4();
    const options = createOptions([userId]);

    user.findAll.mockResolvedValueOnce([{ id: userId, features: ['read:session'] }]);
    user.addFeatures.mockImplementation((userIds, featuresToAdd) => {
      return userIds.map((id) => ({ id, features: featuresToAdd }));
    });

    return review.unblockUsers(options).then((result) => {
      expect(user.findAll).toHaveBeenCalledWith({ where: { id: [userId] } }, options);
      expect(user.addFeatures).toHaveBeenCalledWith([userId], ['create:session', 'read:session'], {
        ...options,
        withBalance: true,
        ignoreUpdatedAt: true,
      });
      expect(result).toStrictEqual({
        users: [{ id: userId, features: ['create:session', 'read:session'] }],
      });
    });
  });

  it('should add create:session and read:session for user with multiple features', () => {
    const userId = uuidV4();
    const options = createOptions([userId]);

    user.findAll.mockResolvedValueOnce([{ id: userId, features: ['read:session', 'create:session', 'other_feature'] }]);
    user.addFeatures.mockImplementation((userIds, featuresToAdd) => {
      return userIds.map((id) => ({
        id,
        features: [...featuresToAdd, 'other_feature'],
      }));
    });

    return review.unblockUsers(options).then((result) => {
      expect(user.findAll).toHaveBeenCalledWith({ where: { id: [userId] } }, options);
      expect(user.addFeatures).toHaveBeenCalledWith([userId], ['create:session', 'read:session'], {
        ...options,
        withBalance: true,
        ignoreUpdatedAt: true,
      });
      expect(result).toStrictEqual({
        users: [{ id: userId, features: ['create:session', 'read:session', 'other_feature'] }],
      });
    });
  });

  it('should add create:session and read:session for user with multiple features, including "nuked"', () => {
    const userId = uuidV4();
    const options = createOptions([userId]);

    user.findAll.mockResolvedValueOnce([{ id: userId, features: ['nuked', 'other_feature'] }]);
    user.addFeatures.mockImplementation((userIds, featuresToAdd) => {
      return userIds.map((id) => ({
        id,
        features: [...featuresToAdd, 'other_feature'],
      }));
    });

    return review.unblockUsers(options).then((result) => {
      expect(user.findAll).toHaveBeenCalledWith({ where: { id: [userId] } }, options);
      expect(user.addFeatures).toHaveBeenCalledWith([userId], ['create:session', 'read:session'], {
        ...options,
        withBalance: true,
        ignoreUpdatedAt: true,
      });
      expect(result).toStrictEqual({
        users: [{ id: userId, features: ['create:session', 'read:session', 'other_feature'] }],
      });
    });
  });

  it('should handle empty users list', () => {
    const options = createOptions([]);

    user.findAll.mockResolvedValueOnce([]);

    return review.unblockUsers(options).then((result) => {
      expect(user.findAll).toHaveBeenCalledWith({ where: { id: [] } }, options);
      expect(user.addFeatures).not.toHaveBeenCalled();
      expect(result).toStrictEqual({ users: [] });
    });
  });
});
