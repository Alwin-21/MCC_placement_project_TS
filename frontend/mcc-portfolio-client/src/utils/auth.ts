import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export enum UserRole {
  Student = 1,
  Admin = 2,
  Moderator = 3,
}

const JWT_SECRET = process.env.JWT_KEY || "THIS_IS_SUPER_SECRET_KEY_FOR_MCC_PORTFOLIO_PLATFORM_2026";
const JWT_ISSUER = process.env.JWT_ISSUER || "MCCPortfolioAPI";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "MCCPortfolioClient";

export interface TokenPayload {
  nameid: string;
  unique_name: string;
  email: string;
  role: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
  adminPermissions?: string;
  iss?: string;
  aud?: string;
}

export function generateToken(user: { Id: number; FullName: string; Email: string; Role: number; adminPermissions?: string }): string {
  const roleName = user.Role === UserRole.Admin ? "Admin" : user.Role === UserRole.Moderator ? "Moderator" : "Student";
  const userIdStr = user.Id.toString();

  const payload: Partial<TokenPayload> & { adminPermissions?: string } = {
    nameid: userIdStr,
    unique_name: user.FullName,
    email: user.Email,
    role: roleName,
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": userIdStr,
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": user.FullName,
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": user.Email,
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": roleName,
  };

  if (user.adminPermissions !== undefined) {
    payload.adminPermissions = user.adminPermissions;
  }

  return jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return decoded as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function getUserFromRequest(req: Request): TokenPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function hasModulePermission(
  payload: TokenPayload,
  moduleId: string,
  level: "read" | "write"
): boolean {
  if (payload.role === "Admin") return true; // Super Admin always has full access
  if (payload.role !== "Moderator") return false;
  if (!payload.adminPermissions) return false;
  try {
    const perms = JSON.parse(payload.adminPermissions);
    if (Array.isArray(perms)) {
      // Legacy arrays represent write access implicitly
      return perms.includes(moduleId);
    }
    if (typeof perms === "object") {
      const userLvl = perms[moduleId];
      if (level === "write") {
        return userLvl === "write";
      } else {
        return userLvl === "read" || userLvl === "write";
      }
    }
  } catch {
    return false;
  }
  return false;
}
