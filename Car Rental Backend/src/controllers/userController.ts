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

    // 1. Basic Authorization & Input Validation
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
    const today = new Date();

    // Normalize all dates to midnight for clean comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // 2. Range Validation (1-Month Rule)
    const maxAllowedDate = new Date();
    maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 1);

    if (start < today) {
      res.status(400).json({ message: "Start date cannot be in the past" });
      return;
    }

    if (end > maxAllowedDate) {
      res.status(400).json({
        message: "You can only book within a 1-month range from today",
        limit: maxAllowedDate.toISOString().split("T")[0],
      });
      return;
    }

    if (end <= start) {
      res
        .status(400)
        .json({
          message: "End date must be at least one day after start date",
        });
      return;
    }

    // 3. Check if Vehicle Exists
    const [vehicles] = await query<any[]>(
      "SELECT id, pricePerDay FROM vehicles WHERE id = ?",
      [vehicleId]
    );

    if (!vehicles || vehicles.length === 0) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }
    const vehicle = vehicles[0];

    // 4. Fetch Existing Bookings to check for Overlaps + Maintenance
    const [existingBookings] = await query<any[]>(
      `SELECT startDate, endDate 
       FROM bookings 
       WHERE vehicleId = ? AND status IN ('PENDING', 'CONFIRMED')
       ORDER BY startDate ASC`,
      [vehicleId]
    );

    // Find the SPECIFIC conflict
    const conflict = existingBookings.find((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);

      // Maintenance buffer: block the day after the booking ends
      const maintenanceDay = new Date(bEnd);
      maintenanceDay.setDate(maintenanceDay.getDate() + 1);

      // Overlap logic:
      // Does my START fall before their Maintenance ends?
      // AND Does my END fall after their Booking starts?
      return start <= maintenanceDay && end >= bStart;
    });

    if (conflict) {
      const bEnd = new Date(conflict.endDate);
      const nextAvailable = new Date(bEnd);
      nextAvailable.setDate(nextAvailable.getDate() + 2); // End + 1 (maint) + 1 (new start)

      res.status(400).json({
        message: "Vehicle unavailable (Maintenance buffer included)",
        conflict: {
          bookedUntil: bEnd.toISOString().split("T")[0],
          maintenanceDay: new Date(bEnd.getTime() + 86400000)
            .toISOString()
            .split("T")[0],
          suggestedAvailableDate: nextAvailable.toISOString().split("T")[0],
        },
      });
      return;
    }

    // 5. Success - Calculate Price and Create Record
    const durationInMs = end.getTime() - start.getTime();
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
    const totalPrice = durationInDays * vehicle.pricePerDay;

    const bookingId = uuidv4();

    // Insert Booking
    await query(
      `INSERT INTO bookings (userId, vehicleId, startDate, endDate, status) 
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [userId, vehicleId, startDate, endDate]
    );

    // Update Vehicle Status
    await query("UPDATE vehicles SET status = 'BOOKED' WHERE id = ?", [
      vehicleId,
    ]);

    res.status(201).json({
      success: true,
      message: "Booking requested successfully",
      data: {
        bookingId,
        totalPrice,
        startDate: startDate,
        endDate: endDate,
        status: "PENDING",
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
    const [vehicles] = await query<CarRow[]>(
      `SELECT * FROM vehicles 
   WHERE status IN ('AVAILABLE', 'BOOKED') 
   ORDER BY createdAt DESC`
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

const userController = {
  bookVehicle,
  getAvailableVehicle,
  getVehicleById,
  getMyBookings,
};

export default userController;
