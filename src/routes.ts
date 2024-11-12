import express from "express";
import {
  acceptFriendRequest,
  addFriend,
  allUsers,
  editProfile,
  getUserProfile,
  login,
  myFriendList,
  myPendingFriendsList,
  register,
  removePhoto,
  savePhoto,
} from "./Controller/userController";
import { verifyToken } from "./Controller/middleware";
import {
  createPost,
  friendsPosts,
  getPostById,
  likePosts,
  postAttributes,
} from "./Controller/postController";
import { createComment } from "./Controller/CommentController";
import {
  getNotification,
  healthCheck,
} from "./Controller/NotificationController";

const router = express.Router();

router.get("/allUsers", verifyToken, allUsers);
router.post("/register", register);
router.post("/login", login);
router.post("/addFriend", verifyToken, addFriend);
router.post("/acceptFriend", verifyToken, acceptFriendRequest);
router.get("/myPendingFriendsList", verifyToken, myPendingFriendsList);
router.get("/myFriends", verifyToken, myFriendList);
router.post("/newPost", verifyToken, createPost);
router.get("/myFriendsPost", verifyToken, friendsPosts);
router.post("/likePost", verifyToken, likePosts);
router.get("/postAttribute", verifyToken, postAttributes);
router.get("/posts/:id", verifyToken, getPostById);
router.post("/newComment", verifyToken, createComment);
router.get("/notification", verifyToken, getNotification);
router.get("/profileById/:id", verifyToken, getUserProfile);
router.post("/profile/:id/edit", verifyToken, editProfile);
router.post("/:profileId/addPhoto", verifyToken, savePhoto);
router.post("/removePhoto", verifyToken, removePhoto);
router.get("/health-check", healthCheck);

export default router;
