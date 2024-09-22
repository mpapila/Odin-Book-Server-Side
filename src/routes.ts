import express from "express";
import {
  acceptFriendRequest,
  addFriend,
  allUsers,
  login,
  myPendingFriendsList,
  register,
} from "./Controller/userController";
import { verifyToken } from "./Controller/middleware";

const router = express.Router();

router.get("/allUsers", verifyToken, allUsers);
router.post("/register", register);
router.post("/login", login);
router.post("/addFriend", verifyToken, addFriend);
router.post("/acceptFriend", verifyToken, acceptFriendRequest);
router.get("/myPendingFriendsList", verifyToken, myPendingFriendsList);

export default router;
