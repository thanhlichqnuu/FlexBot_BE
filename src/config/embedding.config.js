import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const GOOGLE_API_KEY = Bun.env.GOOGLE_API_KEY;
const LLM_EMBEDDING_MODEL_NAME = Bun.env.LLM_EMBEDDING_MODEL_NAME;

const initRetrievalDocumentEmbeddings = () =>
  new GoogleGenerativeAIEmbeddings({
    apiKey: GOOGLE_API_KEY,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    modelName: LLM_EMBEDDING_MODEL_NAME,
  });

const initRetrievalQueryEmbeddings = () =>
  new GoogleGenerativeAIEmbeddings({
    apiKey: GOOGLE_API_KEY,
    taskType: TaskType.RETRIEVAL_QUERY,
    modelName: LLM_EMBEDDING_MODEL_NAME,
  });

export { initRetrievalDocumentEmbeddings, initRetrievalQueryEmbeddings };
