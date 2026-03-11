import mongoose from "mongoose";

// console.log("ENV URI:", process.env.MONGODB_URI);
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "MyUsers",
      })
      .then((mongoose) => {
        console.log("MongoDB Connected Successfully");
        return mongoose;
      })
      .catch((err) => {
        console.log("MongoDB Connection Error:", err);
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
