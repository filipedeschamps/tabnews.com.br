export class Ranker {
  constructor(config = {}) {
    this.config = {
      // PESOS DOS COMPONENTES PRINCIPAIS
      weightQuality: 1.5,
      weightDiscussion: 1.2,
      weightEngagement: 1,
      weightContent: 2.5,
      weightControversy: 0.5,

      /*
      PESOS INTERNOS DA DISCUSSÃO
      (devem somar 1)
      */
      discussionWeightVolume: 0.4,
      discussionWeightUsers: 0.35,
      discussionWeightDepth: 0.25,

      // WILSON SCORE
      wilsonZ: 1.96,
      priorUp: 3,
      priorDown: 1,

      // REFERÊNCIAS DE NORMALIZAÇÃO
      maxComments: 500,
      maxDepth: 20,
      maxUsers: 200,
      maxPostLength: 20000,
      maxVelocity: 50,

      // TIME DECAY
      halfLifeHours: 12,
    };

    this.config = { ...this.config, ...config };
  }

  execute(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const now = Date.now();

    const ranked = rows.map((post) => ({
      ...post,
      score: this.computeFinalScore(post, now),
    }));

    ranked.sort((a, b) => b.score - a.score);

    return ranked;
  }

  computeFinalScore(post, now) {
    const baseScore =
      this.config.weightQuality * this.qualityScore(post) +
      this.config.weightDiscussion * this.discussionScore(post) +
      this.config.weightEngagement * this.engagementScore(post, now) +
      this.config.weightContent * this.contentScore(post) +
      this.config.weightControversy * this.controversyScore(post);

    return baseScore * this.recencyDecay(post, now);
  }

  qualityScore(post) {
    const up = Number(post.upvotes || 0) + this.config.priorUp;
    const down = Number(post.downvotes || 0) + this.config.priorDown;
    return this.clamp(this.wilson(up, down));
  }

  discussionScore(post) {
    const comments = Number(post.comment_count || 0);
    const depth = Number(post.avg_comment_children || 0);
    const users = Number(post.unique_commenters || 0);

    const weighted =
      this.logNormalize(comments, this.config.maxComments) * this.config.discussionWeightVolume +
      this.logNormalize(users, this.config.maxUsers) * this.config.discussionWeightUsers +
      this.logNormalize(depth, this.config.maxDepth) * this.config.discussionWeightDepth;

    return this.clamp(weighted);
  }

  engagementScore(post, now) {
    const age = this.ageHours(post.created_at, now);
    const votes = Number(post.recent_votes || 0);
    const comments = Number(post.recent_comments || 0);
    const velocity = (votes + comments) / (age + 1);

    return this.logNormalize(velocity, this.config.maxVelocity);
  }

  contentScore(post) {
    const length = Number(post.post_length || 0);
    return this.logNormalize(length, this.config.maxPostLength);
  }

  controversyScore(post) {
    const up = Number(post.upvotes || 0);
    const down = Number(post.downvotes || 0);
    const total = up + down;

    if (total === 0) {
      return 0;
    }

    return this.clamp(1 - Math.abs(up - down) / total);
  }

  recencyDecay(post, now) {
    const age = this.ageHours(post.created_at, now);
    return Math.exp(-age / this.config.halfLifeHours);
  }

  wilson(up, down) {
    const n = up + down;
    if (n === 0) {
      return 0;
    }

    const z = this.config.wilsonZ;
    const p = up / n;
    const numerator = p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
    const denominator = 1 + (z * z) / n;

    return numerator / denominator;
  }

  logNormalize(value, max) {
    const numericValue = Number(value);
    const numericMax = Number(max);

    if (!numericValue || numericMax <= 0) {
      return 0;
    }

    return this.clamp(Math.log1p(numericValue) / Math.log1p(numericMax));
  }

  clamp(v) {
    if (Number.isNaN(v)) {
      return 0;
    }
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  ageHours(timestamp, now) {
    const t = new Date(timestamp).getTime();

    if (!t) {
      return 0;
    }

    return (now - t) / 3600000;
  }
}
