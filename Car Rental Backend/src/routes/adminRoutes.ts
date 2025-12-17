import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware";

import validate from "../middlewares/validation";
import adminController from "../controllers/adminController";
import adminMiddleware from "../middlewares/adminMiddleware";
import upload from "../middlewares/upload";
import adminValidation from "../validations/adminValidation";

const adminRoutes = Router();

// Get Pending Booked vehicles
adminRoutes.get(
  "/pending-booked-vehicles",
  authMiddleware,
  adminMiddleware,
  adminController.getPendingBookings
);

// Add Car
adminRoutes.post(
  "/addCar",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  validate(adminValidation.addCar),
  adminController.addCar
);

// Get All Users (with Pagination)
adminRoutes.post(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.allUsers
);

// Delete User
adminRoutes.delete(
  "/user/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteUser
);

// Delete Car
adminRoutes.delete(
  "/car/:carId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteCar
);

// Edit User
adminRoutes.put(
  "/user/:userId",
  authMiddleware,
  adminMiddleware,
  validate(adminValidation.editUser),
  adminController.editUser
);

// Edit Car
adminRoutes.put(
  "/car/:carId",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  validate(adminValidation.editCar),
  adminController.editCar
);

// Approve a booking
adminRoutes.put(
  "/bookings/:bookingId/approve",
  authMiddleware,
  adminController.approveBooking
);

// Cancel a booking
adminRoutes.put(
  "/bookings/:bookingId/cancel",
  authMiddleware,
  adminController.cancelBooking
);

export default adminRoutes;
