# Car Rental API Documentation

**Base URL:** `http://localhost:<PORT>/api/v1`

**Version:** 1.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin - Vehicle Management](#admin---vehicle-management)
3. [Admin - Booking Management](#admin---booking-management)
4. [Admin - User Management](#admin---user-management)
5. [Admin - Dashboard & Stats](#admin---dashboard--stats)
6. [User - Vehicle Operations](#user---vehicle-operations)
7. [User - Booking Operations](#user---booking-operations)
8. [Error Responses](#error-responses)

---

## Authentication

All requests use JWT tokens for authentication. Tokens can be passed in two ways:

- **Bearer Token (Mobile)**: `Authorization: Bearer <token>`
- **Cookie (Web)**: `access_token=<token>`

### Register User

**POST** `/auth/register`

Register a new user account.

**Authentication:** None

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**

- `username`: 2-150 characters, required
- `email`: Valid email format, required
- `password`: 8-50 characters, required

**Success Response (201):**

```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**Error Responses:**

| Status Code | Message               | Description                 |
| ----------- | --------------------- | --------------------------- |
| 409         | User already exists   | Email is already registered |
| 400         | Validation error      | Invalid input data          |
| 500         | Internal server error | Server error                |

---

### Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Authentication:** None

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**

- `email`: Valid email format, required
- `password`: 8-50 characters, required

**Success Response (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**Cookies Set:**

- `access_token`: HTTP-only, secure in production, 7 days expiry

**Error Responses:**

| Status Code | Message                         | Description           |
| ----------- | ------------------------------- | --------------------- |
| 401         | Invalid email or password       | Incorrect credentials |
| 400         | Email and password are required | Missing fields        |
| 500         | Internal server error           | Server error          |

---

## Admin - Vehicle Management

All admin routes require authentication and ADMIN role.

**Authentication Required:** JWT Token + ADMIN role

---

### Add Vehicle

**POST** `/admin/addCar`

Add a new vehicle to the system.

**Authentication:** JWT Token (ADMIN role)

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**

| Field       | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| name        | string | Yes      | Vehicle name (2-150 chars)           |
| brand       | string | Yes      | Vehicle brand                        |
| type        | string | Yes      | SEDAN, SUV, HATCHBACK, VAN, TRUCK    |
| fuelType    | string | Yes      | PETROL, DIESEL, ELECTRIC, HYBRID     |
| seats       | number | Yes      | 2-10 seats                           |
| pricePerDay | number | Yes      | Daily rental price (positive number) |
| images      | file[] | Yes      | 1-5 vehicle images                   |

**Success Response (201):**

```json
{
  "message": "Car added successfully",
  "car": {
    "name": "Toyota Camry",
    "brand": "Toyota",
    "type": "SEDAN",
    "fuelType": "PETROL",
    "seats": 5,
    "pricePerDay": 50,
    "imageUrls": [
      "https://res.cloudinary.com/xxx/image1.jpg",
      "https://res.cloudinary.com/xxx/image2.jpg"
    ]
  }
}
```

**Error Responses:**

| Status Code | Message                        | Description              |
| ----------- | ------------------------------ | ------------------------ |
| 401         | Unauthorized                   | Missing or invalid token |
| 403         | Admin access required          | User is not admin        |
| 400         | At least one image is required | No images uploaded       |
| 400         | Validation error               | Invalid input data       |
| 500         | Internal server error          | Server error             |

---

### Get All Vehicles (Admin)

**GET** `/admin/vehicles?page=1&limit=10`

Retrieve all vehicles with pagination (admin view).

**Authentication:** JWT Token (ADMIN role)

**Query Parameters:**

| Parameter | Type   | Default | Description    |
| --------- | ------ | ------- | -------------- |
| page      | number | 1       | Page number    |
| limit     | number | 10      | Items per page |

**Success Response (200):**

```json
{
  "success": true,
  "message": "All vehicles fetched successfully",
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Toyota Camry",
      "brand": "Toyota",
      "type": "SEDAN",
      "fuelType": "PETROL",
      "seats": 5,
      "pricePerDay": 50,
      "status": "AVAILABLE",
      "images": ["https://res.cloudinary.com/xxx/image1.jpg"],
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 403         | Admin access required   | User is not admin        |
| 500         | Internal server error   | Server error             |

---

### Edit Vehicle

**PUT** `/admin/car/:carId`

Update vehicle details.

**Authentication:** JWT Token (ADMIN role)

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Path Parameters:**

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| carId     | string | Vehicle UUID |

**Request Body (multipart/form-data):**

All fields are optional:

| Field       | Type   | Description                       |
| ----------- | ------ | --------------------------------- |
| name        | string | Vehicle name (2-150 chars)        |
| brand       | string | Vehicle brand                     |
| type        | string | SEDAN, SUV, HATCHBACK, VAN, TRUCK |
| fuelType    | string | PETROL, DIESEL, ELECTRIC, HYBRID  |
| seats       | number | 2-10 seats                        |
| pricePerDay | number | Daily rental price                |
| images      | file[] | 1-5 vehicle images (optional)     |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Car updated successfully"
}
```

**Error Responses:**

| Status Code | Message               | Description              |
| ----------- | --------------------- | ------------------------ |
| 401         | Unauthorized          | Missing or invalid token |
| 403         | Admin access required | User is not admin        |
| 404         | Car not found         | Vehicle doesn't exist    |
| 400         | No fields to update   | No data provided         |
| 500         | Internal server error | Server error             |

---

### Delete Vehicle

**DELETE** `/admin/car/:carId`

Delete a vehicle from the system.

**Authentication:** JWT Token (ADMIN role)

**Path Parameters:**

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| carId     | string | Vehicle UUID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Car deleted successfully"
}
```

**Error Responses:**

| Status Code | Message               | Description              |
| ----------- | --------------------- | ------------------------ |
| 401         | Unauthorized          | Missing or invalid token |
| 403         | Admin access required | User is not admin        |
| 404         | Car not found         | Vehicle doesn't exist    |
| 400         | Car ID is required    | Missing parameter        |
| 500         | Internal server error | Server error             |

---

### Get Available Vehicles (Admin)

**GET** `/admin/vehicles/available`

Get all vehicles that are not booked or pending for current/future dates.

**Authentication:** JWT Token (ADMIN role)

**Success Response (200):**

```json
{
  "success": true,
  "totalAvailableVehicles": 5,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Toyota Camry",
      "brand": "Toyota",
      "type": "SEDAN",
      "fuelType": "PETROL",
      "seats": 5,
      "pricePerDay": 50,
      "images": ["https://res.cloudinary.com/xxx/image1.jpg"]
    }
  ]
}
```

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 403         | Admin access required   | User is not admin        |
| 500         | Internal server error   | Server error             |

---

## Admin - Booking Management

### Get Pending Bookings

**GET** `/admin/pending-booked-vehicles`

View all pending bookings grouped by vehicle.

**Authentication:** JWT Token (ADMIN role)

**Success Response (200):**

```json
{
  "success": true,
  "totalvehicles": 2,
  "totalBookings": 3,
  "data": [
    {
      "car": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Toyota Camry",
        "brand": "Toyota",
        "type": "SEDAN",
        "fuelType": "PETROL",
        "seats": 5,
        "pricePerDay": 50,
        "images": ["https://res.cloudinary.com/xxx/image1.jpg"]
      },
      "bookings": [
        {
          "booking": {
            "id": "660e8400-e29b-41d4-a716-446655440000",
            "status": "PENDING",
            "startDate": "2025-01-20",
            "endDate": "2025-01-25",
            "createdAt": "2025-01-15T10:30:00.000Z"
          },
          "user": {
            "id": "770e8400-e29b-41d4-a716-446655440000",
            "username": "john_doe",
            "email": "john@example.com",
            "phone": "+1234567890"
          }
        }
      ]
    }
  ]
}
```

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 403         | Admin access required   | User is not admin        |
| 500         | Internal server error   | Server error             |

---

### Approve Booking

**PATCH** `/admin/bookings/:bookingId/approve`

Approve a pending booking.

**Authentication:** JWT Token (ADMIN role)

**Path Parameters:**

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| bookingId | string | Booking UUID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Booking approved successfully"
}
```

**Error Responses:**

| Status Code | Message                               | Description                   |
| ----------- | ------------------------------------- | ----------------------------- |
| 401         | Unauthorized                          | Missing or invalid token      |
| 403         | Admin access required                 | User is not admin             |
| 404         | Booking not found                     | Booking doesn't exist         |
| 400         | Only pending bookings can be approved | Booking status is not PENDING |
| 400         | Booking ID is required                | Missing parameter             |
| 500         | Internal server error                 | Server error                  |

---

### Cancel & Delete Booking

**PUT** `/admin/bookings/:bookingId/cancel`

Cancel and delete a booking.

**Authentication:** JWT Token (ADMIN role)

**Path Parameters:**

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| bookingId | string | Booking UUID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Booking cancelled successfully and deleted"
}
```

**Error Responses:**

| Status Code | Message                | Description              |
| ----------- | ---------------------- | ------------------------ |
| 401         | Unauthorized           | Missing or invalid token |
| 403         | Admin access required  | User is not admin        |
| 404         | Booking not found      | Booking doesn't exist    |
| 400         | Booking ID is required | Missing parameter        |
| 500         | Internal server error  | Server error             |

---

### Get Approved Bookings

**GET** `/admin/bookings/approved`

View all confirmed/approved bookings with vehicle and user details.

**Authentication:** JWT Token (ADMIN role)

**Success Response (200):**

```json
{
  "success": true,
  "totalApprovedBookings": 5,
  "data": [
    {
      "booking": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "startDate": "2025-01-20",
        "endDate": "2025-01-25",
        "bookedAt": "2025-01-15T10:30:00.000Z"
      },
      "user": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "username": "john_doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "vehicle": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Toyota Camry",
        "brand": "Toyota",
        "type": "SEDAN",
        "fuelType": "PETROL",
        "seats": 5,
        "pricePerDay": 50,
        "images": ["https://res.cloudinary.com/xxx/image1.jpg"]
      }
    }
  ]
}
```

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 403         | Admin access required   | User is not admin        |
| 500         | Internal server error   | Server error             |

---

## Admin - User Management

### Get All Users

**GET** `/admin/users?page=1&pageSize=10`

Retrieve all users with pagination.

**Authentication:** JWT Token (ADMIN role)

**Query Parameters:**

| Parameter | Type   | Default | Description    |
| --------- | ------ | ------- | -------------- |
| page      | number | 1       | Page number    |
| pageSize  | number | 10      | Items per page |

**Success Response (200):**

```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "email": "john@example.com",
        "role": "USER",
        "createdAt": "2025-01-10T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 10,
      "totalPages": 5
    }
  }
}
```

**Error Responses:**

| Status Code | Message                   | Description              |
| ----------- | ------------------------- | ------------------------ |
| 401         | Authentication required   | Missing or invalid token |
| 403         | Admin access required     | User is not admin        |
| 500         | Failed to fetch all users | Server error             |

---

### Edit User

**PUT** `/admin/user/:userId`

Update user details.

**Authentication:** JWT Token (ADMIN role)

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| userId    | string | User UUID   |

**Request Body:**

All fields are optional:

```json
{
  "username": "john_doe_updated",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

**Validation Rules:**

- `username`: 2-100 characters (optional)
- `email`: Valid email format (optional)
- `phone`: 10-20 characters (optional)

**Success Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully"
}
```

**Error Responses:**

| Status Code | Message               | Description                 |
| ----------- | --------------------- | --------------------------- |
| 401         | Unauthorized          | Missing or invalid token    |
| 403         | Admin access required | User is not admin           |
| 404         | User not found        | User doesn't exist          |
| 400         | Email already in use  | Email taken by another user |
| 400         | No fields to update   | No data provided            |
| 400         | User ID is required   | Missing parameter           |
| 500         | Internal server error | Server error                |

---

### Delete User

**DELETE** `/admin/user/:userId`

Delete a user from the system.

**Authentication:** JWT Token (ADMIN role)

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| userId    | string | User UUID   |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**

| Status Code | Message               | Description                              |
| ----------- | --------------------- | ---------------------------------------- |
| 401         | Unauthorized          | Missing or invalid token                 |
| 403         | Admin access required | User is not admin                        |
| 404         | User not found        | User doesn't exist or is not a USER role |
| 400         | User ID is required   | Missing parameter                        |
| 500         | Internal server error | Server error                             |

---

## Admin - Dashboard & Stats

### Get Admin Dashboard

**GET** `/admin/dashboard`

Retrieve dashboard statistics.

**Authentication:** JWT Token (ADMIN role)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "users": 120,
    "vehicles": 45,
    "pendingBookings": 8,
    "confirmedBookings": 32,
    "totalRevenue": 15600
  }
}
```

**Description:**

- `users`: Total count of users with USER role
- `vehicles`: Total count of vehicles
- `pendingBookings`: Bookings with PENDING status
- `confirmedBookings`: Bookings with CONFIRMED status
- `totalRevenue`: Total revenue from confirmed bookings (calculated as: sum of (days \* pricePerDay))

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 403         | Admin access required   | User is not admin        |
| 500         | Internal server error   | Server error             |

---

## User - Vehicle Operations

All user routes require authentication (USER role).

**Authentication Required:** JWT Token

---

### Get Available Vehicles (User)

**GET** `/user/vehicles/available`

Get all available vehicles.

**Authentication:** JWT Token

**Success Response (200):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Toyota Camry",
      "brand": "Toyota",
      "type": "SEDAN",
      "fuelType": "PETROL",
      "seats": 5,
      "pricePerDay": 50,
      "status": "AVAILABLE",
      "imageUrl": [
        "https://res.cloudinary.com/xxx/image1.jpg",
        "https://res.cloudinary.com/xxx/image2.jpg"
      ],
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 500         | Internal server error   | Server error             |

---

### Get Vehicle Details

**GET** `/user/vehicles/:vehicleId`

Get specific vehicle details by ID.

**Authentication:** JWT Token

**Path Parameters:**

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| vehicleId | string | Vehicle UUID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "name": "Toyota Camry",
    "brand": "Toyota",
    "type": "SEDAN",
    "fuelType": "PETROL",
    "seats": 5,
    "pricePerDay": 50,
    "status": "AVAILABLE",
    "images": [
      "https://res.cloudinary.com/xxx/image1.jpg",
      "https://res.cloudinary.com/xxx/image2.jpg"
    ],
    "createdAt": "2025-01-10T08:00:00.000Z"
  }
}
```

**Error Responses:**

| Status Code | Message                 | Description              |
| ----------- | ----------------------- | ------------------------ |
| 401         | Authentication required | Missing or invalid token |
| 404         | Vehicle not found       | Vehicle doesn't exist    |
| 400         | Vehicle ID is required  | Missing parameter        |
| 400         | Validation error        | Invalid UUID format      |
| 500         | Internal server error   | Server error             |

---

## User - Booking Operations

### Book Vehicle

**POST** `/user/bookVehicle`

Book a vehicle for specific dates.

**Authentication:** JWT Token

**Request Body:**

```json
{
  "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
  "startDate": "2025-01-20",
  "endDate": "2025-01-25"
}
```

**Validation Rules:**

- `vehicleId`: Valid UUID, required
- `startDate`: ISO date format, required, cannot be in the past
- `endDate`: ISO date format, required, must be after startDate

**Success Response (201):**

```json
{
  "success": true,
  "message": "Vehicle booked 'on pending' status",
  "data": {
    "bookingId": "660e8400-e29b-41d4-a716-446655440000",
    "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
    "startDate": "2025-01-20",
    "endDate": "2025-01-25",
    "status": "PENDING",
    "totalPrice": 250
  }
}
```

**Error Responses:**

| Status Code | Message                                           | Description                         |
| ----------- | ------------------------------------------------- | ----------------------------------- |
| 401         | Unauthorized                                      | Missing or invalid token            |
| 404         | Vehicle not found                                 | Vehicle doesn't exist               |
| 400         | Start date cannot be in the past                  | Invalid start date                  |
| 400         | End date must be after start date                 | Invalid date range                  |
| 400         | Vehicle is not available for the selected dates   | Dates overlap with existing booking |
| 400         | Vehicle ID, start date, and end date are required | Missing fields                      |
| 500         | Internal server error                             | Server error                        |

**Note:** If vehicle is already booked, the response will include `availableFrom` date:

```json
{
  "message": "Vehicle is not available for the selected dates",
  "availableFrom": "2025-01-26"
}
```

---

### Get My Bookings

**GET** `/user/bookings/me`

View all bookings for the authenticated user.

**Authentication:** JWT Token

**Success Response (200):**

```json
{
  "success": true,
  "totalBookings": 3,
  "data": [
    {
      "booking": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "status": "CONFIRMED",
        "startDate": "2025-01-20",
        "endDate": "2025-01-25",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "totalPrice": 250
      },
      "vehicle": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Toyota Camry",
        "brand": "Toyota",
        "type": "SEDAN",
        "fuelType": "PETROL",
        "seats": 5,
        "pricePerDay": 50,
        "images": ["https://res.cloudinary.com/xxx/image1.jpg"]
      }
    }
  ]
}
```

**Booking Statuses:**

- `PENDING`: Awaiting admin approval
- `CONFIRMED`: Approved by admin
- `CANCELLED`: Cancelled booking
- `COMPLETED`: Rental period completed

**Error Responses:**

| Status Code | Message               | Description              |
| ----------- | --------------------- | ------------------------ |
| 401         | Unauthorized          | Missing or invalid token |
| 500         | Internal server error | Server error             |

---

## Error Responses

### Standard Error Response Format

All errors follow this format:

```json
{
  "message": "Error description",
  "success": false
}
```

### Common HTTP Status Codes

| Status Code | Meaning               | Description                                       |
| ----------- | --------------------- | ------------------------------------------------- |
| 200         | OK                    | Request succeeded                                 |
| 201         | Created               | Resource created successfully                     |
| 400         | Bad Request           | Invalid request data or validation error          |
| 401         | Unauthorized          | Missing or invalid authentication token           |
| 403         | Forbidden             | Insufficient permissions (e.g., not admin)        |
| 404         | Not Found             | Resource not found                                |
| 409         | Conflict              | Resource already exists                           |
| 429         | Too Many Requests     | Rate limit exceeded (100 requests per 15 minutes) |
| 500         | Internal Server Error | Server error                                      |

### Validation Error Response

When validation fails, you'll receive detailed error messages:

```json
{
  "message": "Validation error",
  "errors": {
    "email": "Email must be valid email address",
    "password": "Password must be at least 8 characters"
  }
}
```

### Token Error Responses

| Status Code | Message                 | Description                         |
| ----------- | ----------------------- | ----------------------------------- |
| 401         | Authentication required | No token provided                   |
| 401         | Token has expired       | JWT token expired (7 days validity) |
| 401         | Invalid token           | Malformed or invalid JWT            |
| 401         | Authentication failed   | General auth failure                |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window:** 15 minutes
- **Max Requests:** 100 requests per window
- **Applies to:** All `/api/*` routes

When rate limit is exceeded:

```json
{
  "message": "Too many requests, please try again later."
}
```

---

## Security Features

1. **Helmet.js**: Secure HTTP headers
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **HTTP-Only Cookies**: Prevents XSS attacks on web clients
4. **CORS Protection**: SameSite cookie policy (strict)
5. **JWT Expiry**: Tokens expire after 7 days
6. **Password Hashing**: bcrypt with salt rounds
7. **Role-Based Access Control**: Admin and User roles

---

## Notes for Frontend Developers

### Authentication Flow

1. **Register** → Receive `userId`
2. **Login** → Receive `token` + `user` object
3. **Include Token** in subsequent requests:
   - Header: `Authorization: Bearer <token>`
   - OR Cookie (automatically sent by browser)

### Image Uploads

When uploading vehicle images:

- Use `multipart/form-data` content type
- Field name: `images` (array)
- Maximum: 5 images per vehicle
- Supported formats: Common image formats (JPG, PNG, etc.)
- Images are uploaded to Cloudinary

### Date Format

All dates use **ISO 8601** format:

- Format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2025-01-20` or `2025-01-20T10:30:00.000Z`

### Pagination

Endpoints with pagination support:

- `/admin/vehicles` - Query: `?page=1&limit=10`
- `/admin/users` - Query: `?page=1&pageSize=10`

Default values:

- `page`: 1
- `limit/pageSize`: 10

### Price Calculation

Total booking price is calculated as:

```
totalPrice = (endDate - startDate) * pricePerDay
```

Duration is rounded up to the nearest full day.

---

## Example Request Flows

### Complete Booking Flow (User)

1. **Login**

   ```
   POST /api/v1/auth/login
   ```

2. **Browse Available Vehicles**

   ```
   GET /api/v1/user/vehicles/available
   Authorization: Bearer <token>
   ```

3. **View Vehicle Details**

   ```
   GET /api/v1/user/vehicles/{vehicleId}
   Authorization: Bearer <token>
   ```

4. **Book Vehicle**

   ```
   POST /api/v1/user/bookVehicle
   Authorization: Bearer <token>
   Body: { vehicleId, startDate, endDate }
   ```

5. **Check Booking Status**
   ```
   GET /api/v1/user/bookings/me
   Authorization: Bearer <token>
   ```

### Complete Admin Flow

1. **Login as Admin**

   ```
   POST /api/v1/auth/login
   ```

2. **View Dashboard Stats**

   ```
   GET /api/v1/admin/dashboard
   Authorization: Bearer <token>
   ```

3. **View Pending Bookings**

   ```
   GET /api/v1/admin/pending-booked-vehicles
   Authorization: Bearer <token>
   ```

4. **Approve Booking**
   ```
   PATCH /api/v1/admin/bookings/{bookingId}/approve
   Authorization: Bearer <token>
   ```

---

## Contact & Support

For any issues or questions regarding the API, please contact the backend development team.

**Last Updated:** December 18, 2025
