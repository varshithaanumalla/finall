import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

// Import routes
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import watchpartyroutes from "./routes/watchparty.js";
import downloadroutes from "./routes/download.js";
import subscriptionroutes from "./routes/subscription.js";
import themeroutes from "./routes/theme.js";

// Express application (exported so it can be imported by tests without
// starting the HTTP/Socket.IO server or connecting to MongoDB).
const app = express();

app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));

app.get("/", (req, res) => {
  res.send("You tube backend is working");
});

app.use(bodyParser.json());

// Register routes
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/watchparty", watchpartyroutes);
app.use("/downloads", downloadroutes);
app.use("/subscription", subscriptionroutes);
app.use("/theme", themeroutes);

export default app;
