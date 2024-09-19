import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    requesterId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Friendship = mongoose.model("Friendship", friendshipSchema);

export default Friendship;
