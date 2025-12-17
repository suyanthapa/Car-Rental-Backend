import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import validate from "../middlewares/validation";
import userController from "../controllers/userController";
import userValidation from "../validations/userValidation";
const userRoutes = Router();

// Get Car
userRoutes.get(
  "/vehicles/available",
  authMiddleware,
  userController.getAvailableVehicle
);

// View specific vehicle
userRoutes.get(
  "/vehicles/:vehicleId",
  authMiddleware,
  validate(userValidation.viewSpecificVehicle),
  userController.getVehicleById
);

// Book Vehicle
userRoutes.post(
  "/bookVehicle",
  authMiddleware,
  validate(userValidation.bookVehicle),
  userController.bookVehicle
);

export default userRoutes;
