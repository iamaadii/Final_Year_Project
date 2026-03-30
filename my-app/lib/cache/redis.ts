import Redis from "ioredis";

let redisClient: Redis | null = null;

function buildRedisClient() {
  const redisUrl = process.env.REDIS_URL || "";

  if (!redisUrl) {
    return null;
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
    enableReadyCheck: true,
  });
}

export function getRedisClient() {
  if (!redisClient) {
    redisClient = buildRedisClient();

    if (redisClient) {
      redisClient.on("error", (error) => {
        console.error("[redis] connection error", error);
      });

      if (redisClient.status === "wait") {
        redisClient.connect().catch((error) => {
          console.error("[redis] initial connect failed", error);
        });
      }
    }
  }

  return redisClient;
}

export async function get<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  const value = await client.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function set(key: string, value: unknown, ttl?: number) {
  const client = getRedisClient();
  if (!client) return null;

  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  if (ttl && ttl > 0) {
    return client.set(key, serialized, "EX", ttl);
  }

  return client.set(key, serialized);
}

export async function del(key: string) {
  const client = getRedisClient();
  if (!client) return 0;
  return client.del(key);
}

export async function invalidatePattern(pattern: string) {
  const client = getRedisClient();
  if (!client) return 0;

  let cursor = "0";
  let deleted = 0;

  do {
    const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      deleted += await client.del(...keys);
    }
  } while (cursor !== "0");

  return deleted;
}
