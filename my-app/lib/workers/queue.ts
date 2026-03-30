import { JobsOptions, Queue, type ConnectionOptions } from "bullmq";

type QueueLike = {
  name: string;
  add: (jobName: string, jobData: unknown, jobOpts?: JobsOptions) => Promise<{ id: string; name: string; data: unknown }>;
  getJob: (jobId: string) => Promise<{
    id: string;
    name: string;
    progress: number;
    attemptsMade: number;
    failedReason: string | null;
    returnvalue: unknown;
    getState: () => Promise<string>;
  } | null>;
  close: () => Promise<void>;
};

function buildConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: parsed.pathname ? Number(parsed.pathname.replace("/", "") || 0) : 0,
    };
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    db: Number(process.env.REDIS_DB || 0),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

const redisConfigured = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

function createNoopQueue(name: string): QueueLike {
  return {
    name,
    async add(jobName, jobData) {
      return {
        id: `noop:${name}:${Date.now()}`,
        name: jobName,
        data: jobData,
      };
    },
    async getJob() {
      return null;
    },
    async close() {
      return;
    },
  };
}

function createQueue(name: string): Queue | QueueLike {
  if (!redisConfigured) {
    return createNoopQueue(name);
  }
  return new Queue(name, { connection: bullConnection });
}

export const bullConnection = buildConnection();

export const ocrQueue = createQueue("q.ocr");
export const aiInsightsQueue = createQueue("q.ai.insights");
export const emailQueue = createQueue("q.email");
export const analyticsQueue = createQueue("q.analytics");
export const reminderQueue = createQueue("q.reminders");
export const erpSyncQueue = createQueue("q.erp.sync");
export const complianceQueue = createQueue("q.compliance");
export const matchQueue = createQueue("q.match");

export async function addJob<T, N extends string>(
  queue: Queue<T, unknown, N> | QueueLike,
  data: T,
  opts?: JobsOptions,
  name?: N,
) {
  const jobQueue = queue as {
    add: (jobName: string, jobData: T, jobOpts: JobsOptions) => Promise<unknown>;
  };

  return jobQueue.add(name || "default", data, {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    ...opts,
  });
}

export async function getJobStatus<T>(queue: Queue<T> | QueueLike, jobId: string) {
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  return {
    id: job.id,
    name: job.name,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    returnValue: job.returnvalue,
  };
}
