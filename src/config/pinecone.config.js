import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

const PINECONE_API_KEY = Bun.env.PINECONE_API_KEY;
const PINECONE_INDEX = Bun.env.PINECONE_INDEX;

const initPinecone = async () => {
  try {
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    return pinecone.index(PINECONE_INDEX);
  } catch (err) {
    throw err;
  }
};

const initVectorStore = async (initEmbedding) => {
  try {
    const pineconeIndex = await initPinecone();
    const embeddings = initEmbedding();

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });

    return vectorStore;
  } catch (err) {
    throw err;
  }
};

export default initVectorStore
