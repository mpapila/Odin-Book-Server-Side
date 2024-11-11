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
exports.getPostById = exports.postAttributes = exports.likePosts = exports.friendsPosts = exports.createPost = void 0;
const express_validator_1 = require("express-validator");
const PostModel_1 = __importDefault(require("../models/PostModel"));
const friendshipModel_1 = __importDefault(require("../models/friendshipModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const mongoose_1 = require("mongoose");
const NotificationModel_1 = __importDefault(require("../models/NotificationModel"));
exports.createPost = [
    (0, express_validator_1.body)("content").not().isEmpty().withMessage("Content cannot be empty"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const myId = req.userId;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errorMessage: errors.array() });
        }
        const { content } = req.body;
        try {
            const newPost = new PostModel_1.default({
                userId: myId,
                content,
                likes: [],
                comments: [],
            });
            const myNameInfo = yield userModel_1.default.findById({
                _id: myId,
            }, "firstName lastName");
            yield newPost.save();
            const newNotification = new NotificationModel_1.default({
                userId: myId,
                message: `${myNameInfo === null || myNameInfo === void 0 ? void 0 : myNameInfo.firstName} ${myNameInfo === null || myNameInfo === void 0 ? void 0 : myNameInfo.lastName} has added new post`,
                type: "profile_edit",
            });
            yield newNotification.save();
            return res
                .status(201)
                .json({ message: "Sent post successfully", newPost });
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
const friendsPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    try {
        const myFriends = yield friendshipModel_1.default.find({
            $or: [{ requesterId: myId }, { receiverId: myId }],
            status: "accepted",
        });
        const myFriendsId = myFriends.map((friendship) => {
            if (friendship.requesterId === myId) {
                return friendship.receiverId;
            }
            else {
                return friendship.requesterId;
            }
        });
        const myFriendsInfos = yield userModel_1.default.find({
            _id: { $in: myFriendsId.concat(myId) },
        }).select("firstName lastName _id profilePhoto");
        const myFriendsPosts = yield PostModel_1.default.find({
            userId: { $in: myFriendsId.concat(myId) },
        }).sort({ createdAt: -1 });
        // console.log("myFriendsPosts", myFriendsPosts);
        const friendsPostswithInfo = myFriendsPosts.map((post) => {
            const friend = myFriendsInfos.find((friend) => friend._id.toString() === post.userId.toString());
            return Object.assign(Object.assign({}, post.toObject()), { firstName: friend ? friend.firstName : "Unknown", lastName: friend ? friend.lastName : "Unknown", profilePhoto: friend ? friend.profilePhoto : "Unknown" });
        });
        // console.log("friendsPostswithInfo", friendsPostswithInfo);
        res.status(200).json({ friendsPostswithInfo });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.friendsPosts = friendsPosts;
const likePosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    const { postId } = req.body;
    try {
        const post = yield PostModel_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const postOwnerInfo = yield userModel_1.default.findById(post.userId, "firstName lastName");
        const myInfo = yield userModel_1.default.findById(myId, "firstName lastName");
        const newNotification = new NotificationModel_1.default({
            userId: myId,
            message: `${myInfo === null || myInfo === void 0 ? void 0 : myInfo.firstName} ${myInfo === null || myInfo === void 0 ? void 0 : myInfo.lastName} liked your post`,
            type: "like",
            recipient: postOwnerInfo === null || postOwnerInfo === void 0 ? void 0 : postOwnerInfo._id,
            postId: post._id,
        });
        const alreadyLiked = post.likes.some((like) => like.userId.toString() === myId);
        if (alreadyLiked) {
            post.likes.pull({ userId: new mongoose_1.Types.ObjectId(myId) });
            yield NotificationModel_1.default.findOneAndDelete({
                userId: myId,
                recipient: postOwnerInfo === null || postOwnerInfo === void 0 ? void 0 : postOwnerInfo._id,
                postId: post._id,
            });
        }
        else {
            post.likes.push({ userId: myId });
            console.log("newNotification", newNotification);
            if ((postOwnerInfo === null || postOwnerInfo === void 0 ? void 0 : postOwnerInfo._id.toString()) !== (myInfo === null || myInfo === void 0 ? void 0 : myInfo._id.toString())) {
                yield newNotification.save();
            }
        }
        const savedPost = yield post.save();
        console.log("Post after save:", savedPost);
        res.status(200).json({
            message: alreadyLiked ? "Like removed" : "Post liked",
            post: savedPost,
        });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.likePosts = likePosts;
const postAttributes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    const postId = req.query.postId;
    try {
        const post = yield PostModel_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const alreadyLiked = post.likes.some((like) => like.userId.toString() === myId);
        const postLikeCount = post.likes.length;
        // console.log("postLikeCount", postLikeCount);
        res.status(200).json({
            alreadyLiked,
            postLikeCount,
        });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.postAttributes = postAttributes;
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("params", req.params);
    const postId = req.params.id;
    try {
        const post = yield PostModel_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        console.log("post", post);
        const nameInfo = yield userModel_1.default.findById(post.userId).select("-password");
        const commentsUserIds = post.comments.map((comment) => comment.userId.toString());
        // console.log("commentsUserIds", commentsUserIds);
        const commentNameInfo = yield userModel_1.default.find({
            _id: { $in: commentsUserIds },
        }).select("firstName lastName profilePhoto");
        // console.log("commentNameInfo", commentNameInfo);
        // console.log("commentNameInfo", commentNameInfo);
        console.log("post", post, nameInfo);
        res.status(200).json({
            post,
            nameInfo,
            commentNameInfo,
        });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getPostById = getPostById;
