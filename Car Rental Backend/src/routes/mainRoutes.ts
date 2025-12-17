import { Router } from "express";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import userRoutes from "./userRoutes";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";

const mainRoutes = Router();

mainRoutes.use("/auth", authRoutes);
mainRoutes.use("/admin", authMiddleware, adminMiddleware, adminRoutes);
mainRoutes.use("/user", authMiddleware, userRoutes);

export default mainRoutes;
