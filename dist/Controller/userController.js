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
exports.register = exports.allUsers = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const allUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const allUsers = yield userModel_1.default.find().exec();
    res.status(200).json({ allUsers });
});
exports.allUsers = allUsers;
exports.register = [
    (0, express_validator_1.body)("firstName").not().isEmpty().withMessage("Firstname cannot be Empty"),
    (0, express_validator_1.body)("lastName").not().isEmpty().withMessage("Lastname cannot be Empty"),
    (0, express_validator_1.body)("username").not().isEmpty().withMessage("Username cannot be Empty"),
    (0, express_validator_1.body)("password").not().isEmpty().withMessage("Password cannot be Empty"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("The minimum password length should be at least 6 characters"),
    (0, express_validator_1.body)("dateOfBirth")
        .not()
        .isEmpty()
        .withMessage("Date of birth cannot be Empty")
        .isDate()
        .withMessage("Invalid date format. Please use YYYY-MM-DD"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { firstName, lastName, username, password, dateOfBirth } = req.body;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errorMessage: errors.array });
        }
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
                console.error("Registration error: ", error);
                return res.status(500).json(payload);
            }
            throw error;
        }
    }),
];
