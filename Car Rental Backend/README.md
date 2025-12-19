# 🚗 Car Rental API

A RESTful API for car rental management 

## 📋 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
  - [Auth Routes](#1️⃣-auth-routes)
  - [User Routes](#2️⃣-user-routes)
  - [Car Routes](#3️⃣-car-routes)
  - [Booking Routes](#4️⃣-booking-routes)
  - [Admin Routes](#5️⃣-admin-routes)
  - [File Upload](#6️⃣-file-upload--static-files)

---

## ✨ Features

- 🔐 JWT-based authentication
- 👤 User registration & profile management
- 🚙 Car listing with filters (type, brand, fuel)
- 📅 Booking management system
- 👑 Admin dashboard for managing users & bookings
- 📁 File upload support for driver licenses

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.2.23 or higher
- PostgreSQL database (or any Prisma-supported database)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd carRental

# Install dependencies
bun install



# Start the development server
bun dev
```

---

---

## 📖 API Documentation

Base URL: `/api/v1`

### 🔐 Authentication

This API supports **two authentication methods**:

| Method           | Usage        | How to Use                                           |
| ---------------- | ------------ | ---------------------------------------------------- |
| **Cookie**       | Web browsers | Automatically set on login via `access_token` cookie |
| **Bearer Token** | Mobile apps  | Send header `Authorization: Bearer <token>`          |

> The login endpoint returns the token in the response body for mobile apps, and also sets an HTTP-only cookie for web clients.

---

## 📝 License

This project is licensed under the MIT License.
