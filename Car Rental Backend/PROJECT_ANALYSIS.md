# 🚗 Car Rental Backend - Complete Project Analysis

**Generated on:** January 2, 2026  
**Project Type:** RESTful API Backend  
**Technology Stack:** Node.js, Express, TypeScript, MySQL, Cloudinary

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Structure](#2-architecture--structure)
3. [Database Design](#3-database-design)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Business Logic & Workflows](#5-business-logic--workflows)
6. [Image Storage System](#6-image-storage-system)
7. [API Endpoints](#7-api-endpoints)
8. [Security Features](#8-security-features)
9. [Email System](#9-email-system)
10. [Validation Layer](#10-validation-layer)
11. [Dependencies & External Services](#11-dependencies--external-services)
12. [Configuration Management](#12-configuration-management)
13. [Error Handling](#13-error-handling)
14. [Deployment Considerations](#14-deployment-considerations)

---

## 1. Project Overview

### Purpose

A comprehensive car rental management system that allows users to browse vehicles, make bookings, and manage their rental history, while providing administrators with tools to manage vehicles, bookings, and users.

### Key Features

- ✅ User registration with email verification (OTP-based)
- ✅ JWT-based authentication (dual support: cookies for web, Bearer tokens for mobile)
- ✅ Role-based access control (USER/ADMIN)
- ✅ Vehicle management with image uploads
- ✅ Booking system with date validation and conflict detection
- ✅ Password recovery flow with OTP
- ✅ Admin dashboard with statistics
- ✅ Rate limiting and security headers
- ✅ Pagination support for data-heavy endpoints

### Technology Choices

- **Runtime:** Bun (v1.2.23+) - Fast JavaScript runtime
- **Framework:** Express.js v5.2.1
- **Language:** TypeScript
- **Database:** MySQL 2 with connection pooling
- **Image Storage:** Cloudinary
- **Email Service:** Nodemailer with SMTP
- **Authentication:** JWT with bcrypt password hashing

---

## 2. Architecture & Structure

### Project Structure

```
src/
├── index.ts                    # Application entry point
├── controllers/               # Business logic handlers
│   ├── authController.ts      # Authentication operations
│   ├── userController.ts      # User operations
│   └── adminController.ts     # Admin operations
├── routes/                    # API route definitions
│   ├── mainRoutes.ts          # Route aggregator
│   ├── authRoutes.ts          # Auth endpoints
│   ├── userRoutes.ts          # User endpoints
│   └── adminRoutes.ts         # Admin endpoints
├── middlewares/               # Request processing middleware
│   ├── authMiddleware.ts      # JWT verification
│   ├── adminMiddleware.ts     # Role verification
│   ├── validation.ts          # Input validation
│   └── upload.ts              # Multer file upload
├── validations/               # Schema validators
│   ├── authValidation.ts
│   ├── userValidation.ts
│   └── adminValidation.ts
└── helpers/                   # Utility functions
    ├── config.ts              # Environment variables
    ├── emailMessage.ts        # Email templates
    ├── sendRecoveryOtp.ts     # Email sending
    └── config/
        ├── cloudinary.ts      # Cloudinary setup
        ├── db.ts              # Database connection
        └── env.ts             # Env loader
```

### Application Flow

```
Client Request
    ↓
Express Server (index.ts)
    ↓
Rate Limiter (15 min window, 100 requests)
    ↓
Helmet Security Headers
    ↓
Body Parsers (JSON/URL-encoded)
    ↓
Cookie Parser
    ↓
Request Logger
    ↓
Main Routes (/api/v1/)
    ↓
├─→ /auth → authRoutes
├─→ /user → authMiddleware → userRoutes
└─→ /admin → authMiddleware → adminMiddleware → adminRoutes
    ↓
Validation Middleware (Joi schemas)
    ↓
Controller (Business Logic)
    ↓
Database Query (MySQL)
    ↓
Response to Client
```

### Middleware Chain

1. **Global Middleware** (Applied to all routes)
   - Helmet: Security headers
   - Rate Limiter: DDoS protection
   - Body parsers: JSON/URL-encoded
   - Cookie parser
   - Request logger

2. **Route-Specific Middleware**
   - `authMiddleware`: Validates JWT from cookie or Authorization header
   - `adminMiddleware`: Checks for ADMIN role (must follow authMiddleware)
   - `validate()`: Joi schema validation
   - `upload`: Multer file handling for image uploads

---

## 3. Database Design

### Database Schema

#### **Users Table**

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (uuid()),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    isVerified BOOLEAN DEFAULT FALSE,
    licenseUrl VARCHAR(255) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Key Points:**

- UUID-based primary key
- Email uniqueness enforced
- Password stored as bcrypt hash (10 rounds)
- Role-based access (USER/ADMIN)
- Email verification status tracked
- License URL for future driver verification

#### **Vehicles Table**

```sql
CREATE TABLE vehicles (
    id CHAR(36) PRIMARY KEY DEFAULT (uuid()),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    type ENUM('SEDAN', 'SUV', 'HATCHBACK', 'VAN', 'TRUCK') NOT NULL,
    fuelType ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID') NOT NULL,
    seats INT NOT NULL,
    pricePerDay FLOAT NOT NULL,
    status ENUM('AVAILABLE', 'UNAVAILABLE', 'BOOKED') DEFAULT 'AVAILABLE',
    imageUrl TEXT,  -- JSON array of Cloudinary URLs
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Key Points:**

- Multiple images stored as JSON array in `imageUrl`
- Vehicle categorization by type and fuel
- Price calculated per day
- Status tracking (AVAILABLE/UNAVAILABLE/BOOKED)

#### **Bookings Table**

```sql
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    vehicleId CHAR(36) NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    totalDays INT NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
)
```

**Key Points:**

- Links users to vehicles
- Booking lifecycle: PENDING → CONFIRMED → COMPLETED
- Cascade deletion when user/vehicle removed
- Price calculation stored for historical accuracy

#### **OTP Table**

```sql
CREATE TABLE otp (
    id CHAR(36) PRIMARY KEY DEFAULT (uuid()),
    otp_code VARCHAR(100) NOT NULL,  -- Hashed OTP
    userId CHAR(36) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
)
```

**Key Points:**

- OTP stored as bcrypt hash
- 10-minute expiration
- Multiple use cases: email verification, password recovery
- Auto-deleted when user removed

### Database Connection Strategy

**Connection Pooling:**

```typescript
mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "car_rental",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectionLimit: 10, // Max concurrent connections
  waitForConnections: true,
  queueLimit: 0, // Unlimited queue
  enableKeepAlive: true,
  timezone: "+00:00", // UTC
  charset: "utf8mb4",
});
```

**Benefits:**

- Reuses connections (reduces overhead)
- Handles concurrent requests efficiently
- Automatic reconnection on failure

---

## 4. Authentication & Authorization

### Authentication Flow

#### **Registration Flow**

```
1. User submits: username, email, password
2. Check if email already exists → 409 Conflict
3. Hash password (bcrypt, 10 rounds)
4. Generate UUID for user
5. Insert user into database (isVerified = false)
6. Generate 6-digit OTP
7. Hash OTP and store in database (expires in 10 min)
8. Send OTP email
9. Return 201 Created with userId
```

#### **Email Verification Flow**

```
1. User submits: userId, otp
2. Fetch user from database
3. Fetch latest OTP for user
4. Check if OTP expired → 400 Bad Request
5. Compare OTP with stored hash (bcrypt)
6. If valid:
   - Set isVerified = true
   - Delete OTP from database
7. Return 200 Success
```

#### **Login Flow**

```
1. User submits: email, password
2. Query database for user by email
3. If not found → 401 Unauthorized
4. Compare password with hash (bcrypt)
5. If invalid → 401 Unauthorized
6. Generate JWT token:
   - Payload: { id, role }
   - Secret: process.env.JWT_SECRET
   - Expiry: 7 days
7. Set HTTP-only cookie (web)
8. Return token in response body (mobile)
```

#### **Password Recovery Flow**

```
1. Forget Password:
   - User submits email
   - Generate 6-digit OTP
   - Hash and store OTP (expires in 10 min)
   - Send OTP email

2. Verify OTP:
   - User submits: userId, otp
   - Validate OTP hash
   - Return success

3. Set New Password:
   - User submits: userId, otp, newPassword
   - Re-validate OTP (security)
   - Hash new password
   - Update user password
   - Delete OTP
```

### JWT Token Strategy

**Token Structure:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "USER",
  "iat": 1704067200,
  "exp": 1704672000
}
```

**Dual Authentication Support:**

1. **Web Clients (Cookie-based):**

   ```http
   Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
   ```

   - HttpOnly: Prevents XSS attacks
   - Secure: HTTPS only (production)
   - SameSite=Strict: CSRF protection
   - 7-day expiration

2. **Mobile Clients (Bearer Token):**
   ```http
   Authorization: Bearer <jwt>
   ```

   - Token returned in response body
   - Client stores and sends in header

**Authentication Middleware Logic:**

```typescript
1. Check Authorization header for "Bearer <token>"
2. If not found, check cookies for "access_token"
3. If neither exists → 401 Unauthorized
4. Verify JWT signature and expiration
5. Decode payload → extract user id and role
6. Attach to request: req.user = { id, role }
7. Call next()
```

### Authorization (Role-Based Access Control)

**Admin Middleware:**

```typescript
1. Requires authMiddleware to run first
2. Check req.user.role === 'ADMIN'
3. If not admin → 403 Forbidden
4. If admin → call next()
```

**Protected Route Example:**

```typescript
// User route (requires authentication only)
router.get("/user/me", authMiddleware, userController.viewProfile);

// Admin route (requires authentication + admin role)
router.delete(
  "/admin/user/:id",
  authMiddleware,
  adminMiddleware,
  adminController.deleteUser
);
```

---

## 5. Business Logic & Workflows

### Vehicle Booking System

#### **Booking Creation Workflow**

```
User initiates booking → bookVehicle()
    ↓
1. Validate Authentication
   - Check userId from JWT
   - If missing → 401 Unauthorized
    ↓
2. Validate Input
   - vehicleId, startDate, endDate required
   - Parse dates to Date objects
    ↓
3. Date Validation Rules
   ✓ Start date cannot be in the past
   ✓ End date must be > start date (min 1 day)
   ✓ Booking range limited to 1 month from today
    ↓
4. Vehicle Existence Check
   - Query vehicle by ID
   - If not found → 404 Not Found
   - Extract pricePerDay
    ↓
5. Conflict Detection (Critical)
   - Query bookings for same vehicle
   - Check for date overlaps with PENDING/CONFIRMED bookings
   - SQL: NOT (endDate+1 < requestStart OR startDate > requestEnd)
   - If conflict exists:
     * Calculate next available date (bookedUntil + 2 days)
     * Return 400 with availableFrom date
    ↓
6. Price Calculation
   - Duration = (endDate - startDate) in days
   - TotalPrice = duration × pricePerDay
    ↓
7. Create Booking
   - Status: PENDING (awaits admin approval)
   - Insert into bookings table
    ↓
8. Return Success
   - 201 Created
   - Include booking details and totalPrice
```

#### **Booking Approval Workflow (Admin)**

```
Admin approves booking → approveBooking()
    ↓
1. Validate booking exists
2. Check status = PENDING (only pending can be approved)
3. Update booking status → CONFIRMED
4. Update vehicle status → BOOKED
5. Return 200 Success
```

#### **Booking Cancellation Workflow**

```
User/Admin cancels → cancelBooking()
    ↓
1. Fetch booking by ID
2. Status Validation:
   - If already CANCELLED → 400 Bad Request
   - If COMPLETED → 400 (cannot cancel completed)
3. Update status → CANCELLED
4. Vehicle remains as-is (admin handles availability)
5. Return 200 Success
```

### Vehicle Management

#### **Add Vehicle (Admin)**

```
1. Validate admin role
2. Validate input: name, brand, type, fuelType, seats, pricePerDay
3. Check images uploaded (1-5 required)
4. Upload images to Cloudinary → get URLs
5. Store vehicle with JSON array of image URLs
6. Return 201 with vehicle data
```

#### **Edit Vehicle (Admin)**

```
1. Validate vehicle exists
2. Build dynamic UPDATE query (only provided fields)
3. If new images uploaded → replace old URLs
4. Update vehicle in database
5. Return 200 Success
```

#### **Delete Vehicle (Admin)**

```
1. Check vehicle exists
2. Delete vehicle (cascades to bookings due to FK)
3. Return 200 Success
```

### User Management

#### **View Profile**

- Users can view own profile
- Admins can view any user profile

#### **Update Password**

```
1. User provides: oldPassword, newPassword
2. Fetch current password hash
3. Verify oldPassword matches
4. Hash newPassword (bcrypt, 10 rounds)
5. Update database
6. Return 200 Success
```

#### **Admin User Management**

- **List Users:** Paginated list of all users (excludes admins)
- **Edit User:** Update username, email, phone
- **Delete User:** Remove user (cascades to bookings)

### Search & Filtering

#### **Available Vehicle Search**

```
User requests vehicles with optional search term
    ↓
1. Base filter: status IN ('AVAILABLE', 'BOOKED')
2. If search provided:
   - Match against name OR brand (case-insensitive)
   - SQL: WHERE (name LIKE ? OR brand LIKE ?)
3. Return vehicles with parsed image URLs
```

### Dashboard Statistics (Admin)

**Metrics Calculated:**

```
1. Total Users (role = USER)
2. Total Vehicles
3. Pending Bookings (status = PENDING)
4. Confirmed Bookings (status = CONFIRMED)
5. Total Revenue:
   - SUM(DATEDIFF(endDate, startDate) × pricePerDay)
   - Only CONFIRMED bookings counted
```

---

## 6. Image Storage System

### Cloudinary Integration

**Configuration:**

```typescript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Upload Strategy

**Multer + Cloudinary Storage:**

```typescript
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "vehicles", // Organized in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});
```

**Usage in Routes:**

```typescript
// Upload multiple images (1-5)
router.post('/addCar', upload.array('images', 5), validate(...), addCar)

// Images accessible via (req.files as Express.Multer.File[])
// Each file has .path property = Cloudinary URL
```

**Storage Format:**

- Images uploaded to Cloudinary
- URLs returned: `https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.jpg`
- Stored in database as JSON array: `["url1", "url2", "url3"]`
- Parsed on retrieval: `JSON.parse(imageUrl)`

**Benefits:**

- Offloads storage from server
- CDN delivery (fast global access)
- Automatic image optimization
- Built-in transformations (resize, crop, etc.)

---

## 7. API Endpoints

### Base URL

`http://localhost:<PORT>/api/v1`

---

### **Authentication Endpoints** (`/auth`)

| Method | Endpoint                 | Auth | Description                   |
| ------ | ------------------------ | ---- | ----------------------------- |
| POST   | `/auth/register`         | None | Register new user             |
| POST   | `/auth/login`            | None | Login and get JWT             |
| POST   | `/auth/logout`           | JWT  | Clear auth cookie             |
| POST   | `/auth/verify-email`     | None | Verify email with OTP         |
| POST   | `/auth/forget-password`  | None | Request password reset OTP    |
| POST   | `/auth/verify-otp`       | None | Verify OTP for password reset |
| POST   | `/auth/set-new-password` | None | Set new password after OTP    |

---

### **User Endpoints** (`/user`)

| Method | Endpoint                    | Auth       | Description                   |
| ------ | --------------------------- | ---------- | ----------------------------- |
| GET    | `/user/me`                  | JWT (USER) | View own profile              |
| GET    | `/user/vehicles/available`  | JWT        | Search available vehicles     |
| GET    | `/user/vehicles/:vehicleId` | JWT        | View specific vehicle details |
| POST   | `/user/bookVehicle`         | JWT        | Create new booking            |
| GET    | `/user/bookings/me`         | JWT        | View own booking history      |
| PATCH  | `/user/updatePassword`      | JWT        | Update password               |

---

### **Admin Endpoints** (`/admin`)

#### Vehicle Management

| Method | Endpoint                    | Auth        | Description                   |
| ------ | --------------------------- | ----------- | ----------------------------- |
| POST   | `/admin/addCar`             | JWT (ADMIN) | Add new vehicle (multipart)   |
| GET    | `/admin/vehicles`           | JWT (ADMIN) | List all vehicles (paginated) |
| PUT    | `/admin/car/:carId`         | JWT (ADMIN) | Update vehicle (multipart)    |
| DELETE | `/admin/car/:carId`         | JWT (ADMIN) | Delete vehicle                |
| GET    | `/admin/vehicles/available` | JWT (ADMIN) | List available vehicles       |

#### Booking Management

| Method | Endpoint                             | Auth        | Description                 |
| ------ | ------------------------------------ | ----------- | --------------------------- |
| GET    | `/admin/bookings`                    | JWT (ADMIN) | List all bookings           |
| GET    | `/admin/pending-booked-vehicles`     | JWT (ADMIN) | Pending bookings by vehicle |
| GET    | `/admin/bookings/approved`           | JWT (ADMIN) | List confirmed bookings     |
| PATCH  | `/admin/bookings/:bookingId/approve` | JWT (ADMIN) | Approve pending booking     |
| PUT    | `/admin/bookings/:bookingId/cancel`  | JWT (ADMIN) | Cancel booking              |

#### User Management

| Method | Endpoint              | Auth        | Description                |
| ------ | --------------------- | ----------- | -------------------------- |
| GET    | `/admin/me`           | JWT (ADMIN) | View own profile           |
| GET    | `/admin/users`        | JWT (ADMIN) | List all users (paginated) |
| GET    | `/admin/user/:userId` | JWT (ADMIN) | View user profile          |
| PUT    | `/admin/user/:userId` | JWT (ADMIN) | Update user details        |
| DELETE | `/admin/user/:userId` | JWT (ADMIN) | Delete user                |

#### Dashboard

| Method | Endpoint           | Auth        | Description    |
| ------ | ------------------ | ----------- | -------------- |
| GET    | `/admin/dashboard` | JWT (ADMIN) | Get statistics |

---

## 8. Security Features

### Implemented Security Measures

1. **Helmet.js**
   - Sets secure HTTP headers
   - Prevents clickjacking, XSS, MIME sniffing
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`

2. **Rate Limiting**

   ```typescript
   {
     windowMs: 15 * 60 * 1000,  // 15 minutes
     max: 100,  // 100 requests per window
     message: "Too many requests, please try again later."
   }
   ```

   - Applied to `/api` routes
   - Prevents DDoS and brute-force attacks

3. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Never stored in plain text
   - OTPs also hashed before storage

4. **JWT Security**
   - Signed with secret key
   - 7-day expiration
   - HttpOnly cookies (web)
   - Token verification on every protected route

5. **Input Validation**
   - Joi schemas for all endpoints
   - Prevents injection attacks
   - Type checking and sanitization

6. **CSRF Protection**
   - `SameSite=Strict` cookie attribute
   - Prevents cross-site request forgery

7. **SQL Injection Prevention**
   - Parameterized queries throughout
   - Never concatenate user input in SQL

8. **CORS Configuration**
   - Restrict origins in production
   - Currently: `cors()` (adjust for production)

9. **Environment Variables**
   - Sensitive data never hardcoded
   - `.env` file excluded from version control

10. **Connection Security**
    - HTTPS enforcement in production
    - Secure cookie flag enabled

---

## 9. Email System

### SMTP Configuration

```typescript
nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: port === 465, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

### Email Topics

1. **Email Verification**
   - Subject: "Verify Email"
   - Content: 6-digit OTP
   - Trigger: User registration

2. **Password Recovery**
   - Subject: "Forget Password"
   - Content: 6-digit OTP
   - Trigger: Forget password request

### OTP Generation

```typescript
function generateToken(): string {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}
// Generates: 100000-999999 (6 digits)
```

### Email Workflow

```
1. Generate 6-digit OTP
2. Create HTML email from template
3. Send via SMTP
4. Hash OTP with bcrypt
5. Store in database with 10-min expiry
6. Return OTP (for logging, remove in production)
```

---

## 10. Validation Layer

### Validation Strategy

**Middleware Usage:**

```typescript
router.post(
  "/register",
  validate(authValidation.register),
  controller.register
);
```

**Validation Files:**

- `authValidation.ts`: Login, register, OTP operations
- `userValidation.ts`: Booking, password update
- `adminValidation.ts`: Vehicle/user management

**Validation Technology:**

- **Joi** (v18.0.2): Schema validation
- Validates: types, lengths, formats, required fields

**Example Schema:**

```typescript
{
  register: Joi.object({
    username: Joi.string().min(2).max(150).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(50).required(),
  });
}
```

**Validation Errors:**

- Returns 400 Bad Request
- Detailed error messages for each field

---

## 11. Dependencies & External Services

### Core Dependencies

**Runtime & Framework:**

- `bun`: JavaScript runtime
- `express` (v5.2.1): Web framework
- `typescript` (v5): Type safety

**Database:**

- `mysql2` (v3.15.3): MySQL driver with promises
- Connection pooling built-in

**Authentication:**

- `jsonwebtoken` (v9.0.3): JWT generation/verification
- `bcrypt` / `bcryptjs` (v6.0.0 / v3.0.3): Password hashing
- `cookie-parser` (v1.4.7): Cookie parsing

**File Upload:**

- `multer` (v2.0.2): Multipart form handling
- `cloudinary` (v2.8.0): Image hosting
- `multer-storage-cloudinary` (v4.0.0): Multer-Cloudinary bridge

**Email:**

- `nodemailer` (v7.0.11): Email sending
- SMTP transport

**Validation:**

- `joi` (v18.0.2): Schema validation
- `zod` (v4.1.13): Alternative validator (unused?)

**Security:**

- `helmet` (v8.1.0): Security headers
- `express-rate-limit` (v8.2.1): Rate limiting
- `cors` (v2.8.5): Cross-origin requests

**Utilities:**

- `dotenv` (v17.2.3): Environment variables
- `uuid` (v13.0.0): UUID generation

**Development:**

- `nodemon` (v3.1.11): Auto-restart
- `prettier` (v3.6.2): Code formatting

### External Services

1. **MySQL Database**
   - Hosted locally or cloud (RDS, etc.)
   - Requires credentials

2. **Cloudinary**
   - Image CDN and storage
   - Free tier: 25 credits/month
   - Requires: cloud_name, api_key, api_secret

3. **SMTP Server**
   - Email delivery
   - Options: Gmail, SendGrid, Mailgun
   - Requires: host, port, user, pass

---

## 12. Configuration Management

### Environment Variables

**Required Variables:**

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=car_rental
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=your_super_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
GMAIL_USER=your_email@gmail.com

# Environment
NODE_ENV=development
```

**Configuration Loading:**

```typescript
// src/helpers/config/env.ts
import { config } from "dotenv";
config();
export default process.env;
```

**Usage:**

```typescript
import env from "./helpers/config";
const port = env.PORT;
```

---

## 13. Error Handling

### Error Response Format

**Standard Error Response:**

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (optional)"
}
```

### Error Categories

1. **Validation Errors (400)**
   - Invalid input
   - Missing required fields
   - Format errors

2. **Authentication Errors (401)**
   - Missing token
   - Invalid token
   - Expired token

3. **Authorization Errors (403)**
   - Insufficient permissions
   - Admin access required

4. **Not Found Errors (404)**
   - Resource doesn't exist
   - User/Vehicle/Booking not found

5. **Conflict Errors (409)**
   - User already exists
   - Booking conflict

6. **Server Errors (500)**
   - Database errors
   - Unhandled exceptions
   - Email service failures

### Error Logging

```typescript
try {
  // Operation
} catch (error) {
  console.error("Operation error:", error);
  res.status(500).json({ message: "Internal server error" });
}
```

### 404 Handler

```typescript
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});
```

---

## 14. Deployment Considerations

### Pre-Deployment Checklist

**Environment:**

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up Cloudinary account
- [ ] Configure SMTP service

**Security:**

- [ ] Enable HTTPS
- [ ] Set `secure: true` for cookies
- [ ] Configure CORS for specific origins
- [ ] Review rate limit settings
- [ ] Remove console.logs in production

**Database:**

- [ ] Run schema.sql to create tables
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Index frequently queried columns

**Monitoring:**

- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up database monitoring

**Performance:**

- [ ] Implement caching (Redis)
- [ ] Optimize database queries
- [ ] Enable compression (gzip)
- [ ] CDN for static assets

### Deployment Options

1. **Traditional Hosting**
   - VPS (DigitalOcean, Linode, AWS EC2)
   - Process manager: PM2
   - Reverse proxy: Nginx

2. **Platform as a Service**
   - Heroku
   - Railway
   - Render

3. **Containerization**
   - Docker
   - Kubernetes
   - Docker Compose

### Database Migration

**Current State:** Raw SQL in `schema.sql`

**Recommendation:** Use migration tool

- Prisma Migrate
- Sequelize Migrations
- Knex.js

### Scaling Considerations

**Horizontal Scaling:**

- Load balancer (Nginx, AWS ELB)
- Multiple app instances
- Shared session store (Redis)

**Database Scaling:**

- Read replicas
- Connection pooling (already implemented)
- Database sharding (if needed)

**Caching:**

- Redis for frequently accessed data
- Vehicle listings
- User sessions

---

## 📊 Summary Statistics

### Codebase Overview

- **Total Controllers:** 3 (auth, user, admin)
- **Total Routes:** 3 route files + 1 main router
- **Middleware:** 4 (auth, admin, validation, upload)
- **Database Tables:** 4 (users, vehicles, bookings, otp)
- **API Endpoints:** ~30+
- **External Services:** 3 (MySQL, Cloudinary, SMTP)

### Key Business Flows

1. **User Registration → Email Verification → Login**
2. **Browse Vehicles → Book Vehicle → Admin Approval → Confirmed Booking**
3. **Forget Password → OTP Verification → Reset Password**
4. **Admin: Add Vehicle → Upload Images → Manage Bookings**

### Security Layers

- Rate Limiting ✓
- JWT Authentication ✓
- Role-Based Authorization ✓
- Password Hashing ✓
- Input Validation ✓
- SQL Injection Prevention ✓
- XSS Protection (Helmet) ✓
- CSRF Protection (SameSite) ✓

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Database setup
# 1. Create database
# 2. Run schema.sql

# Format code
bun run format
```

---

## 📝 Future Enhancements

1. **Payment Integration**
   - Stripe/PayPal integration
   - Booking deposits

2. **Advanced Booking**
   - Recurring bookings
   - Booking extensions
   - Waitlist system

3. **Driver Verification**
   - License upload and verification
   - Age verification

4. **Reviews & Ratings**
   - User reviews for vehicles
   - Rating system

5. **Real-time Notifications**
   - WebSocket for booking updates
   - Push notifications

6. **Analytics Dashboard**
   - Revenue tracking
   - Popular vehicles
   - Booking trends

7. **Multi-tenancy**
   - Multiple rental companies
   - Franchise support

---

**Document End**

_This analysis covers the complete architecture, business logic, security, and operational aspects of the Car Rental Backend system as of January 2, 2026._
