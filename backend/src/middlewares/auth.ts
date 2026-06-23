import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, catchAsync } from '../utils/errors';
import { User } from '../models/User';
import { UserRole } from '../constants/roles';

interface DecodedToken {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export const authenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  const secret = process.env.JWT_ACCESS_SECRET || 'smg_secret_access_key_123!';
  const decoded = jwt.verify(token, secret) as DecodedToken;

  const currentUser = await User.findOne({ _id: decoded.id, isDeleted: false });
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Attach user to request object
  req.user = {
    id: currentUser._id.toString(),
    userId: currentUser.userId,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role as UserRole,
  };

  next();
});
