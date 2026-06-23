import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { Permission, RolePermissions } from '../constants/roles';

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const userRole = req.user.role;
    const permissions = RolePermissions[userRole] || [];

    if (!permissions.includes(permission)) {
      return next(new AppError('Access denied: Insufficient permissions.', 403));
    }

    next();
  };
};
