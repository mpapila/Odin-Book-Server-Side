"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const friendshipSchema = new mongoose_1.default.Schema({
    requesterId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, required: true },
}, {
    timestamps: true,
});
const Friendship = mongoose_1.default.model("Friendship", friendshipSchema);
exports.default = Friendship;
