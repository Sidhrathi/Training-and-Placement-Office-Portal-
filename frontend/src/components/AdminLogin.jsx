import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderWithNav from "./HeaderWithNav";
import collegeImage from "../assets/College Main Building.webp";
import "../styles/AdminLogin.css";
import api from "../services/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log(formData);

    try {
      const response = await api.post("/admin/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        // Store the token and role
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);

        // Set default authorization header
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        // Redirect to admin dashboard
        navigate("/admin-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
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
          <div className="login-title">Admin Login</div>
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
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
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
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
