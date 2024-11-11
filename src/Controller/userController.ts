import { Request, Response } from "express";
import User from "../models/userModel";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Friendship from "../models/friendshipModel";
import Notification from "../models/NotificationModel";
import Post from "../models/PostModel";

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
        profilePhoto: "",
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

export const savePhoto = async (req: Request, res: Response) => {
  const myUserId = req.userId;
  const photo = req.body.photo;
  try {
    if (!photo) {
      return res.status(400).json({ error: "Photo Not Found!" });
    }
    console.log("req body", req.body);
    console.log("myUserId", myUserId);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: myUserId },
      { profilePhoto: photo }
    );
    res.status(200).json({ updatedProfile });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removePhoto = async (req: Request, res: Response) => {
  const myUserId = req.userId;
  const checkPhoto = await User.findById({ _id: myUserId });
  console.log("userid", myUserId);
  try {
    if (
      checkPhoto &&
      checkPhoto.profilePhoto &&
      checkPhoto.profilePhoto.length > 1
    ) {
      console.log("There is a photo");
      checkPhoto.profilePhoto = "";
      await checkPhoto.save();
      res.status(200).json("Success");
    } else {
      throw new Error("There is no photo");
    }
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
  const friendshipStatus = await Friendship.findById({ _id: requestId });
  console.log("friendshipStatus", friendshipStatus);
  console.log("req.user,myUserId", myUserId);
  console.log("requestId", requestId);
  const requesterInfo = await User.findById(
    friendshipStatus?.requesterId,
    "firstName lastName"
  );
  const myInfo = await User.findById(myUserId, "firstName lastName");
  console.log("requesterInfo", requesterInfo);
  console.log("myInfo", myInfo);
  try {
    const newFriendshipStatus = await Friendship.findByIdAndUpdate(
      { _id: requestId },
      { status: "accepted" },
      { new: true }
    );
    const newNotificationForRequester = new Notification({
      userId: myUserId,
      message: `${myInfo?.firstName} ${myInfo?.lastName} accepted your friendship request`,
      type: "friendship",
      recipient: requesterInfo?._id,
      post: requesterInfo?._id,
    });
    const newNotificationForReceiver = new Notification({
      userId: requesterInfo?._id,
      message: `You accepted ${requesterInfo?.firstName} ${requesterInfo?.lastName}'s friendship request`,
      type: "friendship",
      recipient: myUserId,
      post: requesterInfo?._id,
    });
    await newNotificationForRequester.save();
    await newNotificationForReceiver.save();
    // console.log("newNotificationForReceiver", newNotificationForReceiver);
    // console.log("newNotificationForRequester", newNotificationForRequester);
    res.status(200).json({ message: `Accepted friend request successfully` });
  } catch (err) {
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const myPendingFriendsList = async (req: Request, res: Response) => {
  const myUserId = req.userId;
  console.log("myuserid", myUserId);
  const allFriendships = await Friendship.find({
    $or: [{ requesterId: myUserId }, { receiverId: myUserId }],
    status: "pending",
  });
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
    res.status(200).json({
      allFriendships,
      incomingRequests,
      mergedIncomingRequests,
      requestedFriends,
    });
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
    // console.log("myFriends", myFriends);
    const friendIds = myFriends.map((friendship) => {
      if (friendship.requesterId === myId) {
        return friendship.receiverId;
      } else {
        return friendship.requesterId;
      }
    });
    const friends = await User.find(
      { _id: { $in: friendIds } },
      "firstName lastName dateOfBirth username profilePhoto"
    );
    // console.log("friends", friends);
    res.status(200).json({ friends });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const myId = req.userId;
  const profileId = req.params.id;

  try {
    const userProfileById = await User.findOne({
      _id: profileId,
    })
      .select("-password")
      .exec();
    const userPostById = await Post.find({
      userId: profileId,
    });
    res.status(200).json({ userPostById, userProfileById });
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editProfile = async (req: Request, res: Response) => {
  const myId = req.userId;
  const { firstName, lastName, dateOfBirth } = req.body;
  try {
    const myProfile = await User.findOne({
      _id: myId,
    })
      .select("-password")
      .exec();
    if (!myProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const currentFirstName = myProfile?.firstName;
    const currentLastName = myProfile?.lastName;
    const currentDateOfBirth = new Date(myProfile.dateOfBirth)
      .toISOString()
      .split("T")[0];

    if (
      currentFirstName === firstName &&
      currentLastName === lastName &&
      currentDateOfBirth === dateOfBirth
    ) {
      console.log("No changes detected");
      return res.status(400).json({ message: "No changes detected" });
    }

    myProfile.firstName = firstName;
    myProfile.lastName = lastName;
    myProfile.dateOfBirth = dateOfBirth;

    await myProfile.save();
    console.log("Profile updated successfully");
    res
      .status(200)
      .json({ message: "Profile updated successfully", profile: myProfile });

    // console.log("myprofile", myProfile);
    // console.log("body", req.body);
  } catch (err) {
    console.log("fail");
    console.error("Error fetching users: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
