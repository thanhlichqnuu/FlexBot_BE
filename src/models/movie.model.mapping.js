const movieMapping = (movie) => {
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

export default movieMapping;
