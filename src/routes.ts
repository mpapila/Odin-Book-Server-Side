import express from "express";
import { allUsers, register } from "./Controller/userController";

const router = express.Router();

router.get("/allUsers", allUsers);
router.post("/register", register);

export default router;
