# Car Rental Backend - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Routes (`/api/auth`)

### 1. Register User

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "1234567890"
}
```

**Response (201 - Success):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

**Response (400 - Validation Error):**

```json
{
  "message": "Validation error message"
}
```

---

### 2. Login

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (200 - Success):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

**Response (401 - Invalid Credentials):**

```json
{
  "message": "Invalid email or password"
}
```

---

## Admin Routes (`/api/admin`)

_All admin routes require authentication and admin role_

### 1. Get Pending Bookings

**GET** `/api/admin/pending-booked-vehicles`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Response (200 - Success):**

```json
{
  "success": true,
  "count": 2,
  "totalBookings": 5,
  "data": [
    {
      "car": {
        "id": "car-uuid",
        "name": "Toyota Camry",
        "brand": "Toyota",
        "type": "Sedan",
        "fuelType": "Petrol",
        "seats": 5,
        "pricePerDay": 50,
        "images": ["image_url_1", "image_url_2"]
      },
      "bookings": [
        {
          "booking": {
            "id": "booking-uuid",
            "status": "PENDING",
            "startDate": "2025-12-20",
            "endDate": "2025-12-25",
            "createdAt": "2025-12-16T10:30:00.000Z"
          },
          "user": {
            "id": "user-uuid",
            "username": "john_doe",
            "email": "john@example.com",
            "phone": "1234567890"
          }
        }
      ]
    }
  ]
}
```

---

### 2. Add Car

**POST** `/api/admin/addCar`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

```
name: "Toyota Camry"
brand: "Toyota"
type: "Sedan"
fuelType: "Petrol"
seats: 5
pricePerDay: 50
images: [File, File, File] // Max 5 images
```

**Response (201 - Success):**

```json
{
  "message": "Car added successfully",
  "car": {
    "name": "Toyota Camry",
    "brand": "Toyota",
    "type": "Sedan",
    "fuelType": "Petrol",
    "seats": 5,
    "pricePerDay": 50,
    "imageUrls": ["cloudinary_url_1", "cloudinary_url_2"]
  }
}
```

**Response (400 - No Images):**

```json
{
  "message": "At least one image is required"
}
```

---

### 3. Get All Users (with Pagination)

**POST** `/api/admin/users`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**

```
page: 1 (default)
pageSize: 10 (default)
```

**Response (200 - Success):**

```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "email": "john@example.com",
        "role": "USER",
        "createdAt": "2025-12-01T10:30:00.000Z"
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

---

### 4. Delete User

**DELETE** `/api/admin/user/:userId`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**URL Parameters:**

```
userId: user-uuid
```

**Response (200 - Success):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response (404 - Not Found):**

```json
{
  "message": "User not found"
}
```

---

### 5. Delete Car

**DELETE** `/api/admin/car/:carId`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**URL Parameters:**

```
carId: car-uuid
```

**Response (200 - Success):**

```json
{
  "success": true,
  "message": "Car deleted successfully"
}
```

**Response (404 - Not Found):**

```json
{
  "message": "Car not found"
}
```

---

### 6. Edit User

**PUT** `/api/admin/user/:userId`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**URL Parameters:**

```
userId: user-uuid
```

**Request Body:**

```json
{
  "username": "john_updated",
  "email": "john_new@example.com",
  "phone": "9876543210"
}
```

_Note: All fields are optional. Only send the fields you want to update._

**Response (200 - Success):**

```json
{
  "success": true,
  "message": "User updated successfully"
}
```

**Response (400 - No Fields):**

```json
{
  "message": "No fields to update"
}
```

**Response (400 - Email Taken):**

```json
{
  "message": "Email already in use"
}
```

---

### 7. Edit Car

**PUT** `/api/admin/car/:carId`

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data (if uploading images)
```

**URL Parameters:**

```
carId: car-uuid
```

**Request Body (Form Data):**

```
name: "Toyota Camry Updated" (optional)
brand: "Toyota" (optional)
type: "Sedan" (optional)
fuelType: "Diesel" (optional)
seats: 5 (optional)
pricePerDay: 60 (optional)
images: [File, File] (optional, max 5 images)
```

_Note: All fields are optional. Only send the fields you want to update._

**Response (200 - Success):**

```json
{
  "success": true,
  "message": "Car updated successfully"
}
```

**Response (400 - No Fields):**

```json
{
  "message": "No fields to update"
}
```

**Response (404 - Not Found):**

```json
{
  "message": "Car not found"
}
```

---

## User Routes (`/api/user`)

_All user routes require authentication_

### 1. Book Car

**POST** `/api/user/bookCar`

**Headers:**

```
Authorization: Bearer <user_jwt_token>
```

**Request Body:**

```json
{
  "carId": "car-uuid",
  "startDate": "2025-12-20",
  "endDate": "2025-12-25"
}
```

**Response (201 - Success):**

```json
{
  "success": true,
  "message": "Car booked successfully",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "userId": "user-uuid",
      "carId": "car-uuid",
      "startDate": "2025-12-20",
      "endDate": "2025-12-25",
      "status": "PENDING"
    }
  }
}
```

**Response (400 - Validation Error):**

```json
{
  "message": "Car ID is required"
}
```

**Response (404 - Car Not Found):**

```json
{
  "message": "Car not found"
}
```

---

## Common Error Responses

### 401 - Unauthorized

```json
{
  "message": "Unauthorized"
}
```

### 403 - Forbidden (Not Admin)

```json
{
  "message": "Access denied. Admin only."
}
```

### 500 - Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## Notes

1. **Date Format**: All dates should be in `YYYY-MM-DD` format
2. **Image Upload**: Maximum 5 images per car, supported formats: JPG, PNG, JPEG
3. **Pagination**: Default page size is 10, can be adjusted via query parameters
4. **Token Expiry**: JWT tokens expire after 24 hours (or as configured)
5. **Role Types**: `USER` and `ADMIN`
6. **Booking Status**: `PENDING`, `APPROVED`, `REJECTED`

---

## Frontend Integration Examples

### Register User Example (Axios)

```javascript
const response = await axios.post("http://localhost:3000/api/auth/register", {
  username: "john_doe",
  email: "john@example.com",
  password: "Password123!",
  phone: "1234567890",
});
```

### Add Car Example (Axios with FormData)

```javascript
const formData = new FormData();
formData.append("name", "Toyota Camry");
formData.append("brand", "Toyota");
formData.append("type", "Sedan");
formData.append("fuelType", "Petrol");
formData.append("seats", 5);
formData.append("pricePerDay", 50);
formData.append("images", file1);
formData.append("images", file2);

const response = await axios.post(
  "http://localhost:3000/api/admin/addCar",
  formData,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "multipart/form-data",
    },
  }
);
```

### Book Car Example (Axios)

```javascript
const response = await axios.post(
  "http://localhost:3000/api/user/bookCar",
  {
    carId: "car-uuid",
    startDate: "2025-12-20",
    endDate: "2025-12-25",
  },
  {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }
);
```
