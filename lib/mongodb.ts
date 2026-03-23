import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "potato-snake";

if (!uri) {
  throw new Error("MONGODB_URI is not configured.");
}

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalMongo = globalThis as GlobalMongo;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

const clientPromise = globalMongo._mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  globalMongo._mongoClientPromise = clientPromise;
}

export async function getDatabase() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export async function getScoresCollection() {
  const db = await getDatabase();
  return db.collection<{
    name: string;
    score: number;
    createdAt: Date;
    updatedAt: Date;
  }>("scores");
}
