import { Request, Response } from "express";
import User from "../models/userModel";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";

export const allUsers = async (req: Request, res: Response) => {
  const allUsers = await User.find().exec();
  res.status(200).json({ allUsers });
};

export const register = [
  body("firstName").not().isEmpty().withMessage("Firstname cannot be Empty"),
  body("lastName").not().isEmpty().withMessage("Lastname cannot be Empty"),
  body("username").not().isEmpty().withMessage("Username cannot be Empty"),
  body("password").not().isEmpty().withMessage("Password cannot be Empty"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("The minimum password length should be at least 6 characters"),
  body("dateOfBirth")
    .not()
    .isEmpty()
    .withMessage("Date of birth cannot be Empty")
    .isDate()
    .withMessage("Invalid date format. Please use YYYY-MM-DD"),

  async (req: Request, res: Response) => {
    const { firstName, lastName, username, password, dateOfBirth } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorMessage: errors.array });
    }
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
        console.error("Registration error: ", error);
        return res.status(500).json(payload);
      }
      throw error;
    }
  },
];
