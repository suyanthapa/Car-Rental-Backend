import mysql from "mysql2/promise";
import { RowDataPacket, ResultSetHeader } from "mysql2";

let pool: mysql.Pool | null = null;

/**
 * Initialize MySQL connection pool
 */
export const connectDB = async (): Promise<mysql.Pool> => {
  try {
    if (pool) {
      console.log("✅ Using existing MySQL connection pool");
      return pool;
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "car_rental",
      port: parseInt(process.env.DB_PORT || "3306"),
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: "+00:00",
      charset: "utf8mb4",
    });

    const connection = await pool.getConnection();
    console.log("✅ MySQL Connection Pool Created Successfully");
    console.log(`📊 Max Connections: ${process.env.DB_CONNECTION_LIMIT || 10}`);
    connection.release();

    return pool;
  } catch (error) {
    console.error("❌ MySQL Connection Pool Error:", error);
    throw error;
  }
};

/**
 * Get the database connection pool
 */
export const getDB = (): mysql.Pool => {
  if (!pool) {
    throw new Error("Database pool not initialized. Call connectDB() first.");
  }
  return pool;
};

// ✅ CLEAN QUERY HELPER - Use this everywhere!
/**
 * Execute a database query
 * @param sql - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export const query = async <T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params?: any[]
) => {
  if (!pool) {
    throw new Error("Database pool not initialized. Call connectDB() first.");
  }
  return pool.query<T>(sql, params);
};

/**
 * Close the database connection pool
 */
export const closeDB = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log("✅ MySQL Connection Pool Closed");
    } catch (error) {
      console.error("❌ Error closing MySQL pool:", error);
      throw error;
    }
  }
};

/**
 * Check database connection health
 */
export const checkDBHealth = async (): Promise<boolean> => {
  try {
    if (!pool) {
      return false;
    }
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database health check failed:", error);
    return false;
  }
};
