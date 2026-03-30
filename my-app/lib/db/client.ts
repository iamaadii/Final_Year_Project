import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "MyUsers";
const MONGODB_MAX_POOL_SIZE = Number(process.env.MONGODB_MAX_POOL_SIZE || 20);

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const globalCache = global.__mongooseCache || { conn: null, promise: null };
global.__mongooseCache = globalCache;

export async function connectDB() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      maxPoolSize: MONGODB_MAX_POOL_SIZE,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

export async function getDB() {
  const conn = await connectDB();

  if (!conn.connection.db) {
    throw new Error("MongoDB connection is not initialized");
  }

  return conn.connection.db;
}
