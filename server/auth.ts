import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { getPrisma } from "./db.js";
import { UserRole } from "../shared/types.js";

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || "telegram_access_secret_369";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "telegram_refresh_secret_369";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ WARNING: JWT_SECRET env var is missing. Using static fallback secret.");
}

// Extend Express Request type to include user context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

/**
 * Hashes a password securely using bcryptjs with a high cost factor (10)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against secure stored hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates an access token (expires in 15 minutes)
 */
export function generateAccessToken(userId: string, username: string, role: string): string {
  return jwt.sign(
    { sub: userId, username, role },
    JWT_ACCESS_SECRET,
    { algorithm: "HS256", expiresIn: "15m" }
  );
}

/**
 * Generates a refresh token (expires in 7 days)
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    JWT_REFRESH_SECRET,
    { algorithm: "HS256", expiresIn: "7d" }
  );
}

/**
 * Verifies a JWT access token and extracts the payload
 */
export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    return null;
  }
}

/**
 * Verifies a JWT refresh token and extracts the payload
 */
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    return null;
  }
}

/**
 * Express Middleware to protect endpoints and inject req.user
 */
export async function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized. Missing token." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: "Unauthorized. Expired or invalid token." });
    return;
  }

  // Check if user is suspended in the DB
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, role: true, is_suspended: true },
  });

  if (!user) {
    res.status(401).json({ error: "Unauthorized. User no longer exists." });
    return;
  }

  if (user.is_suspended) {
    res.status(403).json({ error: "Forbidden. This account has been suspended by an administrator." });
    return;
  }

  // Check maintenance mode
  const MAINTENANCE_FILE_PATH = path.join(process.cwd(), "maintenance.json");
  let maintenanceActive = false;
  try {
    if (fs.existsSync(MAINTENANCE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(MAINTENANCE_FILE_PATH, "utf-8"));
      if (data.active) {
        maintenanceActive = true;
      }
    }
  } catch (err) {
    // Ignore
  }

  if (maintenanceActive && user.role !== "admin") {
    res.status(503).json({ error: "System under maintenance. Access restricted to administrators." });
    return;
  }

  req.user = {
    id: user.id,
    username: user.username,
    role: user.role as UserRole,
  };

  next();
}
