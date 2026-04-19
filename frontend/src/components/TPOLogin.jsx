import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/TPOLogin.css";
import HeaderWithNav from "./HeaderWithNav";
import Footer from "./footer";
import collegeImage from '../assets/College Main Building.webp';
import tpoService from '../services/tpoService';

const TPOLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

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
      const response = await tpoService.login(formData);
      
      if (response?.data?.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('userData', JSON.stringify(response.data.data));
        
        // Set default authorization header for future requests
        tpoService.setAuthToken(response.data.token);
        
        navigate('/tpo-dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <HeaderWithNav />
      <div className="content">
        <div className="image-container">
          <img
            src={collegeImage}
            alt="College Building"
            className="college-image"
          />
        </div>

        <div className="login-container">
          <div className="login-title">TPO Login</div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email:
              </label>
              <input
                className="form-input"
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password:
              </label>
              <input
                className="form-input"
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
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

export default TPOLogin;