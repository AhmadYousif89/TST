import { MongoClient, MongoClientOptions } from "mongodb";

declare global {
  var mongoConn: {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
  };
}

const MONGODB_NAME = process.env.MONGODB_NAME!;
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}

let cached = global.mongoConn;

if (!cached) {
  cached = global.mongoConn = { client: null, promise: null };
}

async function connectToDB() {
  if (cached.client) {
    return { db: cached.client.db(MONGODB_NAME), client: cached.client };
  }

  if (!cached.promise) {
    console.log("Creating new connection promise...");
    const opts: MongoClientOptions = {
      appName: "TST",
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      writeConcern: { w: "majority" },
      retryWrites: true,
    };

    cached.promise = (async () =>
      await MongoClient.connect(MONGODB_URI, opts))();
  }

  try {
    console.log("Connecting to database...");
    cached.client = await cached.promise;
  } catch (e) {
    console.error("Error connecting to database:", e);
    cached.promise = null; // Allow retry on next call
    throw e;
  }

  console.log(`Database ${MONGODB_NAME}: connected.`);
  return { db: cached.client.db(MONGODB_NAME), client: cached.client };
}

export default connectToDB;
