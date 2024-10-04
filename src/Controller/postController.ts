import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/PostModel";
import Friendship from "../models/friendshipModel";
import User from "../models/userModel";
import { Like } from "../type";

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
      await newPost.save();
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
    }).select("firstName lastName _id");
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

    const alreadyLiked = post.likes.some(
      (like: Like) => like.userId.toString() === myId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (like: Like) => like.userId.toString() !== myId
      );
    } else {
      post.likes.push({ userId: myId });
    }

    const savedPost = await post.save();
    // console.log("Post after save:", savedPost);

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
    const nameInfo = await User.findById(post.userId).select("-password");
    const commentsUserIds = post.comments.map(
      (comment: { userId: string }) => comment.userId
    );
    console.log("commentsUserIds", commentsUserIds);
    const commentNameInfo = await User.find({
      _id: { $in: commentsUserIds },
    }).select("firstName lastName");

    console.log("commentNameInfo", commentNameInfo);

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
