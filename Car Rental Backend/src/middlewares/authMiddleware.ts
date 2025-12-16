import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Authentication Middleware
 * Validates JWT token from Bearer header (mobile) or cookie (web)
 * and attaches user ID to request
 */
const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  // First, check for Bearer token in Authorization header (mobile clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // Fallback to cookie (web clients)
  if (!token) {
    token = req.cookies?.access_token;
  }
  console.log("Token from AuthMiddleware", token);
  if (!token) {
    res.status(401).json({ message: "Authentication required from AuthM" });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Attach user ID to request
    req.userId = decoded.id;
    console.log("Decoded ID from AuthM", decoded.id);
    req.user = { id: decoded.id, role: (decoded as any).role }; // Assuming role is included in token
    console.log("Req.user from AuthM", req.user);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token has expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    res.status(401).json({ message: "Authentication failed" });
  }
};

export default authMiddleware;
