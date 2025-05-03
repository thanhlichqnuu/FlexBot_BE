import type { Response } from "express";
import initLLM from "../config/llm.config";
import {
  createClassificationChain,
  createRewriteQueryChain,
  createExtractPersonNameChain,
  createStreamingAnswerChain,
} from "../utils/chain.util";
import getPersonSummary from "./wikipedia.service";

import {
  getChatHistory,
  addMessageToHistory,
} from "./conversations.service";

import { queryCombinedResult } from "./vectorStore.service";
import type Message from "../models/message.model";

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

const rewriteQuery = async (question: string, sessionId: string) => {
  try {
    const llm = initLLM();
    const rewriteChain = createRewriteQueryChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistory(history);

    const result = await rewriteChain.invoke({
      history: historyText,
      question: question,
    });

    return result || question;
  } catch (err) {
    throw err
  }
};

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
    const queryType = await classifyUserQuery(question, sessionId);
    
    if (queryType === "casual_convo") {
      await generateAnswerWithStreaming(question, "", sessionId, res);
    } else if (queryType === "vectorstore") {
      const rewrittenQuery = await rewriteQuery(question, sessionId);
      const docs = await queryCombinedResult(rewrittenQuery);

      let context = "";
      if (docs.length > 0) {
        context = docs.map((doc) => doc.pageContent).join("\n\n---\n\n");
      }
      
      await generateAnswerWithStreaming(rewrittenQuery, context, sessionId, res);
    } else if (queryType === "person_info") { 
      const personName = await extractPersonName(question, sessionId);
      let personSummary = "";
      
      if (personName) {
        personSummary = await getPersonSummary(personName);
      }
      
      await generateAnswerWithStreaming(question, personSummary, sessionId, res);
    }
  } catch (err) {
    throw err
  }
};

export default processUserQueryWithStreaming;