import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  sendRefreshTokenCookie
} from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user' // Defaults to 'user'
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  // Send refresh token as HTTP-only cookie
  sendRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken
    },
    message: 'User registered successfully'
  });
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Please provide email and password'
    });
  }

  // Find user and include password and refresh token
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid email or password'
    });
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid email or password'
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  // Send refresh token as HTTP-only cookie
  sendRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken
    },
    message: 'User logged in successfully'
  });
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  // Parse cookies manually from headers since cookie-parser is not installed
  let refreshToken = null;
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const cookie of rawCookies) {
      const [key, val] = cookie.trim().split('=');
      if (key === 'refreshToken') {
        refreshToken = val;
        break;
      }
    }
  }

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Refresh token missing. Please log in again.'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user by ID and check if token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid refresh token. Please log in again.'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    // Keep refresh token rotating (generate new one optionally, or reuse)
    // We can reuse the current refresh token or rotate it. 
    // Let's keep reusing the same one or generate a new one. Rotation is safer:
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();
    sendRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken
      },
      message: 'Access token refreshed successfully'
    });
  } catch (error) {
    console.error('[Refresh Token Error]:', error.message);
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid or expired refresh token. Please log in again.'
    });
  }
};

// @desc    Logout User / Clear Cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  let refreshToken = null;
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const cookie of rawCookies) {
      const [key, val] = cookie.trim().split('=');
      if (key === 'refreshToken') {
        refreshToken = val;
        break;
      }
    }
  }

  if (refreshToken) {
    // Remove token from database
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    } catch (err) {
      // Ignore if token is already expired/invalid
    }
  }

  // Clear cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  res.status(200).json({
    success: true,
    data: null,
    message: 'User logged out successfully'
  });
};
