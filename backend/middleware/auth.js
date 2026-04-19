const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const TPO = require('../models/TPO');
const Student = require('../models/Student');
const ErrorLog = require('../models/ErrorLog');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log(`Token received: ${token.substring(0, 10)}...`);
    }

    if (!token) {
      console.log('No authentication token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Set consistent JWT secret
      const secret = process.env.JWT_SECRET || 'your-jwt-secret';
      
      // Verify token
      const decoded = jwt.verify(token, secret);
      
      console.log('Token verification successful:', decoded.role, decoded.id);

      // Find user based on role
      let user;
      try {
        switch (decoded.role) {
          case 'admin':
            user = await Admin.findById(decoded.id).select('-password');
            break;
          case 'tpo':
            user = await TPO.findById(decoded.id).select('-password');
            break;
          case 'student':
            user = await Student.findById(decoded.id).select('-password');
            if (!user) {
              // Additional check using USN if ID-based search fails
              if (decoded.usn) {
                user = await Student.findOne({ usn: decoded.usn }).select('-password');
              }
            }
            break;
          default:
            return res.status(401).json({
              success: false,
              message: 'Invalid user role'
            });
        }
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError);
        if (dbError.name === 'MongooseError' || dbError.name === 'MongoError') {
          return res.status(503).json({
            success: false,
            message: 'Database connection error. Please try again later.'
          });
        }
        throw dbError;
      }

      if (!user) {
        console.error('User not found with ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // For admin users, check if account is active
      if (decoded.role === 'admin' && !user.active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Add user info to request
      req.user = user;
      req.user.role = decoded.role;
      next();

    } catch (error) {
      console.error('Token validation error:', error.name, error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    try {
      await ErrorLog.create({
        errorMessage: error.message,
        errorStack: error.stack,
        path: req.originalUrl
      });
    } catch (logError) {
      console.error('Error while logging error:', logError);
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      console.error('No user found in request object');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Check if role exists
    if (!req.user.role) {
      console.error('User has no role:', req.user);
      return res.status(403).json({
        success: false,
        message: 'User role not defined'
      });
    }
      // Check if role is authorized
    if (!roles.some(role => role.toLowerCase() === req.user.role.toLowerCase())) {
      console.error(`User role ${req.user.role} not authorized for this route. Allowed roles:`, roles);
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    
    console.log(`User with role ${req.user.role} authorized successfully`);
    next();
  };
};