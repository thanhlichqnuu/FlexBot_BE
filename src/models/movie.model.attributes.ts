import type { AttributeInfo } from "langchain/chains/query_constructor";

const movieAttribute: AttributeInfo[] = [
  {
    name: "release_year",
    description: "Năm phát hành phim", 
    type: "number",
  },
  {
    name: "status",
    description: "Trạng thái phim: ['Trailer', 'Đang chiếu', 'Hoàn tất']",
    type: "string",
  },
  {
    name: "director",
    description: "Đạo diễn phim",
    type: "string",
  },
  {
    name: "actor",
    description: "Danh sách diễn viên phim", 
    type: "string",
  },
  {
    name: "duration",
    description: "Thời lượng một tập phim", 
    type: "string",
  },
  {
    name: "episode_total",
    description: "Tổng số tập phim", 
    type: "string",
  },
  {
    name: "country",
    description: "Quốc gia sản xuất phim", 
    type: "string",
  },
  {
    name: "genres",
    description: "Danh sách thể loại phim", 
    type: "string",
  }
];

export default movieAttribute;