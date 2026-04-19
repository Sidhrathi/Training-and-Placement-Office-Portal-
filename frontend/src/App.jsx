import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Home from "./components/Home";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import StudentLogin from "./components/StudentLogin";
import StudentRegistration from "./components/StudentRegistration";
import TPOLogin from "./components/TPOLogin";
import StudentDashboard from "./components/Studentdashboard";
import TPODashboard from "./components/TPODashbord";
import AboutUs from "./components/AboutUs"; // Import the AboutUs component
import Contact from "./components/Contact"; // Import the Contact component
import ExamCreationPage from "./components/ExamCreationPage"; // Import the ExamCreationPage component
import ExamAttemptPage from "./components/ExamAttemptPage"; // Import the ExamAttemptPage component
import AddJobDrivePage from "./components/AddJobDrivePage"; // Import the AddJobDrivePage component
import EditJobDrivePage from "./components/EditJobDrivePage";
import { checkAuth } from "./services/adminService";
import tpoService from "./services/tpoService";
import studentService from "./services/studentService";
import "./App.css";

// Protected Route Components
const ProtectedAdminRoute = ({ children }) => {
  if (!checkAuth()) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
};

const ProtectedTPORoute = ({ children }) => {
  if (!tpoService.checkAuth()) {
    return <Navigate to="/tpo-login" replace />;
  }
  return children;
};

const ProtectedStudentRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = studentService.checkAuth();
      setIsAuthenticated(authenticated);
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/student-login" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Helmet>
        <title>Training And Placement Cell</title>
        <meta
          name="description"
          content="Training & Placement Cell - KLE Technological University"
        />
      </Helmet>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />{" "}
        {/* Add the AboutUs route */}
        <Route path="/contact" element={<Contact />} />{" "}
        {/* Add the Contact route */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-registration" element={<StudentRegistration />} />
        <Route path="/tpo-login" element={<TPOLogin />} />
        <Route
          path="/tpo-dashboard"
          element={
            <ProtectedTPORoute>
              <TPODashboard />
            </ProtectedTPORoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedStudentRoute>
              <StudentDashboard />
            </ProtectedStudentRoute>
          }
        />
        <Route path="/create-exam" element={<ExamCreationPage />} />{" "}
        {/* Add the ExamCreationPage route */}
        <Route
          path="/exam-attempt/:examId"
          element={
            <ProtectedStudentRoute>
              <ExamAttemptPage />
            </ProtectedStudentRoute>
          }
        />
        <Route
          path="/add-job-drive"
          element={
            <ProtectedTPORoute>
              <AddJobDrivePage />
            </ProtectedTPORoute>
          }
        />
        <Route
          path="/edit-job-drive/:jobId"
          element={
            <ProtectedTPORoute>
              <EditJobDrivePage />
            </ProtectedTPORoute>
          }
        />
        <Route  
          path="/edit-job-drive/:jobId"
          element={
            <ProtectedTPORoute>
              <EditJobDrivePage />
            </ProtectedTPORoute>
          }
        />
        
      </Routes>
    </>
  );
}

export default App;
