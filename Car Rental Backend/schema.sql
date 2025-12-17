    -- 1. Database Setup
    CREATE DATABASE IF NOT EXISTS car_rental;
    USE car_rental;

    -- 2. Users Table
    CREATE TABLE users (
        id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        role ENUM('USER', 'ADMIN') DEFAULT 'USER',
        licenseUrl VARCHAR(255) DEFAULT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- 3. Vehicles Table
    CREATE TABLE vehicles (
        id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        type ENUM('SEDAN', 'SUV', 'HATCHBACK', 'VAN', 'TRUCK') NOT NULL,
        fuelType ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID') NOT NULL,
        seats INT NOT NULL,
        pricePerDay FLOAT NOT NULL,
        status ENUM('AVAILABLE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
        imageUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- 4. Bookings Table
    CREATE TABLE bookings (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userId CHAR(36) NOT NULL,
        vehicleId CHAR(36) NOT NULL,
        startDate DATETIME NOT NULL,
        endDate DATETIME NOT NULL,
        status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_bookings_user FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE CASCADE
    );