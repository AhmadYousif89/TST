import { MongoClient } from "mongodb";

declare global {
  var __mongo:
    | {
        client: MongoClient | null;
        promise: Promise<MongoClient> | null;
        initialized: boolean;
      }
    | undefined;
}

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_NAME!;

if (!uri) throw new Error("Please define the MONGODB_URI environment variable");
if (!dbName) throw new Error("Please define the MONGODB_DB environment variable");

const cached = (global.__mongo ??= {
  client: null,
  promise: null,
  initialized: false,
});

export async function getMongoClient(): Promise<MongoClient> {
  if (cached.client) return cached.client;

  if (!cached.promise) {
    console.log("Creating MongoDB client...");
    const client = new MongoClient(uri);

    cached.promise = client.connect().then(async (c) => {
      if (!cached.initialized) {
        const db = c.db(dbName);
        await db.command({ ping: 1 });
        cached.initialized = true;
        console.log("MongoDB connected and initialized");
      }
      return c;
    });
  }

  cached.client = await cached.promise;
  return cached.client;
}

async function connectToDB() {
  const client = await getMongoClient();
  return { db: client.db(dbName), client };
}

export default connectToDB;
