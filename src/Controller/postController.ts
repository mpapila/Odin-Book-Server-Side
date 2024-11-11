import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/PostModel";
import Friendship from "../models/friendshipModel";
import User from "../models/userModel";
import { Like } from "../type";
import { Types } from "mongoose";
import Notification from "../models/NotificationModel";

export const createPost = [
  body("content").not().isEmpty().withMessage("Content cannot be empty"),

  async (req: Request, res: Response) => {
    const myId = req.userId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorMessage: errors.array() });
    }
    const { content } = req.body;
    try {
      const newPost = new Post({
        userId: myId,
        content,
        likes: [],
        comments: [],
      });
      const myNameInfo = await User.findById(
        {
          _id: myId,
        },
        "firstName lastName"
      );
      await newPost.save();

      const newNotification = new Notification({
        userId: myId,
        message: `${myNameInfo?.firstName} ${myNameInfo?.lastName} has added new post`,
        type: "profile_edit",
      });
      await newNotification.save();
      return res
        .status(201)
        .json({ message: "Sent post successfully", newPost });
    } catch (err) {
      if (err instanceof Error) {
        const payload = {
          errorMessage: err.message,
        };
        console.error("Registration error: ", payload);
        return res.status(500).json(payload);
      }
      throw err;
    }
  },
];

export const friendsPosts = async (req: Request, res: Response) => {
  const myId = req.userId;
  try {
    const myFriends = await Friendship.find({
      $or: [{ requesterId: myId }, { receiverId: myId }],
      status: "accepted",
    });
    const myFriendsId = myFriends.map((friendship) => {
      if (friendship.requesterId === myId) {
        return friendship.receiverId;
      } else {
        return friendship.requesterId;
      }
    });
    const myFriendsInfos = await User.find({
      _id: { $in: myFriendsId.concat(myId) },
    }).select("firstName lastName _id profilePhoto");

    const myFriendsPosts = await Post.find({
      userId: { $in: myFriendsId.concat(myId) },
    }).sort({ createdAt: -1 });
    // console.log("myFriendsPosts", myFriendsPosts);

    const friendsPostswithInfo = myFriendsPosts.map(
      (post: { userId: { toString: () => string }; toObject: () => any }) => {
        const friend = myFriendsInfos.find(
          (friend) => friend._id.toString() === post.userId.toString()
        );
        return {
          ...post.toObject(),
          firstName: friend ? friend.firstName : "Unknown",
          lastName: friend ? friend.lastName : "Unknown",
          profilePhoto: friend ? friend.profilePhoto : "Unknown",
        };
      }
    );
    // console.log("friendsPostswithInfo", friendsPostswithInfo);
    res.status(200).json({ friendsPostswithInfo });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const likePosts = async (req: Request, res: Response) => {
  const myId = req.userId;
  const { postId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const postOwnerInfo = await User.findById(
      post.userId,
      "firstName lastName"
    );
    const myInfo = await User.findById(myId, "firstName lastName");

    const newNotification = new Notification({
      userId: myId,
      message: `${myInfo?.firstName} ${myInfo?.lastName} liked your post`,
      type: "like",
      recipient: postOwnerInfo?._id,
      postId: post._id,
    });

    const alreadyLiked = post.likes.some(
      (like) => like.userId.toString() === myId
    );

    if (alreadyLiked) {
      post.likes.pull({ userId: new Types.ObjectId(myId) });
      await Notification.findOneAndDelete({
        userId: myId,
        recipient: postOwnerInfo?._id,
        postId: post._id,
      });
    } else {
      post.likes.push({ userId: myId });
      console.log("newNotification", newNotification);
      if (postOwnerInfo?._id.toString() !== myInfo?._id.toString()) {
        await newNotification.save();
      }
    }

    const savedPost = await post.save();
    console.log("Post after save:", savedPost);

    res.status(200).json({
      message: alreadyLiked ? "Like removed" : "Post liked",
      post: savedPost,
    });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const postAttributes = async (req: Request, res: Response) => {
  const myId = req.userId;
  const postId = req.query.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const alreadyLiked = post.likes.some(
      (like: Like) => like.userId.toString() === myId
    );
    const postLikeCount = post.likes.length;
    // console.log("postLikeCount", postLikeCount);
    res.status(200).json({
      alreadyLiked,
      postLikeCount,
    });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  // console.log("params", req.params);
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    console.log("post", post);
    const nameInfo = await User.findById(post.userId).select("-password");
    const commentsUserIds = post.comments.map((comment) =>
      comment.userId.toString()
    );
    // console.log("commentsUserIds", commentsUserIds);
    const commentNameInfo = await User.find({
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
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
