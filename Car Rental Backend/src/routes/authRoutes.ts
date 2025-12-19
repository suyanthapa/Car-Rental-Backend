import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware";

import validate from "../middlewares/validation";
import authValidation from "../validations/authValidation";
import authController from "../controllers/authController";

const authRoutes = Router();

authRoutes.post(
  "/register",
  validate(authValidation.register),
  authController.register
);

authRoutes.post("/login", validate(authValidation.login), authController.login);

authRoutes.post(
  "/verify-email",
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

authRoutes.post("/logout", authMiddleware, authController.logout);

export default authRoutes;
