import { Request, Response } from "express";
import Notification from "../models/NotificationModel";
import User from "../models/userModel";
import Friendship from "../models/friendshipModel";

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
};

export const getNotification = async (req: Request, res: Response) => {
  const myId = req.userId;

  try {
    const myFriends = await Friendship.find({
      $or: [{ requesterId: myId }, { receiverId: myId }],
      status: "accepted",
    });
    const myFriendsIds = myFriends.map((myFriends) => {
      return myFriends.requesterId === myId
        ? myFriends.receiverId
        : myFriends.requesterId;
    });
    const notifications = await Notification.find({
      $or: [
        { recipient: myId },
        {
          $and: [
            { recipient: { $exists: false } },
            { userId: { $in: myFriendsIds } },
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    const today = new Date().toISOString().split("T")[0].slice(5);
    console.log("today", today);
    const allBirthdays = await User.find({}, "firstName lastName dateOfBirth");
    const formattedBirthdays = allBirthdays
      .map((user) => ({
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth.toISOString().split("T")[0].slice(5),
      }))
      .filter((user) => user.dateOfBirth === today);

    res.status(200).json({
      notifications,
      birthdaysToday: formattedBirthdays,
    });
  } catch (err) {
    console.error("Error fetching data: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
