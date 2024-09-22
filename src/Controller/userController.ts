import { Request, Response } from "express";
import User from "../models/userModel";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Friendship from "../models/friendshipModel";

export const allUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await User.find().select("-password").exec();
    res.status(200).json({ allUsers });
  } catch (err) {
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = [
  body("username").not().isEmpty().withMessage("Username cannot be empty"),
  body("password").not().isEmpty().withMessage("Password cannot be empty"),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorMessage: errors.array() });
    }
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    console.log("myuserid", user?._id);
    if (!user) {
      return res.status(400).json({ errorMessage: "User not found!" });
    }
    try {
      const hashed = String(user.password);
      const passwordMatches = await bcrypt.compare(password, hashed);
      if (!passwordMatches) {
        return res.status(400).json({ errorMessage: "Incorrect Password!" });
      }

      const userString = JSON.stringify(user);
      if (!process.env.JWT_SECRET) {
        return res
          .status(400)
          .json({ errorMessage: "JWT Secret Key cannot be found" });
      }
      const token = jwt.sign(userString, process.env.JWT_SECRET);
      const responsePayload = {
        token,
        myUserId: user?._id,
      };
      res.json(responsePayload);
    } catch (e) {
      console.error("Error fetching users:", e);
      res.status(500).json({ errorMessage: "Internal Server Error!", e });
    }
  },
];

export const register = [
  body("firstName").not().isEmpty().withMessage("Firstname cannot be Empty"),
  body("lastName").not().isEmpty().withMessage("Lastname cannot be Empty"),
  body("username").not().isEmpty().withMessage("Username cannot be Empty"),
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password cannot be Empty")
    .isLength({ min: 6 })
    .withMessage("The minimum password length should be at least 6 characters"),
  body("dateOfBirth")
    .not()
    .isEmpty()
    .withMessage("Date of birth cannot be Empty")
    .isDate()
    .withMessage("Invalid date format. Please use YYYY-MM-DD"),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorMessage: errors.array() });
    }
    const { firstName, lastName, username, password, dateOfBirth } = req.body;
    try {
      const existingUsername = await User.findOne({ username }).exec();
      if (existingUsername) {
        return res
          .status(400)
          .json({ errorMessage: "Username already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const newUser = new User({
        firstName,
        lastName,
        username,
        password: hashed,
        dateOfBirth,
      });
      await newUser.save();
      res
        .status(201)
        .json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      if (error instanceof Error) {
        const payload = {
          errorMessage: error.message,
        };
        console.error("Registration error: ", payload);
        return res.status(500).json(payload);
      }
      throw error;
    }
  },
];

export const addFriend = async (req: Request, res: Response) => {
  const friendUserId = req.body.friendId;
  const myUserId = req.userId;
  console.log("req.user,myUserId", myUserId);
  console.log("req.body,friendUserId", friendUserId);
  const newFriendship = new Friendship({
    requesterId: myUserId,
    receiverId: friendUserId,
    status: "pending",
  });
  try {
    await newFriendship.save();
    console.log("done");
    res.status(200).json({ message: `Sent friend request successfully` });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  const requestId = req.body.requestId;
  const myUserId = req.userId;
  console.log("req.user,myUserId", myUserId);
  console.log("requestId", requestId);
  try {
    const friendshipStatus = await Friendship.findByIdAndUpdate(
      { _id: requestId },
      { status: "accepted" },
      { new: true }
    );
    console.log("friendshipStatus", friendshipStatus);
    res.status(200).json({ message: `Accepted friend request successfully` });
  } catch (err) {
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const myPendingFriendsList = async (req: Request, res: Response) => {
  const myUserId = req.userId;
  console.log("myuserid", myUserId);
  const incomingRequests = await Friendship.find({
    receiverId: myUserId,
    status: "pending",
  });
  const requestedFriends = await Friendship.find({
    requesterId: myUserId,
    status: "pending",
  });
  const incomingRequestsDetails = await User.find({
    _id: incomingRequests.map((user) => {
      return user.requesterId;
    }),
  })
    .select("-password")
    .exec();

  const mergedIncomingRequests = incomingRequests
    .map((request) => {
      const userDetails = incomingRequestsDetails.find(
        (user) => user._id.toString() === request.requesterId.toString()
      );

      if (userDetails) {
        return {
          requestId: request._id,
          requesterId: request.requesterId,
          firstname: userDetails.firstName,
          lastname: userDetails.lastName,
          username: userDetails.username,
        };
      }

      return null;
    })
    .filter((request) => request !== null);

  console.log("mergedRequest", mergedIncomingRequests);
  // console.log("allusers", incomingRequestsDetails);
  console.log("incomingRequests", incomingRequests);
  // console.log("requestedFriends", requestedFriends);
  try {
    console.log("done");
    res
      .status(200)
      .json({ incomingRequests, mergedIncomingRequests, requestedFriends });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const myFriendList = async (req: Request, res: Response) => {
  const myId = req.userId;
  try {
    const myFriends = await Friendship.find({
      $or: [{ requesterId: myId }, { receiverId: myId }],
      status: "accepted",
    });
    console.log("myFriends", myFriends);
    const friendIds = myFriends.map((friendship) => {
      if (friendship.requesterId === myId) {
        return friendship.receiverId;
      } else {
        return friendship.requesterId;
      }
    });
    const friends = await User.find(
      { _id: { $in: friendIds } },
      "firstName lastName dateOfBirth username"
    );
    res.status(200).json({ friends });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
