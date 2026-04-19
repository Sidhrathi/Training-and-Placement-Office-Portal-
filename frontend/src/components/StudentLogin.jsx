import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/StudentLogin.css";
import HeaderWithNav from "./HeaderWithNav";
import Footer from "./footer";
import api from '../services/api';
import collegeImage from '../assets/College Main Building.webp';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    usn: "",
    password: ""
  });
  
  // Clear any existing auth data on component mount
  useEffect(() => {
    // Clear previous tokens
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userData');
    
    // Clear auth headers
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Login and get token
      console.log('Attempting login for USN:', formData.usn.toUpperCase());
      const loginResponse = await api.post('/students/login', {
        usn: formData.usn.toUpperCase(),
        password: formData.password
      });
      
      if (!loginResponse.data.success || !loginResponse.data.token) {
        throw new Error(loginResponse.data.message || 'Login failed - Invalid response');
      }
      
      console.log('Login successful, token received');
      
      // Store auth data
      const { token, data: userData } = loginResponse.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'student');
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Set auth header for next requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Wait for the next tick to ensure storage and header are updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Verify the token by fetching profile
      try {
        console.log('Verifying token by fetching profile data');
        const profileResponse = await api.get('/students/profile');
        
        if (!profileResponse.data) {
          throw new Error('Empty profile data returned');
        }
        
        console.log('Profile fetch successful, navigating to dashboard');
        navigate('/student-dashboard');
      } catch (profileError) {
        console.error('Profile verification failed:', profileError);
        
        // Clear auth data on profile fetch failure
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userData');
        delete api.defaults.headers.common['Authorization'];
        
        if (profileError.response) {
          console.error('Profile response error details:', {
            status: profileError.response.status,
            data: profileError.response.data
          });
          setError(`Login successful but profile verification failed: ${profileError.response.data?.message || 'Unknown error'}`);
        } else {
          setError('Login successful but profile verification failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login process error:', error);
      
      // Clear any partial auth state
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userData');
      delete api.defaults.headers.common['Authorization'];
      
      // Show appropriate error message
      if (error.response) {
        setError(error.response.data?.message || 'Login failed. Please check your credentials.');
      } else if (error.request) {
        setError('Server not responding. Please try again later.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <HeaderWithNav />
      <div className="content">
        <div className="image-container">
          <img src={collegeImage} alt="College Building" className="college-image" />
        </div>

        <div className="login-container">
          <div className="login-title">Student Login</div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="usn">USN:</label>
              <input
                className="form-input"
                id="usn"
                type="text"
                value={formData.usn}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your USN"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password:</label>
              <input
                className="form-input"
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your password"
              />
            </div>

            <div className="form-footer">
              <button 
                className="login-button" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <div className="links">
                <Link to="/student-registration">New Student? Register here</Link>
                <Link to="/forgot-password">Forgot password</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentLogin;