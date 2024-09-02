"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("./Controller/userController");
const router = express_1.default.Router();
router.get("/allUsers", userController_1.allUsers);
router.post("/register", userController_1.register);
exports.default = router;
