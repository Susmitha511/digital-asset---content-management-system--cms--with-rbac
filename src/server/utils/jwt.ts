import jwt from 'jsonwebtoken';
import { User } from '../../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cms_cybersec_jwt_super_secure_key_change_in_production_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(user: { _id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
