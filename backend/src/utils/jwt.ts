import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../constants/roles';

interface TokenPayload {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (user: TokenPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'smg_secret_access_key_123!';
  const expiry = (process.env.JWT_ACCESS_EXPIRY || '15m') as any;
  const options: SignOptions = {
    expiresIn: expiry,
  };
  return jwt.sign(
    {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    secret,
    options
  );
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'smg_secret_refresh_key_456!';
  const expiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as any;
  const options: SignOptions = {
    expiresIn: expiry,
  };
  return jwt.sign({ userId }, secret, options);
};
