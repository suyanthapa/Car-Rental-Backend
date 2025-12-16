import bcrypt from "bcryptjs";

import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { query } from "../helpers/config/db";
import { AuthRequest } from "../middlewares/authMiddleware";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  role: string;
}

interface CountResult extends RowDataPacket {
  total: number;
}
const addCar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, brand, type, fuelType, seats, pricePerDay } = req.body;

    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Cloudinary image
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: "At least one image is required" });
      return;
    }

    const imageUrls = (req.files as Express.Multer.File[]).map(
      (file) => (file as any).path
    );

    // Insert into DB
    const [result] = await query(
      `INSERT INTO cars
  (name, brand, type, fuelType, seats, pricePerDay, imageUrl)
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        brand,
        type,
        fuelType,
        seats,
        pricePerDay,
        JSON.stringify(imageUrls),
      ]
    );

    //  Success response
    res.status(201).json({
      message: "Car added successfully",
      car: {
        name,
        brand,
        type,
        fuelType,
        seats,
        pricePerDay,
        imageUrls,
      },
    });
  } catch (error) {
    console.error("Add car error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const allUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    // Count total users
    const [countResult] = await query<CountResult[]>(
      "SELECT COUNT(*) AS total FROM users WHERE role = ?",
      ["USER"]
    );
    const total = countResult?.[0]?.total || 0;

    // Fetch users with pagination
    const [users] = await query<UserRow[]>(
      "SELECT id, email, role, createdAt FROM users WHERE role = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
      ["USER", pageSize, offset]
    );

    res.status(200).json({
      success: true,
      message: "All users retrieved successfully",
      data: {
        users,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all users",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

const adminController = {
  addCar,
  allUsers,
};

export default adminController;
