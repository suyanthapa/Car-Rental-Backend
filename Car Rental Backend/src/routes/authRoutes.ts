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

//to mark user email as verified after OTP verification
authRoutes.post(
  "/verify-email",
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

authRoutes.post("/logout", authMiddleware, authController.logout);

authRoutes.post(
  "/forget-password",
  validate(authValidation.forget_password),
  authController.forgetPassword
);

authRoutes.post(
  "/verify-otp",
  validate(authValidation.verify_otp),
  authController.verifyOtp
);
authRoutes.post(
  "/set-new-password",
  validate(authValidation.set_new_password),
  authController.setNewPassword
);
export default authRoutes;
