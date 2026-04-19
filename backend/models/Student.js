const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add your name']
  },
  usn: {
    type: String,
    required: [true, 'Please add your USN'],
    unique: true,
    uppercase: true
  },
  email: {
    type: String,
    required: [true, 'Please add your email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add your phone number'],
    match: [/^[0-9]{10}$/, 'Please add a valid phone number']
  },
  branch: {
    type: String,
    required: [true, 'Please add your branch']
  },
  department: {
    type: String,
    required: [true, 'Please add your department']
  },
  semester: {
    type: Number,
    required: [true, 'Please add current semester'],
    min: 1,
    max: 8
  },
  city: {
    type: String,
    required: [true, 'Please add your city']
  },
  state: {
    type: String,
    required: [true, 'Please add your state']
  },
  tenthPercentage: {
    type: Number,
    required: [true, 'Please add 10th percentage'],
    min: 0,
    max: 100
  },
  twelfthPercentage: {
    type: Number,
    required: [true, 'Please add 12th percentage'],
    min: 0,
    max: 100
  },
  degreePercentage: {
    type: Number,
    required: [true, 'Please add degree percentage'],
    min: 0,
    max: 100
  },
  mastersPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  cgpa: {
    type: Number,
    required: [true, 'Please add CGPA'],
    min: 0,
    max: 10
  },
  resume: {
    originalName: String,
    fileName: String,
    mimeType: String,
    path: String,
    uploadDate: Date
  },
  backlogs: {
    type: Number,
    default: 0
  },
  placementStatus: {
    type: String,
    enum: ['Not Placed', 'Placed', 'Offered', 'Declined'],
    default: 'Not Placed'
  },
  appliedJobs: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Rejected', 'Selected'],
      default: 'Applied'
    },
    // Additional job details cached in the application for easier access
    companyName: String,
    jobRole: String,
    location: String
  }],
  examResults: [{
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    score: Number,
    takenDate: Date,
    status: {
      type: String,
      enum: ['Passed', 'Failed', 'Pending'],
      default: 'Pending'
    }
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
studentSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate OTP for email verification
studentSchema.methods.generateEmailVerificationOTP = async function() {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP
  const salt = await bcrypt.genSalt(10);
  this.emailVerificationOTP = await bcrypt.hash(otp, salt);
  
  // Set expiry time (10 minutes)
  this.otpExpires = Date.now() + 10 * 60 * 1000;
  
  await this.save();
  
  return otp;
};

// Method to verify OTP
studentSchema.methods.verifyEmailOTP = async function(otp) {
  // If OTP has expired
  if (this.otpExpires < Date.now()) {
    return false;
  }
  
  // Verify OTP
  const isValid = await bcrypt.compare(otp, this.emailVerificationOTP);
  
  if (isValid) {
    // Mark email as verified
    this.isEmailVerified = true;
    this.emailVerificationOTP = undefined;
    this.otpExpires = undefined;
    await this.save();
  }
  
  return isValid;
};

// Method to generate JWT token
studentSchema.methods.getSignedJwtToken = function() {
  try {
    // Ensure we're using the same secret and configuration across the application
    const secret = process.env.JWT_SECRET || 'your-jwt-secret';
    const expire = process.env.JWT_EXPIRE || '30d';
    
    return jwt.sign(
      { 
        id: this._id, 
        role: 'student',
        usn: this.usn 
      },
      secret,
      { expiresIn: expire }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Authentication failed - token generation error');
  }
};

module.exports = mongoose.model('Student', studentSchema);