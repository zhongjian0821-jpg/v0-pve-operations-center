import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ethers } from 'ethers';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default-admin-secret';
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || 'default-user-secret';

export interface AdminTokenPayload {
  adminId: number;
  username: string;
  role: string;
}

export interface UserTokenPayload {
  walletAddress: string;
}

export function generateAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '7d' });
}

export function generateUserToken(walletAddress: string): string {
  return jwt.sign({ walletAddress }, USER_JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function verifyUserToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, USER_JWT_SECRET) as UserTokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}
