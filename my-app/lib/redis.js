import Redis from "ioredis";

let redis;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 50, 2000);
      }
    });
    
    redis.on("error", (err) => {
      console.warn("Redis Connection Error:", err.message);
    });
  } catch (err) {
    console.error("Redis Init Failed:", err.message);
    redis = null;
  }
} else {
  console.warn("REDIS_URL not set. Falling back to in-memory/disabled token rotation.");
}

/**
 * Basic key-value store with fallback logic.
 */
export async function setToken(key, value, expirySeconds) {
  if (redis) {
    return await redis.set(key, value, "EX", expirySeconds);
  }
  // No fallback implemented for set/get yet, assuming redis is required for production rotation
  return null;
}

export async function getToken(key) {
  if (redis) {
    return await redis.get(key);
  }
  return null;
}

export async function delToken(key) {
  if (redis) {
    return await redis.del(key);
  }
  return null;
}

export default redis;
