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
exports.getNotification = void 0;
const NotificationModel_1 = __importDefault(require("../models/NotificationModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const friendshipModel_1 = __importDefault(require("../models/friendshipModel"));
const getNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myId = req.userId;
    try {
        const myFriends = yield friendshipModel_1.default.find({
            $or: [{ requesterId: myId }, { receiverId: myId }],
            status: "accepted",
        });
        const myFriendsIds = myFriends.map((myFriends) => {
            return myFriends.requesterId === myId
                ? myFriends.receiverId
                : myFriends.requesterId;
        });
        const notifications = yield NotificationModel_1.default.find({
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
        const allBirthdays = yield userModel_1.default.find({}, "firstName lastName dateOfBirth");
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
    }
    catch (err) {
        console.error("Error fetching data: ", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getNotification = getNotification;
