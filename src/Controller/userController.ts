import { Request, Response } from "express";
import User from "../models/userModel";

export const allUsers = async (req: Request, res: Response) => {
  const allUsers = await User.find().exec();
  res.status(200).json({ allUsers });
};
