import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import visitRoutes from "./routes/visitRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { ensureTables } from "./config/ensureTables.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "TreXplore API" }),
);

app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Make sure the AI tables exist, then start. If table creation fails we still
// start (the rest of the site works) but print the real reason.
ensureTables()
  .then(() => console.log("Database tables ready"))
  .catch((err) =>
    console.error(
      "[db] Could not create the recommendation tables:",
      err.message,
    ),
  )
  .finally(() =>
    app.listen(PORT, () =>
      console.log(`TreXplore API running on port ${PORT}`),
    ),
  );
