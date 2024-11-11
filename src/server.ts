import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import router from "./routes";
import compression from "compression";
import helmet from "helmet";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router);
dotenv.config();
app.use(compression());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": [
        "'self' 'unsafe-inline'",
        "code.jquery.com",
        "cdn.jsdelivr.net",
      ],
    },
  })
);

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
