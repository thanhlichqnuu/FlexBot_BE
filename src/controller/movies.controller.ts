import type { Request, Response } from "express";
import { syncMoviesToVectorStore } from "../services/vectorStore.service";
import { successResponse, errorResponse } from "../utils/response.util";

const syncMoviesController = async (req: Request, res: Response) => {
  try {
    const moviesLength = await syncMoviesToVectorStore();
    successResponse(res, 200, moviesLength);
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }
  }
};

export { syncMoviesController };