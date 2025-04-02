import express from "express";
import {
  checkNotEmpty,
  checkIntegerNumber,
} from "../validation/auth.validation";
import { validate } from "../middleware/auth.middleware";
import {
  createSessionController,
  getAllChatSessionsController,
  getSessionHistoryController,
  sendMessageController,
  clearSessionHistoryController,
  deleteSessionController,
  deleteAllChatSessionsController,
} from "../controller/chat.controller";
import {
  authenticateAccessToken,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = express.Router();

const initChatRoutes = (app) => {
  router.post(
    "/",
    validate((req) => {
      checkNotEmpty(req.body.userId, "User ID");
      checkIntegerNumber(req.body.userId, "User ID");
    }),
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    createSessionController
  );
  router.get(
    "/users/:id",
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    getAllChatSessionsController
  );
  router.get(
    "/:id",
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    getSessionHistoryController
  );
  router.post(
    "/:id",
    validate((req) => {
      checkNotEmpty(req.body.message, "Message");
    }),
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    sendMessageController
  );
  router.delete(
    "/:id/clear",
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    clearSessionHistoryController
  );
  router.delete(
    "/:id",
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    deleteSessionController
  );
  router.delete(
    "/users/:id",
    authenticateAccessToken,
    authorizeRoles("subscriber"),
    deleteAllChatSessionsController
  );
  return app.use("/api/v1/sessions", router);
};

export default initChatRoutes;
