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

interface CarRow extends RowDataPacket {
  id: string;
  name: string;
  brand: string;
  type: string;
  fuelType: string;
  seats: number;
  pricePerDay: number;
  imageUrl: string;
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
      `INSERT INTO vehicles
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

const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check if user exists
    const [users] = await query<UserRow[]>(
      "SELECT id FROM users WHERE id = ? AND role = ?",
      [userId, "USER"]
    );

    if (!users || users.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Delete user
    await query("DELETE FROM users WHERE id = ?", [userId]);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { carId } = req.params;

    if (!carId) {
      res.status(400).json({ message: "Car ID is required" });
      return;
    }

    // Check if car exists
    const [vehicles] = await query<RowDataPacket[]>(
      "SELECT id FROM vehicles WHERE id = ?",
      [carId]
    );

    if (!vehicles || vehicles.length === 0) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    // Delete car
    await query("DELETE FROM vehicles WHERE id = ?", [carId]);

    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Delete car error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const editUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { username, email, phone } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check if user exists
    const [users] = await query<UserRow[]>(
      "SELECT id FROM users WHERE id = ? AND role = ?",
      [userId, "USER"]
    );

    if (!users || users.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if email is already taken by another user
    if (email) {
      const [existingUsers] = await query<UserRow[]>(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
      );

      if (existingUsers && existingUsers.length > 0) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (phone) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: "No fields to update" });
      return;
    }

    values.push(userId);

    await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Edit user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const editCar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { carId } = req.params;
    const { name, brand, type, fuelType, seats, pricePerDay } = req.body;

    if (!carId) {
      res.status(400).json({ message: "Car ID is required" });
      return;
    }

    // Check if car exists
    const [vehicles] = await query<RowDataPacket[]>(
      "SELECT id FROM vehicles WHERE id = ?",
      [carId]
    );

    if (!vehicles || vehicles.length === 0) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (brand) {
      updates.push("brand = ?");
      values.push(brand);
    }
    if (type) {
      updates.push("type = ?");
      values.push(type);
    }
    if (fuelType) {
      updates.push("fuelType = ?");
      values.push(fuelType);
    }
    if (seats) {
      updates.push("seats = ?");
      values.push(seats);
    }
    if (pricePerDay) {
      updates.push("pricePerDay = ?");
      values.push(pricePerDay);
    }

    // Handle image upload if present
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const imageUrls = (req.files as Express.Multer.File[]).map(
        (file) => (file as any).path
      );
      updates.push("imageUrl = ?");
      values.push(JSON.stringify(imageUrls));
    }

    if (updates.length === 0) {
      res.status(400).json({ message: "No fields to update" });
      return;
    }

    values.push(carId);

    await query(
      `UPDATE vehicles SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.status(200).json({
      success: true,
      message: "Car updated successfully",
    });
  } catch (error) {
    console.error("Edit car error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPendingBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await query<RowDataPacket[]>(`
      SELECT 
        b.id as bookingId,
        b.status,
        b.startDate,
        b.endDate,
        b.createdAt as bookingCreatedAt,
        u.id as userId,
        u.username,
        u.email,
        u.phone,
        c.id as vehicleId,
        c.name,
        c.brand,
        c.type,
        c.fuelType,
        c.seats,
        c.pricePerDay,
        c.imageUrl
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      INNER JOIN vehicles c ON b.vehicleId = c.id
      WHERE b.status = 'PENDING'
      ORDER BY c.id, b.createdAt DESC
    `);

    // Group bookings by car
    const carMap = new Map<string, any>();

    rows.forEach((row) => {
      const vehicleId = row.vehicleId;

      if (!carMap.has(vehicleId)) {
        carMap.set(vehicleId, {
          car: {
            id: row.vehicleId,
            name: row.name,
            brand: row.brand,
            type: row.type,
            fuelType: row.fuelType,
            seats: row.seats,
            pricePerDay: row.pricePerDay,
            images: row.imageUrl ? JSON.parse(row.imageUrl) : [],
          },
          bookings: [],
        });
      }

      carMap.get(vehicleId).bookings.push({
        booking: {
          id: row.bookingId,
          status: row.status,
          startDate: row.startDate,
          endDate: row.endDate,
          createdAt: row.bookingCreatedAt,
        },
        user: {
          id: row.userId,
          username: row.username,
          email: row.email,
          phone: row.phone,
        },
      });
    });

    const formatted = Array.from(carMap.values());

    res.status(200).json({
      success: true,
      totalvehicles: formatted.length,
      totalBookings: rows.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Fetch pending bookings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const approveBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    // Check if booking exists and is pending
    const [bookings] = await query<RowDataPacket[]>(
      "SELECT id, status FROM bookings WHERE id = ?",
      [bookingId]
    );

    if (!bookings || bookings.length === 0) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const booking = bookings[0]!;
    if (booking.status !== "PENDING") {
      res
        .status(400)
        .json({ message: "Only pending bookings can be approved" });
      return;
    }

    // Approve booking
    await query("UPDATE bookings SET status = ? WHERE id = ?", [
      "CONFIRMED",
      bookingId,
    ]);

    res.status(200).json({
      success: true,
      message: "Booking approved successfully",
    });
  } catch (error) {
    console.error("Approve booking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    // Check if booking exists
    const [bookings] = await query<RowDataPacket[]>(
      "SELECT id FROM bookings WHERE id = ?",
      [bookingId]
    );

    if (!bookings || bookings.length === 0) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Delete booking
    await query("DELETE FROM bookings WHERE id = ?", [bookingId]);

    res.status(200).json({
      success: true,
      message: "Booking cancelled  successfully and deleted",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//View ALL Vehicles – with pagination
const getAllVehicles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [countResult] = await query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM vehicles"
    );

    const total = countResult[0]!.total;

    const [vehicles] = await query<RowDataPacket[]>(
      `SELECT 
        id, name, brand, type, fuelType, seats, pricePerDay, status, imageUrl, createdAt
       FROM vehicles
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.status(200).json({
      success: true,
      message: "All vehicles fetched successfully",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: vehicles.map((v) => ({
        ...v,
        images: v.imageUrl ? JSON.parse(v.imageUrl) : [],
      })),
    });
  } catch (error) {
    console.error("Get all vehicles admin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//View ALL APPROVED (CONFIRMED) BOOKINGS with Vehicle + User details
const getApprovedBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await query<RowDataPacket[]>(`
      SELECT
        b.id as bookingId,
        b.startDate,
        b.endDate,
        b.createdAt as bookingDate,

        u.id as userId,
        u.username,
        u.email,
        u.phone,

        v.id as vehicleId,
        v.name,
        v.brand,
        v.type,
        v.fuelType,
        v.seats,
        v.pricePerDay,
        v.imageUrl
      FROM bookings b
      INNER JOIN users u ON b.userId = u.id
      INNER JOIN vehicles v ON b.vehicleId = v.id
      WHERE b.status = 'CONFIRMED'
      ORDER BY b.createdAt DESC
    `);

    res.status(200).json({
      success: true,
      totalApprovedBookings: rows.length,
      data: rows.map((row) => ({
        booking: {
          id: row.bookingId,
          startDate: row.startDate,
          endDate: row.endDate,
          bookedAt: row.bookingDate,
        },
        user: {
          id: row.userId,
          username: row.username,
          email: row.email,
          phone: row.phone,
        },
        vehicle: {
          id: row.vehicleId,
          name: row.name,
          brand: row.brand,
          type: row.type,
          fuelType: row.fuelType,
          seats: row.seats,
          pricePerDay: row.pricePerDay,
          images: row.imageUrl ? JSON.parse(row.imageUrl) : [],
        },
      })),
    });
  } catch (error) {
    console.error("Get approved bookings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//View ALL AVAILABLE VEHICLES
//✅ “Available” = no PENDING or CONFIRMED bookings for today or future

const getAvailableVehicles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [vehicles] = await query<RowDataPacket[]>(
      `
      SELECT 
        v.id, v.name, v.brand, v.type, v.fuelType,
        v.seats, v.pricePerDay, v.imageUrl
      FROM vehicles v
      WHERE v.id NOT IN (
        SELECT b.vehicleId
        FROM bookings b
        WHERE b.status IN ('PENDING', 'CONFIRMED')
        AND b.endDate >= ?
      )
      ORDER BY v.createdAt DESC
    `,
      [today]
    );

    res.status(200).json({
      success: true,
      totalAvailableVehicles: vehicles.length,
      data: vehicles.map((v) => ({
        id: v.id,
        name: v.name,
        brand: v.brand,
        type: v.type,
        fuelType: v.fuelType,
        seats: v.seats,
        pricePerDay: v.pricePerDay,
        images: v.imageUrl ? JSON.parse(v.imageUrl) : [],
      })),
    });
  } catch (error) {
    console.error("Get available vehicles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Get Admin Dashboard Stats
const getAdminDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [[userCount]] = await query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'USER'"
    );

    const [[vehicleCount]] = await query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM vehicles"
    );

    const [[pendingBookings]] = await query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM bookings WHERE status = 'PENDING'"
    );

    const [[confirmedBookings]] = await query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM bookings WHERE status = 'CONFIRMED'"
    );

    const [revenueRows] = await query<RowDataPacket[]>(`
      SELECT 
        SUM(
          DATEDIFF(endDate, startDate) * v.pricePerDay
        ) AS totalRevenue
      FROM bookings b
      INNER JOIN vehicles v ON b.vehicleId = v.id
      WHERE b.status = 'CONFIRMED'
    `);

    res.status(200).json({
      success: true,
      data: {
        users: userCount?.total || 0,
        vehicles: vehicleCount?.total || 0,
        pendingBookings: pendingBookings?.total || 0,
        confirmedBookings: confirmedBookings?.total || 0,
        totalRevenue: revenueRows[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const adminController = {
  addCar,
  allUsers,
  deleteUser,
  deleteCar,
  editUser,
  editCar,
  getPendingBookings,
  approveBooking,
  cancelBooking,
  getAllVehicles,
  getApprovedBookings,
  getAvailableVehicles,
  getAdminDashboard,
};

export default adminController;
