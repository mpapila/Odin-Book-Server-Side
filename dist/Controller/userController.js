"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editProfile = exports.getUserProfile = exports.myFriendList = exports.myPendingFriendsList = exports.acceptFriendRequest = exports.addFriend = exports.removePhoto = exports.savePhoto = exports.register = exports.login = exports.allUsers = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const friendshipModel_1 = __importDefault(require("../models/friendshipModel"));
const NotificationModel_1 = __importDefault(require("../models/NotificationModel"));
const PostModel_1 = __importDefault(require("../models/PostModel"));
const allUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield userModel_1.default.find().select("-password").exec();
        res.status(200).json({ allUsers });
    }
    catch (err) {
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.allUsers = allUsers;
exports.login = [
    (0, express_validator_1.body)("username").not().isEmpty().withMessage("Username cannot be empty"),
    (0, express_validator_1.body)("password").not().isEmpty().withMessage("Password cannot be empty"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errorMessage: errors.array() });
        }
        const { username, password } = req.body;
        const user = yield userModel_1.default.findOne({ username });
        console.log("myuserid", user === null || user === void 0 ? void 0 : user._id);
        if (!user) {
            return res.status(400).json({ errorMessage: "User not found!" });
        }
        try {
            const hashed = String(user.password);
            const passwordMatches = yield bcrypt_1.default.compare(password, hashed);
            if (!passwordMatches) {
                return res.status(400).json({ errorMessage: "Incorrect Password!" });
            }
            const userString = JSON.stringify(user);
            if (!process.env.JWT_SECRET) {
                return res
                    .status(400)
                    .json({ errorMessage: "JWT Secret Key cannot be found" });
            }
            const token = jsonwebtoken_1.default.sign(userString, process.env.JWT_SECRET);
            const responsePayload = {
                token,
                myUserId: user === null || user === void 0 ? void 0 : user._id,
            };
            res.json(responsePayload);
        }
        catch (e) {
            console.error("Error fetching users:", e);
            res.status(500).json({ errorMessage: "Internal Server Error!", e });
        }
    }),
];
exports.register = [
    (0, express_validator_1.body)("firstName").not().isEmpty().withMessage("Firstname cannot be Empty"),
    (0, express_validator_1.body)("lastName").not().isEmpty().withMessage("Lastname cannot be Empty"),
    (0, express_validator_1.body)("username").not().isEmpty().withMessage("Username cannot be Empty"),
    (0, express_validator_1.body)("password")
        .not()
        .isEmpty()
        .withMessage("Password cannot be Empty")
        .isLength({ min: 6 })
        .withMessage("The minimum password length should be at least 6 characters"),
    (0, express_validator_1.body)("dateOfBirth")
        .not()
        .isEmpty()
        .withMessage("Date of birth cannot be Empty")
        .isDate()
        .withMessage("Invalid date format. Please use YYYY-MM-DD"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errorMessage: errors.array() });
        }
        const { firstName, lastName, username, password, dateOfBirth } = req.body;
        try {
            const existingUsername = yield userModel_1.default.findOne({ username }).exec();
            if (existingUsername) {
                return res
                    .status(400)
                    .json({ errorMessage: "Username already exists" });
            }
            const hashed = yield bcrypt_1.default.hash(password, 10);
            const newUser = new userModel_1.default({
                firstName,
                lastName,
                username,
                password: hashed,
                dateOfBirth,
                profilePhoto: "",
            });
            yield newUser.save();
            res
                .status(201)
                .json({ message: "User registered successfully", user: newUser });
        }
        catch (error) {
            if (error instanceof Error) {
                const payload = {
                    errorMessage: error.message,
                };
                console.error("Registration error: ", payload);
                return res.status(500).json(payload);
            }
            throw error;
        }
    }),
];
const savePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myUserId = req.userId;
    const photo = req.body.photo;
    try {
        if (!photo) {
            return res.status(400).json({ error: "Photo Not Found!" });
        }
        console.log("req body", req.body);
        console.log("myUserId", myUserId);
        const updatedProfile = yield userModel_1.default.findByIdAndUpdate({ _id: myUserId }, { profilePhoto: photo });
        res.status(200).json({ updatedProfile });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.savePhoto = savePhoto;
const removePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myUserId = req.userId;
    const checkPhoto = yield userModel_1.default.findById({ _id: myUserId });
    console.log("userid", myUserId);
    try {
        if (checkPhoto &&
            checkPhoto.profilePhoto &&
            checkPhoto.profilePhoto.length > 1) {
            console.log("There is a photo");
            checkPhoto.profilePhoto = "";
            yield checkPhoto.save();
            res.status(200).json("Success");
        }
        else {
            throw new Error("There is no photo");
        }
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.removePhoto = removePhoto;
const addFriend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const friendUserId = req.body.friendId;
    const myUserId = req.userId;
    console.log("req.user,myUserId", myUserId);
    console.log("req.body,friendUserId", friendUserId);
    const newFriendship = new friendshipModel_1.default({
        requesterId: myUserId,
        receiverId: friendUserId,
        status: "pending",
    });
    try {
        yield newFriendship.save();
        console.log("done");
        res.status(200).json({ message: `Sent friend request successfully` });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.addFriend = addFriend;
const acceptFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = req.body.requestId;
    const myUserId = req.userId;
    const friendshipStatus = yield friendshipModel_1.default.findById({ _id: requestId });
    console.log("friendshipStatus", friendshipStatus);
    console.log("req.user,myUserId", myUserId);
    console.log("requestId", requestId);
    const requesterInfo = yield userModel_1.default.findById(friendshipStatus === null || friendshipStatus === void 0 ? void 0 : friendshipStatus.requesterId, "firstName lastName");
    const myInfo = yield userModel_1.default.findById(myUserId, "firstName lastName");
    console.log("requesterInfo", requesterInfo);
    console.log("myInfo", myInfo);
    try {
        const newFriendshipStatus = yield friendshipModel_1.default.findByIdAndUpdate({ _id: requestId }, { status: "accepted" }, { new: true });
        const newNotificationForRequester = new NotificationModel_1.default({
            userId: myUserId,
            message: `${myInfo === null || myInfo === void 0 ? void 0 : myInfo.firstName} ${myInfo === null || myInfo === void 0 ? void 0 : myInfo.lastName} accepted your friendship request`,
            type: "friendship",
            recipient: requesterInfo === null || requesterInfo === void 0 ? void 0 : requesterInfo._id,
            post: requesterInfo === null || requesterInfo === void 0 ? void 0 : requesterInfo._id,
        });
        const newNotificationForReceiver = new NotificationModel_1.default({
            userId: requesterInfo === null || requesterInfo === void 0 ? void 0 : requesterInfo._id,
            message: `You accepted ${requesterInfo === null || requesterInfo === void 0 ? void 0 : requesterInfo.firstName} ${requesterInfo === null || requesterInfo === void 0 ? void 0 : requesterInfo.lastName}'s friendship request`,
            type: "friendship",
            recipient: myUserId,
            post: requesterInfo === null || requesterInfo === void 0 ? void 0 : requesterInfo._id,
        });
        yield newNotificationForRequester.save();
        yield newNotificationForReceiver.save();
        // console.log("newNotificationForReceiver", newNotificationForReceiver);
        // console.log("newNotificationForRequester", newNotificationForRequester);
        res.status(200).json({ message: `Accepted friend request successfully` });
    }
    catch (err) {
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.acceptFriendRequest = acceptFriendRequest;
const myPendingFriendsList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myUserId = req.userId;
    console.log("myuserid", myUserId);
    const allFriendships = yield friendshipModel_1.default.find({
        $or: [{ requesterId: myUserId }, { receiverId: myUserId }],
        status: "pending",
    });
    const incomingRequests = yield friendshipModel_1.default.find({
        receiverId: myUserId,
        status: "pending",
    });
    const requestedFriends = yield friendshipModel_1.default.find({
        requesterId: myUserId,
        status: "pending",
    });
    const incomingRequestsDetails = yield userModel_1.default.find({
        _id: incomingRequests.map((user) => {
            return user.requesterId;
        }),
    })
        .select("-password")
        .exec();
    const mergedIncomingRequests = incomingRequests
        .map((request) => {
        const userDetails = incomingRequestsDetails.find((user) => user._id.toString() === request.requesterId.toString());
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
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.myPendingFriendsList = myPendingFriendsList;
const myFriendList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    try {
        const myFriends = yield friendshipModel_1.default.find({
            $or: [{ requesterId: myId }, { receiverId: myId }],
            status: "accepted",
        });
        // console.log("myFriends", myFriends);
        const friendIds = myFriends.map((friendship) => {
            if (friendship.requesterId === myId) {
                return friendship.receiverId;
            }
            else {
                return friendship.requesterId;
            }
        });
        const friends = yield userModel_1.default.find({ _id: { $in: friendIds } }, "firstName lastName dateOfBirth username profilePhoto");
        // console.log("friends", friends);
        res.status(200).json({ friends });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.myFriendList = myFriendList;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    const profileId = req.params.id;
    try {
        const userProfileById = yield userModel_1.default.findOne({
            _id: profileId,
        })
            .select("-password")
            .exec();
        const userPostById = yield PostModel_1.default.find({
            userId: profileId,
        });
        res.status(200).json({ userPostById, userProfileById });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getUserProfile = getUserProfile;
const editProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    const { firstName, lastName, dateOfBirth } = req.body;
    try {
        const myProfile = yield userModel_1.default.findOne({
            _id: myId,
        })
            .select("-password")
            .exec();
        if (!myProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        const currentFirstName = myProfile === null || myProfile === void 0 ? void 0 : myProfile.firstName;
        const currentLastName = myProfile === null || myProfile === void 0 ? void 0 : myProfile.lastName;
        const currentDateOfBirth = new Date(myProfile.dateOfBirth)
            .toISOString()
            .split("T")[0];
        if (currentFirstName === firstName &&
            currentLastName === lastName &&
            currentDateOfBirth === dateOfBirth) {
            console.log("No changes detected");
            return res.status(400).json({ message: "No changes detected" });
        }
        myProfile.firstName = firstName;
        myProfile.lastName = lastName;
        myProfile.dateOfBirth = dateOfBirth;
        yield myProfile.save();
        console.log("Profile updated successfully");
        res
            .status(200)
            .json({ message: "Profile updated successfully", profile: myProfile });
        // console.log("myprofile", myProfile);
        // console.log("body", req.body);
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.editProfile = editProfile;
