import { createClient } from "redis";

const REDIS_URL = "redis://localhost:6379";
const SESSION_TTL_SECONDS = 60 * 30;

const ONLINE_USER_COUNT_KEY = "online:users:count";
const ONLINE_SESSION_INDEX_KEY = "online:sessions:index";
const ONLINE_SESSION_KEY_PREFIX = "online:session:";

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => {
  console.error("[redis] error:", err.message);
});

function parseSessionMember(member) {
  const [sessionId, userId] = member.split(":");
  if (!sessionId || !userId) return null;
  return { sessionId, userId };
}

function getSessionKey(sessionId) {
  return `${ONLINE_SESSION_KEY_PREFIX}${sessionId}`;
}

async function decrementUserSessionCount(userId) {
  const current = await redisClient.hGet(ONLINE_USER_COUNT_KEY, userId);
  if (!current) return;

  const next = Number(current) - 1;
  if (next <= 0) {
    await redisClient.hDel(ONLINE_USER_COUNT_KEY, userId);
    return;
  }

  await redisClient.hSet(ONLINE_USER_COUNT_KEY, userId, String(next));
}

export async function connectRedis() {
  await redisClient.connect();
  await redisClient.ping();
  console.log("[redis] connected");
}

export async function cleanupExpiredSessions() {
  const now = Date.now();
  const expiredMembers = await redisClient.zRangeByScore(
    ONLINE_SESSION_INDEX_KEY,
    0,
    now
  );

  if (expiredMembers.length === 0) return;

  for (const member of expiredMembers) {
    const parsed = parseSessionMember(member);
    if (!parsed) continue;

    await decrementUserSessionCount(parsed.userId);
    await redisClient.del(getSessionKey(parsed.sessionId));
  }

  await redisClient.zRemRangeByScore(ONLINE_SESSION_INDEX_KEY, 0, now);
}

export async function registerUserSession(userId, sessionId) {
  await cleanupExpiredSessions();

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const member = `${sessionId}:${userId}`;

  await redisClient.set(getSessionKey(sessionId), String(userId), {
    EX: SESSION_TTL_SECONDS,
  });
  await redisClient.zAdd(ONLINE_SESSION_INDEX_KEY, [{ score: expiresAt, value: member }]);
  await redisClient.hIncrBy(ONLINE_USER_COUNT_KEY, String(userId), 1);
}

export async function refreshUserSession(sessionId) {
  await cleanupExpiredSessions();

  const userId = await redisClient.get(getSessionKey(sessionId));
  if (!userId) {
    return { ok: false };
  }

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const member = `${sessionId}:${userId}`;

  await redisClient.set(getSessionKey(sessionId), String(userId), {
    EX: SESSION_TTL_SECONDS,
  });
  await redisClient.zAdd(ONLINE_SESSION_INDEX_KEY, [{ score: expiresAt, value: member }]);

  return { ok: true };
}

export async function unregisterUserSession(sessionId) {
  await cleanupExpiredSessions();

  const userId = await redisClient.get(getSessionKey(sessionId));
  if (!userId) {
    return;
  }

  await decrementUserSessionCount(userId);
  await redisClient.del(getSessionKey(sessionId));
  await redisClient.zRem(ONLINE_SESSION_INDEX_KEY, `${sessionId}:${userId}`);
}

export async function getOnlineUserCount() {
  await cleanupExpiredSessions();
  return redisClient.hLen(ONLINE_USER_COUNT_KEY);
}
