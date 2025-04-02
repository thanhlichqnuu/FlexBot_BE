import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  routePrompt,
  reWriteQueryPrompt,
  generateAnswerPrompt,
} from "./prompt.util";

const createClassificationChain = (llm) => {
  return RunnableSequence.from([
    routePrompt,
    llm,
    new StringOutputParser(),
  ]);
};

const createRewriteQueryChain = (llm) => {
  return RunnableSequence.from([
    reWriteQueryPrompt,
    llm,
    new StringOutputParser()
  ]);
};

const createGenerateAnswerChain = (llm) => {
  return RunnableSequence.from([
    generateAnswerPrompt,
    llm,
    new StringOutputParser(),
  ]);
};

export {
  createClassificationChain,
  createRewriteQueryChain,
  createGenerateAnswerChain,
};