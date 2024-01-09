import { Redis } from '@upstash/redis';

import ip from './ip';

async function increment(pathname, request) {
  const redis = Redis.fromEnv();

  const contentKey = `page-view:${pathname}`;
  await redis.hincrby(contentKey, 'total', 1);

  const realIp = ip.extractFromRequest(request);
  const hashIp = await ip.hash(realIp);
  const lastVisitKey = `page-view-last-visit:${hashIp}`;
  const lastVisit = await redis.hget(lastVisitKey, pathname);

  const now = Date.now();

  const newLastVisit = {
    global: lastVisit?.global ?? now,
    day: lastVisit?.day ?? now,
    week: lastVisit?.week ?? now,
    month: lastVisit?.month ?? now,
  };

  if (!lastVisit?.global) {
    await redis.hincrby(contentKey, 'unique', 1);
    newLastVisit.global = now;
  }

  if (!lastVisit?.day || now - lastVisit.day > 24 * 60 * 60 * 1000) {
    await redis.hincrby(contentKey, 'unique-day', 1);
    newLastVisit.day = now;
  }

  if (!lastVisit?.week || now - lastVisit.week > 7 * 24 * 60 * 60 * 1000) {
    await redis.hincrby(contentKey, 'unique-week', 1);
    newLastVisit.week = now;
  }

  if (!lastVisit?.month || now - lastVisit.month > 30 * 24 * 60 * 60 * 1000) {
    await redis.hincrby(contentKey, 'unique-month', 1);
    newLastVisit.month = now;
  }

  await redis.hset(lastVisitKey, { [pathname]: newLastVisit });
}

function get(pathname) {
  const redis = Redis.fromEnv();
  return redis.hgetall(`page-view:${pathname}`);
}

export default Object.freeze({
  increment,
  get,
});
