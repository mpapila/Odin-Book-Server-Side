import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/PostModel";
import User from "../models/userModel";
import Notification from "../models/NotificationModel";

export const createComment = [
  body("content").not().isEmpty().withMessage("Content cannot be empty"),

  async (req: Request, res: Response) => {
    const myId = req.userId;
    const errors = validationResult(req);
    const { content, postId } = req.body;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorMessage: errors.array() });
    }

    try {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const postOwnerInfo = await User.findById(
        post.userId,
        "firstName lastName"
      );
      const myInfo = await User.findById(myId, "firstName lastName");
      post.comments.push({ userId: myId, content });
      const newNotification = new Notification({
        userId: myId,
        message: `${myInfo?.firstName} ${myInfo?.lastName} has commented to your post`,
        type: "comment",
        recipient: postOwnerInfo?._id,
        postId: post._id,
      });
      if (postOwnerInfo?._id.toString() !== myInfo?._id.toString()) {
        await newNotification.save();
      }
      const savedPost = await post.save();

      res.status(200).json({
        post: savedPost,
      });
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
