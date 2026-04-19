import React from "react";
import "../styles/Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-flex">
        <img src="/assets/logo.png" alt="Logo" />
        <div>
          <h1>Training and Placement Cell</h1>
          <h4>Lachoo Memorial College of Science & Technology Jodhpur</h4>
        </div>
      </div>
    </header>
  );
};

export default Header;
