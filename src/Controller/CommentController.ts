import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import Post from "../models/PostModel";

export const createComment = [
  body("content").not().isEmpty().withMessage("Content cannot be empty"),

  async (req: Request, res: Response) => {
    const myId = req.userId;
    const errors = validationResult(req);
    console.log("req", req.body);
    const { content, postId } = req.body;
    console.log("content", content);
    console.log("postId", postId);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorMessage: errors.array() });
    }

    try {
      const post = await Post.findById(postId);
      post.comments.push({ userId: myId, content });
      const savedPost = await post.save();
      console.log("saved post", savedPost);
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
