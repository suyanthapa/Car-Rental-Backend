import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { query } from "../helpers/config/db";
import env from "../helpers/config";
import { sendEmailToken } from "../helpers/sendRecoveryOtp";
import { EmailTopic } from "../helpers/emailMessage";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  role: string;
}

interface OtpRow extends RowDataPacket {
  id: string;
  otp_code: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}
const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    const [existingUsers] = await query<UserRow[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert user (RAW SQL)
    const [result]: any = await query(
      "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
      [userId, username, email, hashedPassword]
    );
    const sql = `
      DELETE FROM otp
      WHERE userId = ?
    `;

    //delete any existing otp for the user
    await query(sql, [userId]);
    const otp = await sendEmailToken(
      email,
      email,
      EmailTopic.VerifyEmail,
      userId
    );
    console.log("OTP sent:", otp);

    const insertOtpSql = `
  INSERT INTO otp (otp_code, userId, expiresAt)
  VALUES (?, ?, ?)
`;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); //expires in 10 minutes

    await query(insertOtpSql, [otp, userId, expiresAt]);

    //  Success response
    res.status(201).json({
      message: "User registered successfully and sent otp to email",
      userId: userId || 1,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // 1️⃣ Find user
    const [users] = await query<UserRow[]>(
      "SELECT id, email, password, role FROM users WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const user = users[0];

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const jwtSecret = process.env.JWT_SECRET!;
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });

    // ✅ Set HTTP-only cookie
    res.cookie("access_token", token, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production",

      sameSite: "strict", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: "/",
    });

    //  Response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the cookie
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { userId, otp } = req.body;

  try {
    if (!userId || !otp) {
      res.status(400).json({ message: "UserId and OTP are required" });
      return;
    }

    //  Fetch user
    const [users] = await query<UserRow[]>("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      res.status(400).json({ message: "User does not exist" });
      return;
    }
    const user = users[0]!;

    //  Fetch latest OTP
    const [otps] = await query<OtpRow[]>(
      "SELECT * FROM otp WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
      [user.id]
    );
    if (otps.length === 0) {
      res.status(400).json({ message: "Invalid OTP or expired" });
      return;
    }
    const otpDoc = otps[0]!;

    //  Check expiry
    const now = new Date();
    if (new Date(otpDoc.expiresAt) < now) {
      res.status(400).json({ message: "OTP expired" });
      return;
    }

    // Compare OTP (plain text)
    const providedOtp = otp.toString().trim();
    if (otpDoc.otp_code !== providedOtp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    //  Update user to verified
    await query("UPDATE users SET isVerified = 1 WHERE id = ?", [user.id]);

    // Delete all OTPs for this user
    await query("DELETE FROM otp WHERE userId = ?", [user.id]);

    res.status(200).json({
      message: "Email verified successfully",
      info: { isVerified: 1, email: user.email },
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const forgetPassword = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email } = req.body;

//     // Find user by email
//     const existingUser = await findUserByEmail(email);

//     if (!existingUser) {
//       res
//         .status(400)
//         .json(
//           makeErrorResponse(
//             new Error("User does not exist"),
//             "error.auth.user_not_found",
//             lang,
//             400
//           )
//         );
//       return;
//     }

//     // If not verified, resend verification OTP
//     if (!existingUser.isVerified) {
//       // Delete all existing OTPs for this user
//       await deleteUserOTPs(existingUser.id);

//       // Generate and send OTP
//       const otp = await sendEmailToken(
//         email,
//         email,
//         EmailTopic.VerifyEmail,
//         existingUser.id
//       );
//       const hashedOtp = await bcrypt.hash(otp.toString(), 10);

//       // Create new OTP
//       await createOTP(
//         existingUser.id,
//         hashedOtp,
//         new Date(Date.now() + 10 * 60 * 1000)
//       );

//       res
//         .status(403)
//         .json(
//           makeErrorResponse(
//             new Error("Email not verified. Verification link resent."),
//             "error.auth.email_not_verified",
//             lang,
//             403
//           )
//         );
//       return;
//     }

//     // For verified users → send password reset OTP

//     // Delete all existing OTPs for this user
//     await deleteUserOTPs(existingUser.id);

//     // Generate and send OTP
//     const otp = await sendEmailToken(
//       email,
//       existingUser.UserName,
//       EmailTopic.ForgotPassword,
//       existingUser.id
//     );
//     const hashedOtp = await bcrypt.hash(otp.toString(), 10);

//     // Create new OTP
//     await createOTP(
//       existingUser.id,
//       hashedOtp,
//       new Date(Date.now() + 10 * 60 * 1000)
//     );

//     res
//       .status(200)
//       .json(
//         makeSuccessResponse(
//           { userId: existingUser.id },
//           "success.auth.otp_sent",
//           lang,
//           200
//         )
//       );
//     return;
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const authController = {
  register,
  login,
  logout,
  verifyEmail,
};

export default authController;
