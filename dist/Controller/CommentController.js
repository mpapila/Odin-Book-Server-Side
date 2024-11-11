"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = void 0;
const express_validator_1 = require("express-validator");
const PostModel_1 = __importDefault(require("../models/PostModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const NotificationModel_1 = __importDefault(require("../models/NotificationModel"));
exports.createComment = [
    (0, express_validator_1.body)("content").not().isEmpty().withMessage("Content cannot be empty"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const myId = req.userId;
        const errors = (0, express_validator_1.validationResult)(req);
        const { content, postId } = req.body;
        if (!errors.isEmpty()) {
            return res.status(400).json({ errorMessage: errors.array() });
        }
        try {
            const post = yield PostModel_1.default.findById(postId);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            const postOwnerInfo = yield userModel_1.default.findById(post.userId, "firstName lastName");
            const myInfo = yield userModel_1.default.findById(myId, "firstName lastName");
            post.comments.push({ userId: myId, content });
            const newNotification = new NotificationModel_1.default({
                userId: myId,
                message: `${myInfo === null || myInfo === void 0 ? void 0 : myInfo.firstName} ${myInfo === null || myInfo === void 0 ? void 0 : myInfo.lastName} has commented to your post`,
                type: "comment",
                recipient: postOwnerInfo === null || postOwnerInfo === void 0 ? void 0 : postOwnerInfo._id,
                postId: post._id,
            });
            if ((postOwnerInfo === null || postOwnerInfo === void 0 ? void 0 : postOwnerInfo._id.toString()) !== (myInfo === null || myInfo === void 0 ? void 0 : myInfo._id.toString())) {
                yield newNotification.save();
            }
            const savedPost = yield post.save();
            res.status(200).json({
                post: savedPost,
            });
        }
        catch (err) {
            if (err instanceof Error) {
                const payload = {
                    errorMessage: err.message,
                };
                console.error("Registration error: ", payload);
                return res.status(500).json(payload);
            }
            throw err;
        }
    }),
];
