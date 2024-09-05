import express from "express";
import { allUsers, login, register } from "./Controller/userController";

const router = express.Router();

router.get("/allUsers", allUsers);
router.post("/register", register);
router.post("/login", login);

export default router;
