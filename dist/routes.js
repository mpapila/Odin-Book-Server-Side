"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("./Controller/userController");
const middleware_1 = require("./Controller/middleware");
const router = express_1.default.Router();
router.get("/allUsers", middleware_1.verifyToken, userController_1.allUsers);
router.post("/register", userController_1.register);
router.post("/login", userController_1.login);
router.post("/addFriend", middleware_1.verifyToken, userController_1.addFriend);
router.get("/myPendingFriendsList", middleware_1.verifyToken, userController_1.myPendingFriendsList);
exports.default = router;
