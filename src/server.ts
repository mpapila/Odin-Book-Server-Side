import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import Post from "./models/PostModel";
import router from "./routes";
import Notification from "./models/NotificationModel";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router);
dotenv.config();

const mongoDB = process.env.MONGODB_URI;
const PORT = process.env.PORT;

if (!mongoDB) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

mongoose.set("strictQuery", false);

mongoose
  .connect(mongoDB)
  .then((result) => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB", error);
  });

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
