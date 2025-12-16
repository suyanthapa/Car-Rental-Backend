import { Router } from "express";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import authMiddleware from "../middlewares/authMiddleware";
import adminMiddleware from "../middlewares/adminMiddleware";

const mainRoutes = Router();

mainRoutes.use("/auth", authRoutes);
mainRoutes.use("/admin", authMiddleware, adminMiddleware, adminRoutes);

export default mainRoutes;
