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

// Book Car
userRoutes.post(
  "/bookCar",
  authMiddleware,
  validate(userValidation.bookVehicle),
  userController.bookVehicle
);

export default userRoutes;
