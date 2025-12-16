import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { query } from "../helpers/config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { v4 as uuidv4 } from "uuid";

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
  carId: string;
  startDate: string;
  endDate: string;
  status: string;
}

const bookCar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { carId, startDate, endDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validate required fields
    if (!carId || !startDate || !endDate) {
      res
        .status(400)
        .json({ message: "Car ID, start date, and end date are required" });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      res.status(400).json({ message: "Start date cannot be in the past" });
      return;
    }

    if (end <= start) {
      res.status(400).json({ message: "End date must be after start date" });
      return;
    }

    // Check if car exists
    const [cars] = await query<CarRow[]>("SELECT id FROM cars WHERE id = ?", [
      carId,
    ]);

    if (!cars || cars.length === 0) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    // Check if car is available for the requested dates
    const [existingBookings] = await query<BookingRow[]>(
      `SELECT id FROM bookings 
       WHERE carId = ? 
       AND status IN ('PENDING', 'CONFIRMED') 
       AND (
         (startDate <= ? AND endDate >= ?) OR
         (startDate <= ? AND endDate >= ?) OR
         (startDate >= ? AND endDate <= ?)
       )`,
      [carId, startDate, startDate, endDate, endDate, startDate, endDate]
    );

    if (existingBookings && existingBookings.length > 0) {
      res.status(400).json({
        message: "Car is not available for the selected dates",
      });
      return;
    }

    // Create booking
    const bookingId = uuidv4();
    await query(
      `INSERT INTO bookings ( userId, carId, startDate, endDate, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, carId, startDate, endDate, "PENDING"]
    );

    res.status(201).json({
      success: true,
      message: "Car booked successfully",
      data: {
        bookingId,
        carId,
        startDate,
        endDate,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Book car error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userController = {
  bookCar,
};

export default userController;
