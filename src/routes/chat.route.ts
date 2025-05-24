import express from "express";
import type { Application, Request } from "express";
import {
  checkNotEmpty,
  checkIntegerNumber,
} from "../validation/auth.validation";
import { validate } from "../middleware/auth.middleware";
import {
  createSessionController,
  getAllChatSessionsController,
  getSessionHistoryController,
  streamMessageController,
  clearSessionHistoryController,
  deleteSessionController,
  deleteAllChatSessionsController,
} from "../controller/chat.controller";
import {
  authenticateAccessToken,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = express.Router();

const initChatRoutes = (app: Application) => {
  router.post(
    "/",
    validate((req: Request) => {
      checkNotEmpty(req.body.userId, "User ID");
      checkIntegerNumber(req.body.userId, "User ID");
    }),
    // authenticateAccessToken,
    // authorizeRoles(["subscriber"], ["Standard", "Premium"]),
    createSessionController
  );
  router.get(
    "/users/:id",
    authenticateAccessToken,
    authorizeRoles(["subscriber"]),
    getAllChatSessionsController
  );
  router.get(
    "/:id",
    authenticateAccessToken,
    authorizeRoles(["subscriber"]),
    getSessionHistoryController
  );
  router.post(
    "/:id",
    validate((req: Request) => {
      checkNotEmpty(req.body.message, "Message");
    }),
    // authenticateAccessToken,
    // authorizeRoles(["subscriber"], ["Standard", "Premium"]),
    streamMessageController
  );
  router.delete(
    "/:id/clear",
    authenticateAccessToken,
    // authorizeRoles(["subscriber"], ["Standard", "Premium"]),
    clearSessionHistoryController
  );
  router.delete(
    "/:id",
    authenticateAccessToken,
    // authorizeRoles(["subscriber"], ["Standard", "Premium"]),
    deleteSessionController
  );
  router.delete(
    "/users/:id",
    authenticateAccessToken,
    // authorizeRoles(["subscriber"], ["Standard", "Premium"]),
    deleteAllChatSessionsController
  );
  return app.use("/api/v1/sessions", router);
};

export default initChatRoutes;
