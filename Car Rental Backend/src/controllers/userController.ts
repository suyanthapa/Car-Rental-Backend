import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { query } from "../helpers/config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

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

interface BookingRow extends RowDataPacket {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  status: string;
}

const bookVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    const userId = req.user?.id;

    /* ===============================
       1. AUTH & BASIC VALIDATION
    =============================== */
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!vehicleId || !startDate || !endDate) {
      res.status(400).json({
        message: "Vehicle ID, start date, and end date are required",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    /* ===============================
       2. DATE RULES
    =============================== */
    const maxAllowedDate = new Date();
    maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 1);
    maxAllowedDate.setHours(0, 0, 0, 0);

    if (start < today) {
      res.status(400).json({ message: "Start date cannot be in the past" });
      return;
    }

    if (end <= start) {
      res.status(400).json({
        message: "End date must be at least one day after start date",
      });
      return;
    }

    if (end > maxAllowedDate) {
      res.status(400).json({
        message: "You can only book within a 1-month range from today",
        limit: maxAllowedDate.toISOString().split("T")[0],
      });
      return;
    }

    /* ===============================
       3. VEHICLE CHECK
    =============================== */
    const [vehicles] = await query<any[]>(
      "SELECT id, pricePerDay FROM vehicles WHERE id = ?",
      [vehicleId]
    );

    if (!vehicles || vehicles.length === 0) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const vehicle = vehicles[0];

    /* ===============================
       4. OVERLAP + MAINTENANCE CHECK
    =============================== */
    const [conflicts] = await query<any[]>(
      `
      SELECT startDate, endDate
      FROM bookings
      WHERE vehicleId = ?
        AND status IN ('PENDING', 'CONFIRMED')
        AND NOT (
          DATE_ADD(endDate, INTERVAL 1 DAY) < ?
          OR startDate > ?
        )
      ORDER BY endDate DESC
      LIMIT 1
      `,
      [vehicleId, startDate, endDate]
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      const bookedUntil = new Date(conflict.endDate);
      const availableFrom = new Date(bookedUntil);
      availableFrom.setDate(availableFrom.getDate() + 2);

      res.status(400).json({
        message: "Vehicle is not available for the selected dates",
        availableFrom: availableFrom.toISOString().split("T")[0],
      });
      return;
    }

    /* ===============================
       5. PRICE CALCULATION
    =============================== */
    const durationInMs = end.getTime() - start.getTime();
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
    const totalPrice = durationInDays * vehicle.pricePerDay;

    /* ===============================
       6. CREATE BOOKING
    =============================== */
    await query(
      `
  INSERT INTO bookings (
    userId,
    vehicleId,
    startDate,
    endDate,
    totalDays,
    totalPrice,
    status
  )
  VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
  `,
      [userId, vehicleId, startDate, endDate, durationInDays, totalPrice]
    );

    /* ===============================
       7. SUCCESS RESPONSE
    =============================== */
    res.status(201).json({
      success: true,
      message: "Vehicle booked on pending status",
      data: {
        vehicleId,
        startDate,
        endDate,
        status: "PENDING",
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Critical Booking Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAvailableVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search } = req.query;

    // 1. Base filter: Only show available or booked cars
    let whereClause = "WHERE status IN ('AVAILABLE', 'BOOKED')";
    const queryParams: any[] = [];

    // 2. Expand search to check BOTH name AND brand
    if (search && typeof search === "string") {
      const searchPattern = `%${search}%`;
      // Use parentheses around the OR to keep the status filter separate
      whereClause += " AND (name LIKE ? OR brand LIKE ?)";
      queryParams.push(searchPattern, searchPattern);
    }

    const [vehicles] = await query<CarRow[]>(
      `SELECT * FROM vehicles 
       ${whereClause} 
       ORDER BY createdAt DESC`,
      queryParams
    );

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles.map((car) => ({
        ...car,
        imageUrl: car.imageUrl ? JSON.parse(car.imageUrl) : [],
      })),
    });
  } catch (error) {
    console.error("Fetch available vehicles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;

    if (!vehicleId) {
      res.status(400).json({ message: "Vehicle ID is required" });
      return;
    }

    const [vehicle] = await query<CarRow[]>(
      `SELECT *
       FROM vehicles
       WHERE id = ?`,
      [vehicleId]
    );

    if (!vehicle || vehicle.length === 0) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const vehicleData = vehicle[0];
    if (!vehicleData) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        name: vehicleData.name,
        brand: vehicleData.brand,
        type: vehicleData.type,
        fuelType: vehicleData.fuelType,
        seats: vehicleData.seats,
        pricePerDay: vehicleData.pricePerDay,
        status: vehicleData.status,
        images: vehicleData.imageUrl ? JSON.parse(vehicleData.imageUrl) : [],
        createdAt: vehicleData.createdAt,
      },
    });
  } catch (error) {
    console.error("Fetch vehicle details error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//USER BOOKING HISTORY
/* What user can see
    --All their bookings
    --With vehicle details
    --Status (PENDING | CONFIRMED | CANCELLED | COMPLETED)
    --Sorted by latest first 
*/
const getMyBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [rows] = await query<RowDataPacket[]>(
      `
      SELECT
        b.id AS bookingId,
        b.status,
        b.startDate,
        b.endDate,
        b.createdAt,
        c.id AS vehicleId,
        c.name,
        c.brand,
        c.type,
        c.fuelType,
        c.seats,
        c.pricePerDay,
        c.imageUrl
      FROM bookings b
      INNER JOIN vehicles c ON b.vehicleId = c.id
      WHERE b.userId = ?
      ORDER BY b.createdAt DESC
    `,
      [userId]
    );

    const formatted = rows.map((row) => {
      const days = Math.ceil(
        (new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        booking: {
          id: row.bookingId,
          status: row.status,
          startDate: row.startDate,
          endDate: row.endDate,
          createdAt: row.createdAt,
          totalPrice: days * row.pricePerDay,
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
      };
    });

    res.status(200).json({
      success: true,
      totalBookings: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const viewOwnProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [users] = await query<RowDataPacket[]>(
      `
      SELECT 
        id,
        username,
        email,
        phone,
        isVerified,
        role,
        createdAt
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (!users || users.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: users[0],
    });
  } catch (error) {
    console.error("View own profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // 1. Fetch the user's current hashed password
    const [users] = await query<RowDataPacket[]>(
      `SELECT password FROM users WHERE id = ?`,
      [userId]
    );

    if (!users || users.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // 2. Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, users[0]!.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Invalid old password" });
      return;
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the database
    await query(`UPDATE users SET password = ? WHERE id = ?`, [
      hashedPassword,
      userId,
    ]);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const userController = {
  bookVehicle,
  getAvailableVehicle,
  getVehicleById,
  getMyBookings,
  viewOwnProfile,
  updatePassword,
};

export default userController;
