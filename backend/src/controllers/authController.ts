import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError, catchAsync } from '../utils/errors';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { redisClient } from '../config/db';
import { logger } from '../config/logger';
import { UserRole } from '../constants/roles';

// Simple OTP helper
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return next(new AppError('Please provide User ID and password', 400));
  }

  const user = await User.findOne({ userId, isDeleted: false }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid User ID or password', 401));
  }

  // Generate OTP for 2FA simulation (every login requires OTP for security)
  const otp = generateOTP();
  const otpExpiry = parseInt(process.env.OTP_EXPIRY || '300', 10);

  // Store OTP in cache
  await redisClient.setex(`otp:${userId}`, otpExpiry, otp);

  // Log OTP in console so the developer/user can see it
  logger.info(`[2FA Simulation] OTP for User: ${userId} (${user.name}) is: ${otp}`);

  // Create temporary token
  const tempToken = jwt.sign(
    { userId: user.userId, isPendingOtp: true },
    process.env.JWT_ACCESS_SECRET || 'smg_secret_access_key_123!',
    { expiresIn: '5m' }
  );

  res.status(200).json({
    success: true,
    message: 'OTP sent to registered mobile/email. Please verify.',
    data: {
      tempToken,
      userId,
      // For development ease, we also send the OTP in response under development mode
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    },
    pagination: null,
    errors: null,
  });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { tempToken, otp } = req.body;

  if (!tempToken || !otp) {
    return next(new AppError('Please provide temporary token and OTP', 400));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET || 'smg_secret_access_key_123!');
  } catch (err) {
    return next(new AppError('Invalid or expired temporary token', 401));
  }

  if (!decoded.isPendingOtp) {
    return next(new AppError('Invalid token state', 400));
  }

  const cachedOtp = await redisClient.get(`otp:${decoded.userId}`);
  if (!cachedOtp) {
    return next(new AppError('OTP expired. Please login again.', 400));
  }

  if (cachedOtp !== otp) {
    return next(new AppError('Invalid OTP', 400));
  }

  // Remove OTP from cache
  await redisClient.del(`otp:${decoded.userId}`);

  const user = await User.findOne({ userId: decoded.userId, isDeleted: false });
  if (!user) {
    return next(new AppError('User no longer exists', 404));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const payload = {
    id: user._id.toString(),
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user._id.toString());

  // Store refresh token in HTTP-only cookie (optional, we return it in response as well)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    },
    pagination: null,
    errors: null,
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'smg_secret_refresh_key_456!');
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.isDeleted) {
    return next(new AppError('User not found or suspended', 401));
  }

  const payload = {
    id: user._id.toString(),
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };

  const accessToken = generateAccessToken(payload);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: {
      accessToken,
    },
    pagination: null,
    errors: null,
  });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide an email address', 400));
  }

  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    // Return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If the email matches a registered account, a reset link will be sent.',
      data: null,
      pagination: null,
      errors: null,
    });
    return;
  }

  const resetToken = generateOTP(); // 6 digit code for password reset simulation
  await redisClient.setex(`reset:${email}`, 600, resetToken); // 10 minutes expiry

  logger.info(`[Password Reset Simulation] Reset token for ${email} is: ${resetToken}`);

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to email.',
    data: {
      email,
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    },
    pagination: null,
    errors: null,
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return next(new AppError('Email, reset OTP, and new password are required', 400));
  }

  const cachedToken = await redisClient.get(`reset:${email}`);
  if (!cachedToken || cachedToken !== resetToken) {
    return next(new AppError('Invalid or expired reset OTP', 400));
  }

  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.password = newPassword;
  await user.save();

  await redisClient.del(`reset:${email}`);

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login.',
    data: null,
    pagination: null,
    errors: null,
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    return next(new AppError('User profile not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved',
    data: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
    pagination: null,
    errors: null,
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phoneNumber } = req.body;

  const user = await User.findById(req.user?.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (phoneNumber) user.phoneNumber = phoneNumber;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
  });
});

export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current password and new password', 400));
  }

  const user = await User.findById(req.user?.id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    return next(new AppError('Invalid current password', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const users = await User.find({ isDeleted: false }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
  });
});

export const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, name, email, role, phoneNumber, password } = req.body;

  if (!userId || !name || !email || !role || !phoneNumber || !password) {
    return next(new AppError('Please provide all user details', 400));
  }

  const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
  if (existingUser) {
    return next(new AppError('User ID or Email already exists', 400));
  }

  const user = await User.create({
    userId,
    name,
    email,
    role,
    phoneNumber,
    password,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
  });
});

export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, email, role, phoneNumber, password } = req.body;

  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    return next(new AppError('User not found', 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (password) user.password = password;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
    },
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user || user.isDeleted) {
    return next(new AppError('User not found', 404));
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'User suspended successfully',
  });
});


