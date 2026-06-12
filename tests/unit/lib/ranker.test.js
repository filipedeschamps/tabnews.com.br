import { Ranker } from 'lib/ranker';

describe('Ranker v2', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with default config and allows overrides', () => {
    const ranker = new Ranker({ weightContent: 3.2, maxPostLength: 1000 });
    expect(ranker.config.weightContent).toBe(3.2);
    expect(ranker.config.maxPostLength).toBe(1000);
  });

  it('wilson returns 0 when no votes', () => {
    const ranker = new Ranker();
    expect(ranker.wilson(0, 0)).toBe(0);
  });

  it('wilson returns a positive score within [0,1] with votes', () => {
    const ranker = new Ranker();
    const score = ranker.wilson(10, 2);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('clamp enforces [0,1] range', () => {
    const ranker = new Ranker();
    expect(ranker.clamp(-0.5)).toBe(0);
    expect(ranker.clamp(0.5)).toBe(0.5);
    expect(ranker.clamp(1.5)).toBe(1);
  });

  it('logNormalize handles numeric strings and zero values', () => {
    const ranker = new Ranker();
    expect(ranker.logNormalize('0', 10)).toBe(0);
    expect(ranker.logNormalize('5', '10')).toBeGreaterThan(0);
  });

  it('ageHours returns 0 for invalid timestamps', () => {
    const ranker = new Ranker();
    expect(ranker.ageHours(undefined, Date.now())).toBe(0);
    expect(ranker.ageHours(null, Date.now())).toBe(0);
    expect(ranker.ageHours('invalid-date', Date.now())).toBe(0);
  });

  it('recencyDecay decreases as content gets older', () => {
    const now = Date.now();
    const ranker = new Ranker();
    const newer = ranker.recencyDecay({ created_at: now - 1 * 3600000 }, now);
    const older = ranker.recencyDecay({ created_at: now - 24 * 3600000 }, now);
    expect(newer).toBeGreaterThan(older);
  });

  it('controversyScore returns 0 when total votes is zero', () => {
    const ranker = new Ranker();
    expect(ranker.controversyScore({ upvotes: '0', downvotes: '0' })).toBe(0);
  });

  it('discussionScore increases with deeper discussion signals', () => {
    const ranker = new Ranker();
    const shallow = {
      comment_count: 1,
      avg_comment_children: 0,
      unique_commenters: 1,
    };
    const deep = {
      comment_count: 10,
      avg_comment_children: 3,
      unique_commenters: 6,
    };

    expect(ranker.discussionScore(deep)).toBeGreaterThan(ranker.discussionScore(shallow));
  });

  it('contentScore increases with longer posts', () => {
    const ranker = new Ranker();
    const shortScore = ranker.contentScore({ post_length: 200 });
    const longScore = ranker.contentScore({ post_length: 5000 });
    expect(longScore).toBeGreaterThan(shortScore);
  });

  it('engagementScore increases with higher velocity', () => {
    const now = Date.now();
    const ranker = new Ranker();
    const low = ranker.engagementScore({ created_at: now - 2 * 3600000, recent_votes: 1, recent_comments: 0 }, now);
    const high = ranker.engagementScore({ created_at: now - 2 * 3600000, recent_votes: 5, recent_comments: 3 }, now);
    expect(high).toBeGreaterThan(low);
  });

  it('computeFinalScore returns a finite number for string inputs', () => {
    const now = Date.now();
    const ranker = new Ranker();
    const score = ranker.computeFinalScore(
      {
        id: 'string-inputs',
        upvotes: '10',
        downvotes: '2',
        comment_count: '4',
        avg_comment_children: '1',
        unique_commenters: '3',
        recent_votes: '2',
        recent_comments: '1',
        post_length: '900',
        created_at: now - 2 * 3600000,
      },
      now,
    );

    expect(Number.isFinite(score)).toBe(true);
  });

  it('execute keeps input rows unchanged and adds score to output', () => {
    const now = Date.now();
    const ranker = new Ranker();
    const rows = [
      {
        id: 'base',
        upvotes: 3,
        downvotes: 1,
        comment_count: 2,
        avg_comment_children: 1,
        unique_commenters: 1,
        post_length: 600,
        recent_votes: 1,
        recent_comments: 0,
        created_at: now - 3600000,
      },
    ];

    const ranked = ranker.execute(rows);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toHaveProperty('score');
    expect(ranked[0].id).toBe('base');
    expect(rows[0]).not.toHaveProperty('score');
  });

  it('execute sorts by descending score', () => {
    const now = Date.now();
    const ranker = new Ranker();

    const rows = [
      {
        id: 'low',
        upvotes: 3,
        downvotes: 1,
        comment_count: 1,
        avg_comment_children: 0,
        unique_commenters: 1,
        post_length: 300,
        recent_votes: 0,
        recent_comments: 0,
        created_at: now - 10 * 3600000,
      },
      {
        id: 'high',
        upvotes: 20,
        downvotes: 1,
        comment_count: 10,
        avg_comment_children: 2,
        unique_commenters: 5,
        post_length: 2000,
        recent_votes: 6,
        recent_comments: 4,
        created_at: now - 2 * 3600000,
      },
    ];

    const ranked = ranker.execute(rows);

    expect(ranked[0].id).toBe('high');
    expect(ranked[1].id).toBe('low');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('favors recency when other signals are equal', () => {
    const now = Date.now();
    const ranker = new Ranker();

    const base = {
      upvotes: 10,
      downvotes: 1,
      comment_count: 4,
      avg_comment_children: 1,
      unique_commenters: 3,
      post_length: 1000,
      recent_votes: 0,
      recent_comments: 0,
    };

    const newer = { id: 'newer', ...base, created_at: now - 1 * 3600000 };
    const older = { id: 'older', ...base, created_at: now - 24 * 3600000 };

    const ranked = ranker.execute([older, newer]);

    expect(ranked[0].id).toBe('newer');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('handles empty input list', () => {
    const ranker = new Ranker();
    const ranked = ranker.execute([]);
    expect(ranked).toStrictEqual([]);
  });

  it('keeps results sorted for a larger batch', () => {
    const now = Date.now();
    const ranker = new Ranker();

    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i + 1}`,
      upvotes: 2 + i,
      downvotes: i % 2,
      comment_count: 1 + (i % 3),
      avg_comment_children: i % 4,
      unique_commenters: 1 + (i % 5),
      post_length: 500 + i * 100,
      recent_votes: i % 5,
      recent_comments: (i + 1) % 4,
      created_at: now - (i + 1) * 3600000,
    }));

    const ranked = ranker.execute(rows);

    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });
});
