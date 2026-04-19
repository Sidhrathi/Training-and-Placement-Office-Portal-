import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderWithNav from './HeaderWithNav';
import Footer from './footer';
import '../styles/OTPVerification.css';
import api from '../services/api';

const OTPVerification = ({ studentId, studentEmail, onBackToRegistration }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOTPChange = (e) => {
    setOtp(e.target.value);
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/students/verify-email', {
        studentId,
        otp
      });

      if (response.data.success && response.data.token) {
        setSuccess('Email verified successfully! Redirecting to dashboard...');
        localStorage.setItem('token', response.data.token);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/student-dashboard');
        }, 1500);
      } else {
        throw new Error('Verification failed: No token received');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!studentId) {
      setError('Unable to resend OTP. Please try registering again.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/students/resend-otp', { studentId });
      
      if (response.data.success) {
        setSuccess('OTP has been resent to your email');
      } else {
        throw new Error('Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <HeaderWithNav />
      <main className="verification-main">
        <h2>Email Verification</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="verification-info">
          <p>An OTP has been sent to <strong>{studentEmail}</strong></p>
          <p>Please check your email and enter the 6-digit code below to verify your account.</p>
        </div>
        
        <form className="otp-form" onSubmit={handleOTPSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Enter 6-digit OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOTPChange}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
            />
          </div>
          
          <div className="form-buttons">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              className="resend-button"
              onClick={handleResendOTP}
              disabled={isSubmitting}
            >
              Resend OTP
            </button>
          </div>
        </form>
        
        <div className="back-to-registration">
          <button
            onClick={onBackToRegistration}
            className="back-button"
          >
            Back to Registration
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OTPVerification;
