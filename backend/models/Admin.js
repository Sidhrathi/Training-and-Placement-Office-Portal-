const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide admin name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email address'],
    unique: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin']
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide valid phone number']
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Sign JWT and return
adminSchema.methods.getSignedJwtToken = function() {
  try {
    return jwt.sign(
      {
        id: this._id,
        role: 'admin',
        email: this.email
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      {
        expiresIn: process.env.JWT_EXPIRE || '30d'
      }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Authentication failed');
  }
};

// Match password
adminSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    if (!this.password) {
      return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Password match error:', error);
    throw error;
  }
};

module.exports = mongoose.model('Admin', adminSchema);