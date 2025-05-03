import { Document } from "@langchain/core/documents";
import type Movie  from "../models/movie.model";
import type MovieDocument from "../models/movieDocument.model";
import axios from "axios";

const MAIN_BACKEND_API = Bun.env.MAIN_BACKEND_API

const mappingMovieDocument = (movie: Movie) => {
  return {
    pageContent: `${movie.name} (tên gốc ${movie.origin_name}) là một bộ phim thuộc thể loại ${movie.genres} của ${movie.country}, do ${movie.director} đạo diễn và ra mắt năm ${movie.release_year}. Hiện phim đang ở trạng thái ${movie.status}. Phim có sự tham gia của các diễn viên ${movie.actor}. Nội dung chính: ${movie.description}. Phim có tổng cộng ${movie.episode_total} tập, mỗi tập có thời lượng ${movie.duration}.`,
    metadata: {
      name: movie.name,
      origin_name: movie.origin_name,
      description: movie.description,
      release_year: movie.release_year,
      status: movie.status,
      director: movie.director,
      actor: movie.actor,
      duration: movie.duration,
      episode_total: movie.episode_total,
      country: movie.country,
      genres: movie.genres,
    },
  };
};

const fetchAllMovies = async () => {
  try {
    const { data } = await axios.get(`${MAIN_BACKEND_API}/movies?limit=331`);
    
    if (data.statusCode === 200 && data.isSuccess) {
      return data.result?.data;
    }
  } catch (err) {
    throw err;
  }
};

const getAllMovieDocuments = async () => {
  try {
    const movies = await fetchAllMovies();
    const movieDocumentsRaw = movies.map((movie: Movie) => mappingMovieDocument(movie));
    const movieDocuments = movieDocumentsRaw.map(
      (document: MovieDocument) =>
        new Document({
          pageContent: document.pageContent,
          metadata: document.metadata,
        })
    );
    return movieDocuments
  } catch (err) {
    throw err;
  }
};

export default getAllMovieDocuments