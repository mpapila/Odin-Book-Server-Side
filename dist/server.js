"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const routes_1 = __importDefault(require("./routes"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/", routes_1.default);
dotenv_1.default.config();
app.use((0, compression_1.default)());
app.use(helmet_1.default.contentSecurityPolicy({
    directives: {
        "script-src": [
            "'self' 'unsafe-inline'",
            "code.jquery.com",
            "cdn.jsdelivr.net",
        ],
    },
}));
const mongoDB = process.env.MONGODB_URI;
const PORT = process.env.PORT;
if (!mongoDB) {
    throw new Error("MONGODB_URI environment variable is not defined");
}
mongoose_1.default.set("strictQuery", false);
mongoose_1.default
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
