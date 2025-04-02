import initLLM from "../config/llm.config";
import {
  createClassificationChain,
  createRewriteQueryChain,
  createGenerateAnswerChain,
} from "../utils/chain.util.js";

import {
  getChatHistory,
  addMessageToHistory,
} from "./conversations.service.js";

import { queryCombined } from "./vectorStore.service.js";

const formatChatHistoryForPrompt = async (history) => {
  if (history.length === 0) {
    return "";
  }

  return history
    .map((msg) => {
      const roleLabel = msg.role === "user" ? "Người dùng" : "Chatbot";
      return `${roleLabel}: ${msg.content}`;
    })
    .join("\n");
};

const classifyUserQuery = async (question, sessionId) => {
  try {
    const llm = initLLM();
    const classificationChain = createClassificationChain(llm);

    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistoryForPrompt(history);

    const result = await classificationChain.invoke({
      history: historyText,
      question: question
    });

    return result.includes("vectorstore") ? "vectorstore" : "casual_convo";
  } catch (err) {
    return "casual_convo";
  }
};

const rewriteQuery = async (question, sessionId) => {
  try {
    const history = await getChatHistory(sessionId);
    const historyText = await formatChatHistoryForPrompt(history);

    const llm = initLLM();
    const rewriteChain = createRewriteQueryChain(llm);

    const result = await rewriteChain.invoke({
      history: historyText,
      question: question
    });

    return result || question;
  } catch (err) {
    return question;
  }
};

const generateAnswer = async (question, context) => {
  try {
    const llm = initLLM();
    const answerChain = createGenerateAnswerChain(llm);

    const result = await answerChain.invoke({
      question: question,
      context: context || "",
    });

    return result;
  } catch (err) {
    return "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  }
};

const processUserQuery = async (question, sessionId) => {
  try {
    await addMessageToHistory(sessionId, { role: "user", content: question });

    const queryType = await classifyUserQuery(question, sessionId);

    let rawAnswer = "";

    if (queryType === "casual_convo") {
      rawAnswer = await generateAnswer(question, "");
    } else if (queryType === "vectorstore") {
      const rewrittenQuery = await rewriteQuery(question, sessionId);

      const docs = await queryCombined(rewrittenQuery);

      let context = "";
      if (docs?.length > 0) {
        context = docs.map((doc) => doc.pageContent).join("\n\n---\n\n");
      }

      rawAnswer = await generateAnswer(rewrittenQuery, context);
    }

    let formattedAnswer = rawAnswer;

    formattedAnswer = formattedAnswer
    .replaceAll("\\", "")         
    .replaceAll("\n", " ")        
    .replaceAll("*", "")         
    .replaceAll(/\s+/g, " ")    
    .trim();  

    await addMessageToHistory(sessionId, {
      role: "assistant",
      content: formattedAnswer,
    });

    return formattedAnswer;
  } catch (err) {
    if (err.message === "Session not found!") {
      throw err;
    }
    return "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  }
};

export default processUserQuery;
