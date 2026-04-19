import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </div>
        
        <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
          <ul>
            <li className={location.pathname === '/' ? 'active' : ''}>
              <Link to="/">
                <i className="fas fa-home"></i>
                <span>Home</span>
              </Link>
            </li>
            {/* <li className={location.pathname === '/about' ? 'active' : ''}>
              <Link to="/about">
                <i className="fas fa-info-circle"></i>
                <span>About Us</span>
              </Link>
            </li> */}
            <li className={location.pathname === '/contact' ? 'active' : ''}>
              <Link to="/contact">
                <i className="fas fa-envelope"></i>
                <span>Contact</span>
              </Link>
            </li>
            <li className={`dropdown ${isDropdownOpen ? 'active' : ''}`} ref={dropdownRef}>
              <Link to="#" onClick={(e) => {
                e.preventDefault();
                toggleDropdown();
              }}>
                <i className="fas fa-sign-in-alt"></i>
                <span>Login</span>
                <i className={`dropdown-arrow fas fa-chevron-${isDropdownOpen ? 'up' : 'down'}`}></i>
              </Link>
              <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                <li>
                  <Link to="/student-login">
                    <i className="fas fa-user-graduate"></i>
                    <span>Student</span>
                  </Link>
                </li>
                <li>
                  <Link to="/tpo-login">
                    <i className="fas fa-user-tie"></i>
                    <span>TPO</span>
                  </Link>
                </li>
                <li>
                  <Link to="/admin-login">
                    <i className="fas fa-user-shield"></i>
                    <span>Admin</span>
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;