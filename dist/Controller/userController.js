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
exports.myFriendList = exports.myPendingFriendsList = exports.acceptFriendRequest = exports.addFriend = exports.register = exports.login = exports.allUsers = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const friendshipModel_1 = __importDefault(require("../models/friendshipModel"));
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
    console.log("req.user,myUserId", myUserId);
    console.log("requestId", requestId);
    try {
        const friendshipStatus = yield friendshipModel_1.default.findByIdAndUpdate({ _id: requestId }, { status: "accepted" }, { new: true });
        console.log("friendshipStatus", friendshipStatus);
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
        res
            .status(200)
            .json({ incomingRequests, mergedIncomingRequests, requestedFriends });
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
        console.log("myFriends", myFriends);
        const friendIds = myFriends.map((friendship) => {
            if (friendship.requesterId === myId) {
                return friendship.receiverId;
            }
            else {
                return friendship.requesterId;
            }
        });
        const friends = yield userModel_1.default.find({ _id: { $in: friendIds } }, "firstName lastName dateOfBirth username");
        res.status(200).json({ friends });
    }
    catch (err) {
        console.log("fail");
        console.error("Error fetching users: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.myFriendList = myFriendList;
