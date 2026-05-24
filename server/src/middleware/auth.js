import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify JWT Access Token
export const authMiddleware = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Not authorized to access this route. Token missing.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to req.user (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'User belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error] JWT verification failed:', error.message);
    
    // Distinguish between expired and invalid
    const message = error.name === 'TokenExpiredError' 
      ? 'Access token expired. Please refresh your token.' 
      : 'Not authorized to access this route. Token invalid.';

    return res.status(401).json({
      success: false,
      data: null,
      message
    });
  }
};

// Role authorization check (RBAC)
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'User authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

// Generate JWT Access Token (expires in 15m)
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate JWT Refresh Token (expires in 7d)
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to set httpOnly cookie for Refresh Token
export const sendRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'strict',
    path: '/'
  };
  res.cookie('refreshToken', token, cookieOptions);
};
