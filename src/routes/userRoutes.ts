import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import validate from "../middlewares/validation";
import userController from "../controllers/userController";
import userValidation from "../validations/userValidation";

const userRoutes = Router();

// Book Car
userRoutes.post(
  "/bookCar",
  authMiddleware,
  validate(userValidation.bookCar),
  userController.bookCar
);

export default userRoutes;
