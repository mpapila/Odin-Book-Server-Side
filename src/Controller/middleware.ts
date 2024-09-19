import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../type";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "Token missing" });
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    // console.log("Decoded Token:", decoded);

    req.userId = decoded._id;
    // console.log("Set req.user:", req.userId);

    next();
  } catch (err) {
    return res.status(403).json({ error: "invalid token" });
  }
}
