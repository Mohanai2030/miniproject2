import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import buyerVisibilityRoutes from "./routes/buyerVisibilityRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", (req, res, next) => {
  console.log("hello world");
  next()
});

app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/buyer-visibility", buyerVisibilityRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/trips", tripRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
