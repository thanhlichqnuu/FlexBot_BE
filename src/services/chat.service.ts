import type { Response } from "express";
import initLLM from "../config/llm.config";
import {
  createClassificationChain,
  createRewriteQueryChain,
  createExtractPersonNameChain,
  createDocumentEvaluatorChain,
  createStreamingAnswerChain,
} from "../utils/chain.util";
import type { Document } from "langchain/document";
import getPersonSummary from "./wikipedia.service";

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

const extractPersonName = async (question: string, sessionId: string) => {
  try {
    const llm = initLLM();
    const extractPersonNameChain = createExtractPersonNameChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await extractPersonNameChain.invoke({
      history: historyText,
      question: question,
    });

    return result === "none" ? null : result;
  } catch (err) {
    throw err
  }
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

    if (result.includes("vectorstore")) {
      return "vectorstore";
    }
    if (result.includes("person_info")) {
      return "person_info";
    }
    return "casual_convo";
  } catch (err) {
    throw err
  }
};

const rewriteQuery = async (question: string, sessionId: string, mode: string) => {
  try {
    const llm = initLLM();
    const rewriteChain = createRewriteQueryChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await rewriteChain.invoke({
      history: historyText,
      question: question,
      mode: mode
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

    const relevantDocs: Document[] = [];
    let hasDirectAnswer = false;

    for (const doc of documents) {
      const result = await evaluatorChain.invoke({
        question: question,
        document: doc.pageContent,
      });

      if (result.includes("direct_answer")) {
        hasDirectAnswer = true;
      }

      if (result.includes("relevant") || result.includes("direct_answer")) {
        relevantDocs.push(doc);
      }
    }

    const needsWebSearch = !hasDirectAnswer;

    return { relevantDocs, needsWebSearch };
  } catch (err) {
    throw err;
  }
}

const generateAnswerWithStreaming = async (question: string, context: string, sessionId: string, res: Response) => {
  try {
    let fullResponse = '';
    const llm = initLLM();
    const streamingChain = createStreamingAnswerChain(llm);

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
    console.log("question", question);
    const queryType = await classifyUserQuery(question, sessionId);

    console.log("queryType", queryType);

    if (queryType === "casual_convo") {
      await generateAnswerWithStreaming(question, "", sessionId, res);
    } else if (queryType === "vectorstore") {
      const rewrittenQuery = await rewriteQuery(question, sessionId, "VECTOR_STORE");
      console.log("rewrittenQuery", rewrittenQuery);
      const docs = await queryCombinedResult(rewrittenQuery);
      let context = "";

      if (docs.length === 0) {
        const webSearchQuery = await rewriteQuery(question, sessionId, "WEB_SEARCH");
        const webResult = await searchWeb(webSearchQuery);
        console.log("webSearchQuery", webSearchQuery);
        console.log("webResult", webResult);

        if (webResult) {
          context = webResult.pageContent;
        }

        await generateAnswerWithStreaming(rewrittenQuery, context, sessionId, res);
        return;
      }

      const { relevantDocs, needsWebSearch } = await evaluateDocuments(
        rewrittenQuery,
        docs
      );
      console.log("relevantDocs", relevantDocs);
      console.log("needsWebSearch", needsWebSearch);

      if (needsWebSearch) {
        const webSearchQuery = await rewriteQuery(question, sessionId, "WEB_SEARCH");
        const webResult = await searchWeb(webSearchQuery);
        console.log("webSearchQuery", webSearchQuery);
        console.log("webResult", webResult);

        const allDocs = [...relevantDocs];
        if (webResult) {
          allDocs.push(webResult);
        }
        console.log("allDocs", allDocs);

        if (allDocs.length > 0) {
          context = allDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");
        }
      } else {
        if (relevantDocs.length > 0) {
          context = relevantDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");
        }
      }

      await generateAnswerWithStreaming(rewrittenQuery, context, sessionId, res);

    } else if (queryType === "person_info") {
      let context = "";
      const personName = await extractPersonName(question, sessionId);
      let personSummary = "";

      if (personName) {
        personSummary = await getPersonSummary(personName);
      }
      console.log("personSummary", personSummary);

      if (!personSummary) {
        const webSearchQuery = await rewriteQuery(question, sessionId, "WEB_SEARCH");
        const webResult = await searchWeb(webSearchQuery);

        if (webResult) {
          context = webResult.pageContent;
        }

        await generateAnswerWithStreaming(question, context, sessionId, res);
        return;
      }

      const personDoc = { pageContent: personSummary, metadata: {} } as Document;
      const { relevantDocs, needsWebSearch } = await evaluateDocuments(
        question,
        [personDoc]
      );
      console.log("relevantDocs", relevantDocs);
      console.log("needsWebSearch", needsWebSearch);

      if (needsWebSearch) {
        const webSearchQuery = await rewriteQuery(question, sessionId, "WEB_SEARCH");
        const webResult = await searchWeb(webSearchQuery);

        const allDocs = [...relevantDocs];
        if (webResult) {
          allDocs.push(webResult);
        }

        if (allDocs.length > 0) {
          context = allDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");
        }
      }
      else {
        if (relevantDocs.length > 0) {
          context = relevantDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");
        }
      }

      await generateAnswerWithStreaming(question, context, sessionId, res);
    }
  } catch (err) {
    throw err
  }
};

export default processUserQueryWithStreaming;