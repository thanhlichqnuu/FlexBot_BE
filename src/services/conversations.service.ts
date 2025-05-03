import { v4 as uuidv4 } from "uuid";
import type { Document } from "mongodb";
import { mongoCollection } from "../config/mongodb.config";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import type Message from "../models/message.model";

const createChatSession = async (userId: number) => {
  const sessionId = uuidv4();

  const chatMessage = {
    _id: sessionId,
    userId,
    createdAt: new Date()
  } as Document;

  try {
    await mongoCollection.insertOne(chatMessage);
    return sessionId;
  } catch (err) {
    throw err;
  }
};

const getAllChatSessions = async (userId: number) => {
  try {
    const sessions = await mongoCollection.find(
        { userId: userId },
        { projection: { _id: 1} } 
    )
    .sort({ createdAt: -1 }).toArray();

    const sessionIds = sessions.map(session => session._id);

    return sessionIds; 
  } catch (err) {
    throw err; 
  }
};

const getChatHistory = async (sessionId: string) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    const messages = await chatMessageHistory.getMessages();

    const simplifiedMessages = messages.map(msg => {
      let role: "user" | "assistant" = "user"; 
      const messageType = msg.getType()

      if (messageType === "human") {
        role = 'user'; 
      } else if (messageType === "ai") {
        role = 'assistant'; 
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

const addMessageToHistory = async (sessionId: string, message: Message) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    if (message.role === "user") {
      await chatMessageHistory.addMessage(new HumanMessage({ content: message.content }));
    } else if (message.role === "assistant") {
      await chatMessageHistory.addMessage(new AIMessage({ content: message.content }));
    }
  } catch (err) {
    throw err;
  }
};

const clearChatHistory = async (sessionId: string) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
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

const deleteChatSession = async (sessionId: string) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    await chatMessageHistory.clear();
    
    await mongoCollection.deleteOne({ _id: sessionId } as any);
  } catch (err) {
    throw err;
  }
};

const deleteAllChatSessions = async (userId: number) => {
  try {
    const sessions = await mongoCollection.find({ userId: userId }).toArray();

    const clearPromises = sessions.map(session => {
      const chatMessageHistory = new MongoDBChatMessageHistory({
        collection: mongoCollection,
        sessionId: session._id.toString(),
      });
      
      return chatMessageHistory.clear();
    });

    await Promise.allSettled(clearPromises);
    await mongoCollection.deleteMany({ userId: userId });
  } catch (err) {
    throw err;
  }
};

export {
  createChatSession,
  getAllChatSessions,
  getChatHistory,
  addMessageToHistory,
  clearChatHistory,
  deleteChatSession,
  deleteAllChatSessions
};
