import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/token.service.js";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1️⃣ Get token (cookie-based auth)
   const token = req.cookies?.accesstoken;


    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // 2️⃣ Verify token using SERVICE
    const decodedUser = verifyToken(token);

    // 3️⃣ Attach user to request
    req.user = decodedUser;

    // 4️⃣ Continue
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
