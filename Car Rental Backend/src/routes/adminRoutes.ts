import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware";

import validate from "../middlewares/validation";
import authValidation from "../validations/authValidation";
import authController from "../controllers/authController";
import adminController from "../controllers/adminController";
import adminMiddleware from "../middlewares/adminMiddleware";
import upload from "../middlewares/upload";
import adminValidation from "../validations/adminValidation";

const adminRoutes = Router();

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

export default adminRoutes;
