import processUserQuery from "../services/chat.service.js";
import {
  createChatSession,
  getAllChatSessions,
  getChatHistory,
  clearChatHistory,
  deleteChatSession,
  deleteAllChatSessions
} from "../services/conversations.service.js";

const createSessionController = async (req, res) => {
  const { userId } = req.body;

  try {
    const sessionId = await createChatSession(userId);
    return res.status(201).json({
      statusCode: 201,
      isSuccess: true,
      result: sessionId,
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

const getAllChatSessionsController = async (req, res) => {
  try {
    const sessions = await getAllChatSessions(Number(req.params.id));
    return res.status(200).json({
      statusCode: 200,
      isSuccess: true,
      result: sessions,
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

const getSessionHistoryController = async (req, res) => {
  try {
    const messages = await getChatHistory(req.params.id);
    return res.status(200).json({
      statusCode: 200,
      isSuccess: true,
      result: messages,
    });
  } catch (err) {
    if (err.message === "Session not found!") {
      return res.status(404).json({
        statusCode: 404,
        isSuccess: false,
        error: "Not Found",
        message: err.message,
      });
    }
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

const sendMessageController = async (req, res) => {
  const { message } = req.body;

  try {
    const answer = await processUserQuery(message, req.params.id);
    return res.status(201).json({
      statusCode: 201,
      isSuccess: true,
      result: answer,
    });
  } catch (err) {
    if (err.message === "Session not found!") {
      return res.status(404).json({
        statusCode: 404,
        isSuccess: false,
        error: "Not Found",
        message: err.message,
      });
    }
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

const clearSessionHistoryController = async (req, res) => {
  try {
    await clearChatHistory(req.params.id);
    return res.status(204).send();
  } catch (err) {
    if (err.message === "Session not found!") {
      return res.status(404).json({
        statusCode: 404,
        isSuccess: false,
        error: "Not Found",
        message: err.message,
      });
    }
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

const deleteSessionController = async (req, res) => {
  try {
    await deleteChatSession(req.params.id);
    return res.status(204).send();
  } catch (err) {
    if (err.message === "Session not found!") {
      return res.status(404).json({
        statusCode: 404,
        isSuccess: false,
        error: "Not Found",
        message: err.message,
      });
    }
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

const deleteAllChatSessionsController = async (req, res) => {
  try {
    await deleteAllChatSessions(Number(req.params.id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      isSuccess: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later!",
    });
  }
};

export {
  createSessionController,
  getAllChatSessionsController,
  getSessionHistoryController,
  sendMessageController,
  clearSessionHistoryController,
  deleteSessionController,
  deleteAllChatSessionsController
};
