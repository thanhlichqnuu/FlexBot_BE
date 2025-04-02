import movieMapping from "../models/movie.model.mapping";
import axios from "axios";

const MAIN_BACKEND_URL = Bun.env.MAIN_BACKEND_URL

const getAllMovies = async () => {
  try {
    const { data } = await axios.get(`${MAIN_BACKEND_URL}/movies?limit=331`);
    
    if (data.statusCode === 200 && data.isSuccess) {
      return data.result?.data;
    }
  } catch (err) {
    throw err;
  }
};

const processMoviesForVectorStore = async () => {
  try {
    const movies = await getAllMovies();
    return movies.map(movie => movieMapping(movie));
  } catch (err) {
    throw err;
  }
};

export { processMoviesForVectorStore };