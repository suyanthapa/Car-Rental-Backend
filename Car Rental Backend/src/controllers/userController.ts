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
  vehicleId: string;
  startDate: string;
  endDate: string;
  status: string;
}

const bookVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!vehicleId || !startDate || !endDate) {
      res
        .status(400)
        .json({ message: "Vehicle ID, start date, and end date are required" });
      return;
    }

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

    // Check if vehicle exists and get pricePerDay
    const [vehicles] = await query<CarRow[]>(
      "SELECT id, pricePerDay FROM vehicles WHERE id = ?",
      [vehicleId]
    );

    if (!vehicles || vehicles.length === 0) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }

    const vehicle = vehicles[0]!;

    // Check if car is available for the requested dates
    const [existingBookings] = await query<BookingRow[]>(
      `SELECT startDate, endDate 
       FROM bookings 
       WHERE vehicleId = ? AND status IN ('PENDING', 'CONFIRMED')
       ORDER BY endDate DESC`,
      [vehicleId]
    );

    const overlap = existingBookings.some(
      (b) => start <= new Date(b.endDate) && end >= new Date(b.startDate)
    );

    if (overlap) {
      // Suggest available date starting 1 day after last booking
      const lastBooking = existingBookings[0];
      if (lastBooking) {
        const lastBookingEnd = new Date(lastBooking.endDate);
        const suggestedStart = new Date(
          lastBookingEnd.getTime() + 24 * 60 * 60 * 1000
        ); // +1 day

        res.status(400).json({
          message: "Vehicle is not available for the selected dates",
          availableFrom: suggestedStart.toISOString().split("T")[0],
        });
      }
      return;
    }

    // Calculate total price
    const durationInMs = end.getTime() - start.getTime();
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)); // round up
    const totalPrice = durationInDays * vehicle.pricePerDay;

    // Create booking
    const bookingId = uuidv4();
    await query(
      `INSERT INTO bookings ( userId, vehicleId, startDate, endDate, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, vehicleId, startDate, endDate, "PENDING"]
    );

    res.status(201).json({
      success: true,
      message: "Vehicle booked 'on pending' status",
      data: {
        bookingId,
        vehicleId,
        startDate,
        endDate,
        status: "PENDING",
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Book vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAvailableVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [vehicles] = await query<CarRow[]>(
      `SELECT * FROM vehicles WHERE status = 'AVAILABLE' ORDER BY createdAt DESC`
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

const userController = {
  bookVehicle,
  getAvailableVehicle,
  getVehicleById,
};

export default userController;
