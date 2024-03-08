import { v4 as uuidV4 } from 'uuid';

import database, { mockQuery, mockRelease } from 'infra/database';
import balance from 'models/balance';
import content from 'models/content';
import event from 'models/event';
import prestige from 'models/prestige';
import reward from 'models/reward';
import user from 'models/user';

const tabcoinsBase = 20;
const contentAgeBase = 1000 * 60 * 60 * 24 * 7; // one week in milliseconds

vi.mock('infra/database', () => {
  const mockQuery = vi.fn();
  const mockRelease = vi.fn();
  return {
    default: {
      transaction: vi.fn().mockResolvedValue({
        query: mockQuery,
        release: mockRelease,
      }),
      errorCodes: {
        SERIALIZATION_FAILURE: '40001',
      },
    },
    mockQuery,
    mockRelease,
  };
});

vi.mock('models/balance');

vi.mock('models/content', () => ({
  default: {
    findWithStrategy: vi.fn().mockResolvedValue({
      rows: [
        {
          created_at: new Date(),
        },
      ],
    }),
  },
}));

vi.mock('models/event', () => ({
  default: {
    create: vi.fn().mockResolvedValue({ id: uuidV4() }),
  },
}));

vi.mock('models/prestige', () => ({
  default: {
    getByUserId: vi.fn().mockResolvedValue(2),
  },
}));

vi.mock('models/user', () => ({
  default: {
    findOneById: vi.fn().mockResolvedValue({
      rewarded_at: new Date('2021-01-01'),
    }),
    updateRewardedAt: vi.fn(),
  },
}));

function createRequestObj(props = {}) {
  return {
    context: {
      user: {
        id: props.id ?? uuidV4(),
        username: props.username ?? 'testuser',
        tabcoins: props.tabcoins ?? 0,
        rewarded_at: props.rewarded_at ?? new Date('2021-01-01'),
      },
      clientIp: props.clientIp ?? '127.0.0.1',
    },
  };
}

describe('reward model', () => {
  it('Should not reward if "request" is undefined', async () => {
    let request;

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if "context" is undefined', async () => {
    const request = {};

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if "user" is undefined', async () => {
    const request = createRequestObj();
    request.context.user = undefined;

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if "tabcoins" is undefined', async () => {
    const request = createRequestObj();
    request.context.user.tabcoins = undefined;

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if "userId" is undefined', async () => {
    const request = createRequestObj();
    request.context.user.id = undefined;

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if "username" is undefined', async () => {
    const request = createRequestObj();
    request.context.user.username = undefined;

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if "rewarded_at" is undefined', async () => {
    const request = createRequestObj();
    request.context.user.rewarded_at = undefined;

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if user has already been rewarded today', async () => {
    const request = createRequestObj({
      rewarded_at: new Date().setUTCHours(0, 0, 0, 0),
    });

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not reward if user has already been rewarded now', async () => {
    const request = createRequestObj({
      rewarded_at: new Date(),
    });

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).not.toHaveBeenCalled();
  });

  it('Should not simultaneously reward', async () => {
    // First "rewarded_at" is in the past (2021-01-01).
    const request = createRequestObj();
    // Then "rewarded_at" is set to "now" to simulate a concurrent reward.
    user.findOneById.mockResolvedValueOnce({ rewarded_at: new Date() });

    const result = await reward(request);

    expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mockRelease).toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('Should not reward if tabcoinsFactor is greater than prestigeFactor', async () => {
    const request = createRequestObj({
      tabcoins: tabcoinsBase + 1,
    });
    prestige.getByUserId.mockResolvedValueOnce(1);

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).toHaveBeenCalledWith(request.context.user.id, { transaction: expect.any(Object) });
  });

  it('Should not reward if tabcoinsFactor is equal to prestigeFactor', async () => {
    const request = createRequestObj({
      tabcoins: tabcoinsBase,
    });
    prestige.getByUserId.mockResolvedValueOnce(1);

    const result = await reward(request);

    expect(result).toBe(0);
    expect(balance.create).not.toHaveBeenCalled();
    expect(user.updateRewardedAt).toHaveBeenCalledWith(request.context.user.id, { transaction: expect.any(Object) });
  });

  it('Should reward if tabcoinsFactor is less than prestigeFactor', async () => {
    const request = createRequestObj({
      tabcoins: tabcoinsBase - 1,
    });
    prestige.getByUserId.mockResolvedValueOnce(1);

    const result = await reward(request);

    expect(result).toBeGreaterThan(0);

    expect(database.transaction).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockQuery).toHaveBeenCalledWith('COMMIT');
    expect(mockRelease).toHaveBeenCalled();
    expect(user.updateRewardedAt).toHaveBeenCalledWith(request.context.user.id, { transaction: expect.any(Object) });

    expect(balance.create).toHaveBeenCalledWith(
      {
        amount: result,
        balanceType: 'user:tabcoin',
        originatorId: expect.any(String),
        originatorType: 'event',
        recipientId: request.context.user.id,
      },
      { transaction: expect.any(Object) },
    );
    expect(event.create).toHaveBeenCalledWith(
      {
        metadata: {
          amount: result,
          reward_type: 'daily',
        },
        originatorIp: request.context.clientIp,
        originatorUserId: request.context.user.id,
        type: 'reward:user:tabcoins',
      },
      { transaction: expect.any(Object) },
    );
  });

  describe('Reward correct values', () => {
    const cases = [
      // [ contentAge, tabcoins, prestige, reward ]
      [0, 0, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 2, 2],
      [0, 0, 3, 3],
      [0, 0, tabcoinsBase, tabcoinsBase],
      [0, 0, tabcoinsBase * 2, tabcoinsBase * 2],
      [0, tabcoinsBase - 1, 0, 0],
      [0, tabcoinsBase - 1, 1, 1],
      [0, tabcoinsBase - 1, 2, 2],
      [0, tabcoinsBase, 1, 0],
      [0, tabcoinsBase, 2, 1],
      [0, tabcoinsBase, 3, 2],
      [0, tabcoinsBase * 2 - 1, 3, 0],
      [0, tabcoinsBase * 2 - 1, 4, 1],
      [0, tabcoinsBase * 2, 4, 0],
      [0, tabcoinsBase * 2, 5, 1],
      [0, tabcoinsBase * 3, 9, 0],
      [0, tabcoinsBase * 3, 10, 1],

      [1, 0, 0, 0],
      [1, 0, 1, 1],
      [1, 0, 2, 1],
      [1, 0, 3, 2],
      [1, 0, 4, 2],
      [1, 0, 5, 3],

      [1, tabcoinsBase - 1, 0, 0],
      [1, tabcoinsBase - 1, 1, 1],
      [1, tabcoinsBase - 1, 2, 1],
      [1, tabcoinsBase - 1, 3, 2],
      [1, tabcoinsBase, 1, 0],
      [1, tabcoinsBase, 2, 1],
      [1, tabcoinsBase, 3, 1],
      [1, tabcoinsBase, 4, 2],

      [2, 0, 0, 0],
      [2, 0, 1, 1],
      [2, 0, 3, 1],
      [2, 0, 4, 2],
      [2, 0, 6, 2],
      [2, 0, 7, 3],

      [365, 0, 1, 1],
      [365, tabcoinsBase, 2, 1],
    ];

    test.each(cases)(
      'With content age %d, user tabcoins %d and prestige %d, should return %d',
      async (contentAge, tabcoins, userPrestige, expected) => {
        const request = createRequestObj({ tabcoins });
        prestige.getByUserId.mockResolvedValueOnce(userPrestige);
        content.findWithStrategy.mockResolvedValueOnce({
          rows: [{ created_at: new Date(new Date().getTime() - contentAge * contentAgeBase - 1) }],
        });

        const result = await reward(request);

        expect(result).toBe(expected);
      },
    );
  });
});
