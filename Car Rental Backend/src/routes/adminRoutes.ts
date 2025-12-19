import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware";

import validate from "../middlewares/validation";
import adminController from "../controllers/adminController";
import adminMiddleware from "../middlewares/adminMiddleware";
import upload from "../middlewares/upload";
import adminValidation from "../validations/adminValidation";

const adminRoutes = Router();

/* =========================
   VEHICLE MANAGEMENT
========================= */

// Add Car
adminRoutes.post(
  "/addCar",
  upload.array("images", 5),
  validate(adminValidation.addCar),
  adminController.addCar
);

// Get ALL vehicles (Admin – paginated)
adminRoutes.get("/vehicles", adminController.getAllVehicles);

// Edit Vehicle
adminRoutes.put(
  "/car/:carId",
  upload.array("images", 5),
  validate(adminValidation.editCar),
  adminController.editCar
);

// Delete Vehicle
adminRoutes.delete("/car/:carId", adminController.deleteCar);

/* =========================
   BOOKING MANAGEMENT
========================= */

// View pending bookings (grouped by vehicle)
adminRoutes.get("/pending-booked-vehicles", adminController.getPendingBookings);

// Approve booking
adminRoutes.patch(
  "/bookings/:bookingId/approve",
  adminController.approveBooking
);

// Cancel a booking
adminRoutes.put("/bookings/:bookingId/cancel", adminController.cancelBooking);

// View approved bookings
adminRoutes.get("/bookings/approved", adminController.getApprovedBookings);

/* =========================
   AVAILABILITY
========================= */

// View available vehicles
adminRoutes.get("/vehicles/available", adminController.getAvailableVehicles);

/* =========================
   USER MANAGEMENT
========================= */
//View own profile (admin)
adminRoutes.get("/me", authMiddleware, adminController.viewOwnProfile);

//View specific user profile
adminRoutes.get(
  "/user/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.viewUserProfile
);

// Get All Users (with Pagination)
adminRoutes.get(
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

// Edit User
adminRoutes.put(
  "/user/:userId",
  authMiddleware,
  adminMiddleware,
  validate(adminValidation.editUser),
  adminController.editUser
);
//Admin dashboard ( stats)
adminRoutes.get("/dashboard", adminController.getAdminDashboard);

export default adminRoutes;
