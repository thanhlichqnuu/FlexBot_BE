import { MongoClient, ServerApiVersion } from "mongodb";

const MONGODB_URI = Bun.env.MONGODB_URI || "";
const MONGODB_DB_NAME = Bun.env.MONGODB_DB_NAME;
const MONGODB_COLLECTION_NAME = Bun.env.MONGODB_COLLECTION_NAME || ""

const mongoClient = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const mongoDatabase = mongoClient.db(MONGODB_DB_NAME);
const mongoCollection = mongoDatabase.collection(MONGODB_COLLECTION_NAME);

const connectMongoAtlas = async () => {
  try {
    await mongoClient.connect();
    await mongoDatabase.command({ ping: 1 });

  } catch (err) {
    mongoClient.close();
  }
};

export { mongoClient, connectMongoAtlas, mongoCollection }; 
