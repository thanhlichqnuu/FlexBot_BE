import { syncMoviesToVectorStore } from "../services/vectorStore.service";

const syncMoviesController = async (req, res) => {
  try {
    const movies = await syncMoviesToVectorStore();
    return res.status(200).json({
      statusCode: 200,
      isSuccess: true,
      result: movies,
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

export { syncMoviesController };