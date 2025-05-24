import type { Response } from "express";
import initLLM from "../config/llm.config";
import {
  createClassificationChain,
  createRewriteQueryChain,
  createDocumentEvaluatorChain,
  createStreamingAnswerChain,
} from "../utils/chain.util";
import type { Document } from "langchain/document";

import {
  getChatHistory,
  addMessageToHistory,
} from "./conversations.service";

import { queryCombinedResult } from "./vectorStore.service";
import type Message from "../models/message.model";
import searchWeb from "./tavily.service";

const formatChatHistory = async (history: Message[]) => {
  if (history.length === 0) {
    return "";
  }

  return history
    .map((msg: Message) => {
      return `${msg.role}: ${msg.content}`;
    })
    .join("\n");
};

const classifyUserQuery = async (question: string, sessionId: string) => {
  try {
    const llm = initLLM();
    const classificationChain = createClassificationChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await classificationChain.invoke({
      history: historyText,
      question: question,
    });

    if (result.includes("vector_store")) {
      return "vector_store";
    }
    if (result.includes("web_context")) {
      return "web_context";
    }
    return "casual_convo";
  } catch (err) {
    throw err
  }
};

const rewriteQuery = async (question: string, sessionId: string, mode: string, documentInfo?: string) => {
  try {
    const llm = initLLM();
    const rewriteChain = createRewriteQueryChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await rewriteChain.invoke({
      history: historyText,
      question: question,
      mode: mode,
      documentInfo: documentInfo || "",
    });

    return result || question;
  } catch (err) {
    throw err
  }
};

const evaluateDocuments = async (question: string, documents: Document[]) => {
  try {
    const llm = initLLM();
    const evaluatorChain = createDocumentEvaluatorChain(llm);

    const evaluationPromises = documents.map(async (doc) => {
      const result = await evaluatorChain.invoke({
        question: question,
        document: doc.pageContent,
      });
      return { doc, result };
    });

    const results = await Promise.allSettled(evaluationPromises);

    const relevantDocs: Document[] = [];
    let hasDirectAnswer = false;

    results.forEach(promiseResult => {
      if (promiseResult.status === "fulfilled" && 'result' in promiseResult.value) {
        const { doc, result } = promiseResult.value;

        if (result?.includes("direct_answer")) {
          hasDirectAnswer = true;
        }

        if (result?.includes("relevant") || result?.includes("direct_answer")) {
          relevantDocs.push(doc);
        }
      }
    });

    const needsWebSearch = !hasDirectAnswer;
    return { relevantDocs, needsWebSearch };
  } catch (err) {
    throw err;
  }
};

const generateAnswerWithStreaming = async (question: string, context: string, sessionId: string, res: Response) => {
  try {
    const llm = initLLM();
    const streamingChain = createStreamingAnswerChain(llm);
    let fullResponse = '';

    const stream = await streamingChain.stream({
      question: question,
      context: context
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    console.log("Full response:", fullResponse);

    await addMessageToHistory(sessionId, { role: "user", content: question });
    await addMessageToHistory(sessionId, { role: "assistant", content: fullResponse });

    res.end();
  } catch (err) {
    res.write("data: Đã xảy ra lỗi trong quá trình xử lý!");
  }
};

const processUserQueryWithStreaming = async (question: string, sessionId: string, res: Response) => {
  try {
    const queryType = await classifyUserQuery(question, sessionId);
    console.log("Query type:", queryType);
    if (queryType === "casual_convo") {
      await generateAnswerWithStreaming(question, "", sessionId, res);
    } else if (queryType === "vector_store") {
      const rewrittenQuery = await rewriteQuery(question, sessionId, "vector_search");
      console.log("Rewritten query for vector search:", rewrittenQuery);

      const docs = await queryCombinedResult(rewrittenQuery);
      let context = "";

      if (docs.length === 0) {
        await generateAnswerWithStreaming(question, context, sessionId, res);
        return;
      }

      const { relevantDocs, needsWebSearch } = await evaluateDocuments(
        rewrittenQuery,
        docs
      );
      console.log("Relevant documents:", relevantDocs, "Needs web search:", needsWebSearch);

      if (needsWebSearch) {
        const movieSummaries = relevantDocs
          .map(doc => `${doc.metadata.name} (${doc.metadata.release_year} - ${doc.metadata.country})`);
          
        console.log("Document summary for web search:", movieSummaries);

        const movieQueries = movieSummaries.map(async (movieSummary) => {
          const movieQuery = await rewriteQuery(
            question,
            sessionId,
            "context_search",
            movieSummary
          );

          console.log(`Web search query for ${movieSummary}:`, movieQuery);

          const result = await searchWeb(movieQuery);

          if (result) {
            result.metadata = { ...result.metadata, movie_summary: movieSummary };
            return result;
          }
          return null;

        });

        const results = await Promise.allSettled(movieQueries);

        const webResults: Document[] = results
          .filter((result): result is PromiseFulfilledResult<Document | null> =>
            result.status === 'fulfilled' && result.value !== null)
          .map(result => result.value as Document);

        console.log(`Found web results for ${webResults.length} movies`);

        const allDocs = [...relevantDocs, ...webResults];

        if (allDocs.length > 0) {
          context = allDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");
        }
      } else {
        if (relevantDocs.length > 0) {
          context = relevantDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");
        }
      }

      await generateAnswerWithStreaming(question, context, sessionId, res);
    }
    else if (queryType === "web_context") {
      const webSearchQuery = await rewriteQuery(question, sessionId, "web_search");
      console.log("Web search query:", webSearchQuery);
      const webResult = await searchWeb(webSearchQuery);
      console.log("Web search result:", webResult);

      let context = "";

      if (webResult) {
        context = webResult.pageContent;
      }

      await generateAnswerWithStreaming(question, context, sessionId, res);
    }
  } catch (err) {
    throw err
  }
};

export default processUserQueryWithStreaming;