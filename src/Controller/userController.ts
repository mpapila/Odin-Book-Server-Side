import { Request, Response } from "express";
import User from "../models/userModel";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const allUsers = async (req: Request, res: Response) => {
  const allUsers = await User.find().exec();
  res.status(200).json({ allUsers });
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
