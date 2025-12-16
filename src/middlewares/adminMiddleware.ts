import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { query } from "../helpers/config/db";
import { RowDataPacket } from "mysql2";

/**
 * Admin Middleware
 * Checks if authenticated user has ADMIN role
 * Must be used AFTER authMiddleware
 */

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  role: string;
}
const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id; // ✅ from authMiddleware

    console.log("user id am", userId);
    console.log("TToken from admin M", userId);
    if (!userId) {
      res.status(401).json({ message: "Authentication required from AM" });
      return;
    }

    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Authorization failed" });
  }
};

export default adminMiddleware;
