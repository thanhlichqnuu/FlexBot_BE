import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const GOOGLE_API_KEY = Bun.env.GOOGLE_API_KEY;
const LLM_MODEL_NAME = Bun.env.LLM_MODEL_NAME;

const initLLM = () =>
  new ChatGoogleGenerativeAI({
    apiKey: GOOGLE_API_KEY,
    modelName: LLM_MODEL_NAME,
    maxOutputTokens: 1500,
    temperature: 0.3,
    streaming: true,
  });

export default initLLM;
