import { PineconeStore, PineconeTranslator } from "@langchain/pinecone";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { TaskType } from "@google/generative-ai";
import initVectorStore from "../config/pinecone.config";
import initLLM from "../config/llm.config";
import initEmbeddingModel from "../config/embedding.config";
import MovieAttribute from "../models/movieAttribute.model";
import getAllMovieDocuments from "./movie.service";

let vectorStoreForDocument: PineconeStore | null = null;
let vectorStoreForSemanticSimilarity: PineconeStore | null = null;

const initRetrievalDocumentEmbedding = () => initEmbeddingModel(TaskType.RETRIEVAL_DOCUMENT);
const initRetrievalQueryEmbedding = () => initEmbeddingModel(TaskType.RETRIEVAL_QUERY);

const syncMoviesToVectorStore = async () => {
  try {
    const movieDocuments = await getAllMovieDocuments();
    if (!vectorStoreForDocument) {
      vectorStoreForDocument = await initVectorStore(initRetrievalDocumentEmbedding);
    }

    await vectorStoreForDocument.addDocuments(movieDocuments);

    return movieDocuments.length;
  } catch (err) {
    throw err;
  }
};

const createSelfQueryRetriever = async () => {
  try {
    if (!vectorStoreForDocument) {
      vectorStoreForDocument = await initVectorStore(initRetrievalDocumentEmbedding);
    }

    const llm = initLLM();

    const retriever = SelfQueryRetriever.fromLLM({
      llm: llm,
      vectorStore: vectorStoreForDocument,
      documentContents:
        "Thông tin về phim, bao gồm: tên phim, tên gốc phim, nội dung phim, năm phát hành, trạng thái phim, đạo diễn, diễn viên, thời lượng một tập phim, số tập, quốc gia, thể loại.",
      attributeInfo: MovieAttribute,
      structuredQueryTranslator: new PineconeTranslator(),
      searchParams: {
        k: 4,
      },
    });

    return retriever;
  } catch (err) {
    throw err;
  }
};

const searchSimilarMovies = async (query: string, limit: number = 4) => {
  try {
    if (!vectorStoreForSemanticSimilarity) {
      vectorStoreForSemanticSimilarity = await initVectorStore(initRetrievalQueryEmbedding);
    }

    const result = await vectorStoreForSemanticSimilarity.similaritySearch(query, limit);
    return result || [];
  } catch (err) {
    throw err
  }
};

const searchMoviesWithSelfQuery = async (query: string) => {
  try {
    const retriever = await createSelfQueryRetriever();
    const result = await retriever.invoke(query);
    return result || [];
  } catch (err) {
    throw err
  }
};

const queryCombinedResult = async (query: string) => {
  try {
    const selfQueryResult = await searchMoviesWithSelfQuery(query);
    const similaritySearchResult = await searchSimilarMovies(query);

    const combinedResult = [
      ...selfQueryResult,
      ...similaritySearchResult
    ];

    const uniqueResult = Array.from(
      new Map(
        combinedResult.map(document => [document.pageContent, document])
      ).values()
    );

    return uniqueResult;
  } catch (err) {
    throw err
  }
};

export {
  syncMoviesToVectorStore,
  searchSimilarMovies,
  searchMoviesWithSelfQuery,
  queryCombinedResult,
};
