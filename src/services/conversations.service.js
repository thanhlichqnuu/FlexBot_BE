import { v4 as uuidv4 } from "uuid";
import { mongoCollection } from "../config/mongodb.config";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";

const createChatSession = async (userId) => {
  const sessionId = uuidv4();

  const chatMessage = {
    _id: sessionId,
    userId,
    createdAt: new Date()
  };

  try {
    await mongoCollection.insertOne(chatMessage);
    return sessionId;
  } catch (err) {
    throw err;
  }
};

const getAllChatSessions = async (userId) => {
  try {
    const sessionsCursor = mongoCollection.find(
        { userId: userId },
        { projection: { _id: 1} } 
    )
    .sort({ createdAt: -1 });

    const sessionsArray = await sessionsCursor.toArray();
    const sessionIds = sessionsArray.map(session => session._id);

    return sessionIds; 
  } catch (err) {
    throw err; 
  }
};

const getChatHistory = async (sessionId) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId });
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    const messages = await chatMessageHistory.getMessages();

    const simplifiedMessages = messages.map(msg => {
      let role = "";
      const messageType = msg.getType()

      if (messageType === "human") {
        role = 'user'; 
      } else if (messageType === "ai") {
        role = 'chatbot'; 
      }

      return {
        role: role,
        content: msg.content 
      };
    });

    return simplifiedMessages;

  } catch (err) {
    throw err;
  }
};

const addMessageToHistory = async (sessionId, message) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId });
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: existedSession._id,
    });

    if (message.role === "user") {
      await chatMessageHistory.addMessage(new HumanMessage(message.content));
    } else if (message.role === "assistant") {
      await chatMessageHistory.addMessage(new AIMessage(message.content));
    }
  } catch (err) {
    throw err;
  }
};

const clearChatHistory = async (sessionId) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId });
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    await chatMessageHistory.clear();
  } catch (err) {
    throw err;
  }
};

const deleteChatSession = async (sessionId) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId });
    if (!existedSession) {
      throw new Error("Session not found!");
    }
    
    await mongoCollection.deleteOne({ _id: sessionId });
  } catch (err) {
    throw err;
  }
};

const deleteAllChatSessions = async (userId) => {
  try {
    await mongoCollection.deleteMany({ userId: userId });
  } catch (err) {
    throw err;
  }
}

export {
  createChatSession,
  getAllChatSessions,
  getChatHistory,
  addMessageToHistory,
  clearChatHistory,
  deleteChatSession,
  deleteAllChatSessions
};
