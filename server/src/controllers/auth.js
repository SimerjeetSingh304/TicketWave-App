import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth.js';

// Cookie options for Refresh Token
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
};

/**
 * Register a new user or organizer
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  // Create and save user
  const user = new User({
    name,
    email,
    password,
    role: role || 'user'
  });

  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Set httpOnly cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Set cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

/**
 * Generate a new access token using a valid refresh token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Issue a new access token
    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

/**
 * Log out a user by clearing their cookie and DB token
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    } catch (err) {
      // Ignore token verification errors during logout, just proceed to clear cookie
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
