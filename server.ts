import express from "express";
import cors from "cors";
import initChatRoutes from "./src/routes/chat.route";
import initMoviesRoutes from "./src/routes/movies.route";
import helmet from "helmet";
import compression from "compression";
import { connectMongoAtlas } from "./src/config/mongodb.config";

const PORT = Number(Bun.env.PORT);
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  compression({
    level: 6,
    threshold: 100 * 1000,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

initChatRoutes(app);
initMoviesRoutes(app);

connectMongoAtlas()
  .then(async () => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    process.exit(1);
  });
