import { MongoClient, ServerApiVersion } from "mongodb";

const dbName = process.env.MONGODB_DB || "potato-snake";

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalMongo = globalThis as GlobalMongo;

function getClientPromise() {
  if (globalMongo._mongoClientPromise) {
    return globalMongo._mongoClientPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  const clientPromise = client.connect();

  if (process.env.NODE_ENV !== "production") {
    globalMongo._mongoClientPromise = clientPromise;
  }

  return clientPromise;
}

export async function getDatabase() {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}

export async function getScoresCollection() {
  const db = await getDatabase();
  return db.collection<{
    playerId: string;
    name: string;
    score: number;
    createdAt: Date;
    updatedAt: Date;
  }>("scores");
}
