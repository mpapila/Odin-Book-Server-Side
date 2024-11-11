import mongoose, { Types } from "mongoose";

export interface DecodedToken {
  [x: string]: any;
  _id: string;
}

export type Like = {
  userId: Types.ObjectId;
  createdAt: Date;
};
