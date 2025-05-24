import express from "express";
import type { Application } from "express";
import { syncMoviesController } from "../controller/movies.controller";
import {
  authenticateAccessToken,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = express.Router();

const initMoviesRoutes = (app: Application) => {
  router.post(
    "/sync",
    authenticateAccessToken,
    authorizeRoles(["admin"]),
    syncMoviesController
  );
  return app.use("/api/v1/movies", router);
};

export default initMoviesRoutes;
