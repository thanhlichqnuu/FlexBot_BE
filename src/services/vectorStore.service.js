import { PineconeTranslator } from "@langchain/pinecone";
import { Document } from "@langchain/core/documents";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import initVectorStore from "../config/pinecone.config";
import initLLM from "../config/llm.config";
import { initRetrievalDocumentEmbeddings, initRetrievalQueryEmbeddings } from "../config/embedding.config";
import movieAttribute from "../models/movie.model.attributes";
import { processMoviesForVectorStore } from "./movie.service";

let vectorStoreForDocument = null;
let vectorStoreForQuery = null;

const syncMoviesToVectorStore = async () => {
  try {
    const moviesForVectorStore = await processMoviesForVectorStore();
    
    const documents = moviesForVectorStore.map(
      (item) =>
        new Document({
          pageContent: item.pageContent,
          metadata: item.metadata,
        })
    );

    // const chunkedDocuments = await semanticChunkMovieDocuments(documents);

    if (!vectorStoreForDocument) {
      vectorStoreForDocument = await initVectorStore(initRetrievalDocumentEmbeddings);
    }

    await vectorStoreForDocument.addDocuments(documents);

    return { success: true, count: documents.length };
  } catch (err) {
    throw err;
  }
};

const createSelfQueryRetriever = async () => {
  try {
    if (!vectorStoreForDocument) {
      vectorStoreForDocument = await initVectorStore(initRetrievalDocumentEmbeddings);
    }

    const llm = initLLM();

    const retriever = SelfQueryRetriever.fromLLM({
      llm: llm,
      vectorStore: vectorStoreForDocument,
      documentContents:
        "Thông tin về phim, bao gồm: tên phim, tên gốc phim, nội dung phim, năm phát hành, trạng thái phim, đạo diễn, diễn viên, thời lượng một tập phim, số tập, quốc gia, thể loại.",
      attributeInfo: movieAttribute,
      structuredQueryTranslator: new PineconeTranslator(),
      searchParams: {
        k: 5,
      },
    });

    return retriever;
  } catch (err) {
    throw err;
  }
};

const queryVectorStore = async (query, limit = 5) => {
  try {
    if (!vectorStoreForQuery) {
      vectorStoreForQuery = await initVectorStore(initRetrievalQueryEmbeddings);
    }

    const results = await vectorStoreForQuery.similaritySearch(query, limit);
    return results || [];
  } catch (err) {
    return []; 
  }
};

const querySelfQueryRetriever = async (query) => {
  try {
    const retriever = await createSelfQueryRetriever();
    const results = await retriever.invoke(query)
    return results || [];
  } catch (err) {
    return []; 
  }
};

const queryCombined = async (query) => {
  try {
    const selfQueryResults = await querySelfQueryRetriever(query);
    const similaritySearchResults = await queryVectorStore(query);

    const combinedResults = [
      ...selfQueryResults,
      ...similaritySearchResults
    ];

    const uniqueResults = Array.from(
      new Map(
        combinedResults.map(doc => [doc.pageContent, doc])
      ).values()
    );

    return uniqueResults;
  } catch (err) {
    return []; 
  }
};

export {
  initVectorStore,
  syncMoviesToVectorStore,
  createSelfQueryRetriever,
  queryCombined,
};
