const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const tpoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  phone: String,
  designation: String,
  dateOfJoining: Date,
  responsibilities: [String],
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  managedExams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  }],
  managedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password before saving
tpoSchema.pre('save', async function(next) {
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
tpoSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: 'tpo',
      email: this.email 
    }, 
    process.env.JWT_SECRET || 'your-jwt-secret',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Match password
tpoSchema.methods.matchPassword = async function(enteredPassword) {
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

module.exports = mongoose.model('TPO', tpoSchema);