import express from "express";
import { allUsers } from "./Controller/userController";

const router = express.Router();

router.get("/allUsers", allUsers);

export default router;
