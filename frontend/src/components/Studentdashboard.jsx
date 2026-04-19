import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./footer";
import "../styles/StudentDashboard.css";
import "../styles/ExamStatus.css";
import "../styles/ExamDates.css";
import "../styles/SuccessMessage.css";
import "../styles/ExamResultsPage.css";
import "../styles/ExamButton.css";
import "../styles/ExamModal.css";
import "../styles/JobApplications.css";
import api from "../services/api";
import studentService from "../services/studentService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [examData, setExamData] = useState({
    aptitude: [],
    programming: [],
    english: [],
  });
  const [availableExams, setAvailableExams] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [applyingToJob, setApplyingToJob] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamDetailsModal, setShowExamDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);

  // Add these new state variables for filtering exam results
  const [examTypeFilter, setExamTypeFilter] = useState("All");
  const [resultStatusFilter, setResultStatusFilter] = useState("All");
  // Add this function to handle filtering of exam results
  const getFilteredExamResults = () => {
    // Combine all exam types into a single array with type information
    let results = [
      ...examData.aptitude.map((test) => ({
        ...test,
        type: test.type || "Aptitude",
      })),
      ...examData.programming.map((test) => ({
        ...test,
        type: test.type || "Programming",
      })),
      ...examData.english.map((test) => ({
        ...test,
        type: test.type || "English",
      })),
    ];

    console.log("All exam results before filtering:", results);

    // Filter by exam type if a specific type is selected
    if (examTypeFilter !== "All") {
      results = results.filter((test) => test.type === examTypeFilter);
    }

    // Ensure each result has percentage and passing status calculated
    results = results.map((test) => {
      // Use existing percentage if available, otherwise calculate it
      const percentage =
        test.percentage || Math.round((test.score / test.maxScore) * 100);

      // Use existing isPassed if available, otherwise calculate based on percentage and passing threshold
      let isPassed;
      if (test.isPassed !== undefined) {
        isPassed = test.isPassed;
      } else if (
        test.status &&
        (test.status === "Passed" || test.status === "Failed")
      ) {
        isPassed = test.status === "Passed";
      } else {
        // Default passing threshold is 60% if not specified
        const passingThreshold = test.passingPercentage || 60;
        isPassed = percentage >= passingThreshold;
      }

      return {
        ...test,
        percentage,
        isPassed,
        // Ensure we have a proper date object or string
        date: test.date || new Date().toISOString().split("T")[0],
      };
    });

    // Apply status filter (Passed/Failed)
    if (resultStatusFilter === "Passed") {
      results = results.filter((test) => test.isPassed);
    } else if (resultStatusFilter === "Failed") {
      results = results.filter((test) => !test.isPassed);
    }

    // Sort by date (newest first)
    const sortedResults = results.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    console.log("Filtered and sorted exam results:", sortedResults);
    return sortedResults;
  };

  // Add this function to handle opening the exam details modal
  const handleViewExamDetails = (exam) => {
    setSelectedExam(exam);
    setShowExamDetailsModal(true);
  }; // Add this function to close the exam details modal
  const closeExamDetailsModal = () => {
    setShowExamDetailsModal(false);
    setSelectedExam(null);
  };
  // Handle viewing job details
  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  // Close job details modal
  const closeJobDetailsModal = () => {
    setShowJobDetailsModal(false);
    setSelectedJob(null);
  };

  const defaultMockExams = [
    {
      _id: "1",
      title: "Aptitude Test - May 2025",
      type: "aptitude",
      scheduledDate: "2025-05-20T10:00:00.000Z",
      duration: 60,
      status: "Active",
      passingPercentage: 60,
      instructions:
        "This is a sample aptitude test with multiple choice questions.",
    },
    {
      _id: "2",
      title: "Programming Test - DSA",
      type: "programming",
      scheduledDate: "2025-05-22T14:00:00.000Z",
      duration: 90,
      status: "Active",
      passingPercentage: 70,
      instructions: "Test your data structures and algorithms knowledge.",
    },
    {
      _id: "3",
      title: "English Proficiency Test",
      type: "english",
      scheduledDate: "2025-05-25T09:30:00.000Z",
      duration: 45,
      status: "Scheduled",
      passingPercentage: 50,
      instructions: "Assessment of English language skills.",
    },
  ];

  // Check if we have a completed exam message from navigation state
  useEffect(() => {
    if (location.state?.examCompleted) {
      setSuccessMessage(
        "Exam completed successfully! Your results have been recorded."
      );
      setActiveSection("exams"); // Show the exams tab

      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Fetch student data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify authentication properly
        if (!studentService.checkAuth()) {
          console.log("Authentication check failed, redirecting to login");
          navigate("/student-login");
          return;
        }

        setLoading(true);
        console.log("Authentication found, fetching profile data...");

        // Make sure the API has proper auth headers
        const token = localStorage.getItem("token");
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        try {
          // Fetch student profile first
          console.log("Requesting profile data");
          const profileResponse = await studentService.getProfile();
          console.log("Profile response received:", profileResponse.status);

          if (!profileResponse.data || !profileResponse.data.data) {
            throw new Error("Empty profile data returned");
          }

          // Extract student data from response.data.data where the actual student object is located
          const student = profileResponse.data.data;
          console.log("Profile data extracted successfully:", student);
          // Map backend field names to frontend names for consistency
          const mappedStudentData = {
            ...student,
            phone: student.phoneNumber,
            percentage10: student.tenthPercentage,
            percentage12: student.twelfthPercentage,
            percentageDegree: student.degreePercentage,
            currentSemester: student.semester,
            currentSemesterCGPA: student.cgpa,
          };

          // Then fetch other data
          try {
            // Fetch exam results, available exams, and job listings
            console.log("Requesting additional data (exams and jobs)");
            const [examResults, jobsResponse] = await Promise.all([
              studentService.getExamResults(),
              api.get("/jobs"),
            ]);

            // Fetch real exams from the database
            try {
              console.log("Fetching available exams from the database...");
              const availableExamsResponse =
                await studentService.getAvailableExams();
              if (
                availableExamsResponse.data &&
                Array.isArray(availableExamsResponse.data)
              ) {
                console.log(
                  "Available exams fetched from API:",
                  availableExamsResponse.data
                ); // Map API response fields to match our UI expectations
                const mappedExams = availableExamsResponse.data
                  .map((exam) => {
                    // Ensure exam has a valid ID
                    if (!exam._id) {
                      console.error("Exam missing ID:", exam);
                      return null; // Skip this exam
                    }

                    // Use our helper method to determine status consistently
                    const examStatus = studentService.getExamStatus(exam);

                    return {
                      _id: exam._id, // Ensure this exists
                      title: exam.title || exam.name || "Unnamed Exam",
                      type: exam.type || "general",
                      scheduledDate:
                        exam.scheduledDate ||
                        exam.date ||
                        new Date().toISOString(),
                      duration: exam.duration || 60,
                      status: examStatus,
                      passingPercentage: exam.passingPercentage || 50,
                      instructions:
                        exam.instructions || "No instructions provided.",
                      startDate: exam.startDate,
                      endDate: exam.endDate,
                    };
                  })
                  .filter(Boolean); // Remove any null entries

                // Use the mapped exams from the database
                setAvailableExams(mappedExams);

                // Log the active exams count to verify
                const activeExams = mappedExams.filter(
                  (exam) => exam.status.toLowerCase() === "active"
                ).length;
                console.log(
                  `Found ${activeExams} active exams out of ${mappedExams.length} total exams`
                );
              } else {
                console.warn("Invalid exam data format received from API");
                // Only use default mock exams if no actual exams were returned
                setAvailableExams(defaultMockExams);
              }
            } catch (examsError) {
              console.error("Error fetching exams from API:", examsError);
              console.log("Using mock exam data as fallback");
              // Use the default mock exams defined at component level
              setAvailableExams(defaultMockExams);
            }

            console.log("Additional data received successfully");

            // Process jobs data
            const availableJobs = jobsResponse.data.map((job) => ({
              ...job,
              hasApplied: student.appliedJobs
                ? student.appliedJobs.some((aj) => aj.jobId === job._id)
                : false,
            }));

            setStudentData({
              ...mappedStudentData,
              availableJobs,
            }); // Process exam results
            const transformedExamData = {
              aptitude: [],
              programming: [],
              english: [],
            };

            if (
              examResults &&
              examResults.data &&
              Array.isArray(examResults.data)
            ) {
              console.log("Fetched exam results:", examResults.data);
              examResults.data.forEach((result) => {
                if (result.examId) {
                  const examEntry = {
                    id: result.examId._id || result._id,
                    name: result.examId.name || "Unnamed Exam",
                    score: result.score,
                    maxScore: result.examId.maxScore || result.maxScore || 100,
                    date: new Date(
                      result.date || result.takenDate || Date.now()
                    )
                      .toISOString()
                      .split("T")[0],
                    status: result.status || "Pending",
                    // Store additional metadata that might be useful
                    passingPercentage: result.examId.passingPercentage || 60,
                    type: result.examId.type || "general",
                  };

                  // Calculate percentage and determine if passed
                  const percentage = Math.round(
                    (examEntry.score / examEntry.maxScore) * 100
                  );
                  examEntry.percentage = percentage;
                  examEntry.isPassed =
                    percentage >= examEntry.passingPercentage;

                  // Determine exam type, with fallback to 'general' if not specified
                  const examType = result.examId.type || "general";

                  switch (examType.toLowerCase()) {
                    case "aptitude":
                      transformedExamData.aptitude.push({
                        ...examEntry,
                        type: "Aptitude",
                      });
                      break;
                    case "programming":
                      transformedExamData.programming.push({
                        ...examEntry,
                        type: "Programming",
                      });
                      break;
                    case "english":
                      transformedExamData.english.push({
                        ...examEntry,
                        type: "English",
                      });
                      break;
                    default:
                      // For any other exam type, put it in the most relevant category
                      transformedExamData.aptitude.push({
                        ...examEntry,
                        type: "General",
                      });
                      break;
                  }
                }
              });

              // Sort each category by date (newest first)
              transformedExamData.aptitude.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              );
              transformedExamData.programming.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              );
              transformedExamData.english.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              );

              console.log("Transformed exam data:", transformedExamData);
            } else {
              console.warn(
                "No exam results data found or invalid format",
                examResults
              );
            }
            setExamData(transformedExamData);

            // No longer overriding available exams here - we'll use what we got from the API
            setLoading(false);
          } catch (dataError) {
            console.error("Error fetching additional data:", dataError);
            console.log("Loading dashboard with profile data only");

            // Continue with profile data even if other data fails
            setStudentData(mappedStudentData);
            setLoading(false);
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);

          // Show more detailed error to help diagnose the issue
          let errorMessage = "Could not load your profile. ";

          if (profileError.response) {
            errorMessage += `Server response: ${
              profileError.response.status
            } - ${profileError.response.data?.message || "Unknown error"}`;

            // Check if it's an authentication error
            if (profileError.response.status === 401) {
              errorMessage = "Authentication error. Please login again.";
              studentService.logout();
            }
          } else if (profileError.request) {
            errorMessage +=
              "No response received from the server. Check your internet connection.";
          } else {
            errorMessage += profileError.message || "An unknown error occurred";
          }

          setError(errorMessage);
          setLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error in dashboard:", error);
        setError(
          `An unexpected error occurred. Please try again later. ${error.message}`
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Calculate stats from real data
  const stats = [
    {
      id: 1,
      title: "Overall Average",
      count: calculateOverallAverage(examData),
      icon: "chart-line",
    },
    {
      id: 2,
      title: "Tests Taken",
      count: calculateTotalTests(examData),
      icon: "file-alt",
    },
    {
      id: 3,
      title: "Available Exams",
      count: availableExams ? availableExams.length : "0",
      icon: "calendar-alt",
    },
    {
      id: 4,
      title: "Applied Jobs",
      count: studentData?.appliedJobs?.length || "0",
      icon: "briefcase",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/student-login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".student-profile")) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const chartData = {
    labels: examData.aptitude.map((test) => test.name),
    datasets: [
      {
        label: "Score",
        data: examData.aptitude.map((test) => test.score),
        backgroundColor: "rgba(79, 125, 247, 0.6)",
        borderColor: "#4f7df7",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      setResumeFile(file);
    } else {
      setError("Please upload a PDF or Word document");
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      // Handle resume file if uploaded
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      // Format and append other fields with proper naming to match backend
      const fieldsToUpdate = {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone, // Will be mapped to phoneNumber in backend
        city: studentData.city,
        state: studentData.state,
        branch: studentData.branch,
        department: studentData.department,
        percentage10: parseFloat(
          studentData.percentage10 || studentData.tenthPercentage
        ),
        percentage12: parseFloat(
          studentData.percentage12 || studentData.twelfthPercentage
        ),
        percentageDegree: parseFloat(
          studentData.percentageDegree || studentData.degreePercentage
        ),
        currentSemester: parseInt(
          studentData.currentSemester || studentData.semester
        ),
        currentSemesterCGPA: parseFloat(
          studentData.currentSemesterCGPA || studentData.cgpa
        ),
      };

      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !isNaN(value)
        ) {
          formData.append(key, value);
        }
      });

      console.log("Updating profile with data...");
      const response = await studentService.updateProfile(formData);

      if (response.data.success) {
        setSuccessMessage("Profile updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000); // Clear success message after 3 seconds

        // Update the student data with the response
        const updatedData = response.data.data;

        // Map backend field names to frontend field names if needed
        const mappedData = {
          ...updatedData,
          percentage10: updatedData.tenthPercentage,
          percentage12: updatedData.twelfthPercentage,
          percentageDegree: updatedData.degreePercentage,
          currentSemester: updatedData.semester,
          currentSemesterCGPA: updatedData.cgpa,
          phone: updatedData.phoneNumber,
        };

        setStudentData((prevData) => ({
          ...prevData,
          ...mappedData,
          availableJobs: prevData.availableJobs, // Preserve availableJobs which might not be in the response
        }));

        setEditMode(false);
      } else {
        setError(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setError(
        "Failed to update profile. " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async () => {
    try {
      setLoading(true);
      setError("");

      // Use the corrected service function
      const response = await studentService.getResume();

      // The response.data is already a blob since we set responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        studentData.resume.originalName || "resume.pdf"
      );
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Resume download successful");
    } catch (error) {
      console.error("Resume download error:", error);
      setError(
        "Failed to download resume. " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = () => {
    downloadResume();
  }; // Add this function to handle exporting exam results
  const handleExportResults = () => {
    // Get the filtered results
    const filteredResults = getFilteredExamResults();

    if (filteredResults.length === 0) {
      setError("No results to export");
      return;
    }

    // Convert the results to CSV
    const headers = [
      "Exam Name",
      "Type",
      "Date",
      "Score",
      "Maximum Score",
      "Percentage",
      "Result",
    ];
    const csvRows = [
      headers.join(","),
      ...filteredResults.map((result) => {
        return [
          `"${result.name}"`,
          `"${result.type}"`,
          `"${formatDate(result.date)}"`,
          result.score,
          result.maxScore,
          `${result.percentage}%`,
          result.isPassed ? "PASSED" : "FAILED",
        ].join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Current date for the filename
    const date = new Date().toISOString().split("T")[0];

    // Set link properties
    link.setAttribute("href", url);
    link.setAttribute("download", `exam-results-${date}.csv`);
    link.style.visibility = "hidden";

    // Add to the document, trigger click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle exporting a single exam result
  const handleExportSingleResult = (exam) => {
    // Create a CSV for just this single exam
    const headers = [
      "Exam Name",
      "Type",
      "Date",
      "Score",
      "Maximum Score",
      "Percentage",
      "Result",
    ];
    const csvRows = [
      headers.join(","),
      [
        `"${exam.name}"`,
        `"${exam.type}"`,
        `"${formatDate(exam.date)}"`,
        exam.score,
        exam.maxScore,
        `${exam.percentage}%`,
        exam.isPassed ? "PASSED" : "FAILED",
      ].join(","),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `exam-result-${exam.name.replace(/\s+/g, "-")}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle exporting job applications
  const handleExportApplications = () => {
    if (!studentData?.appliedJobs || studentData.appliedJobs.length === 0) {
      setError("No applications to export");
      return;
    }

    // Convert the job applications to CSV
    const headers = ["Company", "Role", "Applied Date", "Status"];
    const csvRows = [
      headers.join(","),
      ...studentData.appliedJobs.map((application) => {
        return [
          `"${application.company}"`,
          `"${application.role}"`,
          `"${formatDate(application.appliedDate)}"`,
          `"${application.status}"`,
        ].join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Current date for the filename
    const date = new Date().toISOString().split("T")[0];

    // Set link properties
    link.setAttribute("href", url);
    link.setAttribute("download", `job-applications-${date}.csv`);
    link.style.visibility = "hidden";

    // Add to the document, trigger click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyJob = async (jobId) => {
    try {
      setApplyingToJob(true);
      await api.post(`/students/apply-job/${jobId}`);

      // Refresh student data to update applied jobs list
      const response = await api.get("/students/profile");
      setStudentData(response.data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to apply for the job. Please try again."
      );
    } finally {
      setApplyingToJob(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading student data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button
          onClick={() => navigate("/student-login")}
          className="retry-button"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-content">
        {/* Student Profile Icon */}
        <div className="student-profile">
          <button
            className="student-icon"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <i className="fas fa-user-circle"></i>
            <span>{studentData?.name}</span>
            <i
              className={`fas fa-chevron-${
                showProfileDropdown ? "up" : "down"
              }`}
            ></i>
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <i className="fas fa-user-circle"></i>
                <span>{studentData?.name}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button onClick={() => setActiveSection("profile")}>
                <i className="fas fa-user-edit"></i>
                Edit Profile
              </button>
              <button onClick={() => navigate("/reset-password")}>
                <i className="fas fa-key"></i>
                Reset Password
              </button>
              <button onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav>
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveSection("dashboard")}
            >
              <i className="fas fa-chart-line"></i>
              <span>Dashboard</span>
            </Link>
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "exam-results" ? "active" : ""
              }`}
              onClick={() => setActiveSection("exam-results")}
            >
              <i className="fas fa-file-alt"></i>
              <span>Exam Results</span>
            </Link>{" "}
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "exams" ? "active" : ""
              }`}
              onClick={() => setActiveSection("exams")}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Exams</span>
            </Link>
            <Link
              to="#"
              className={`nav-item ${activeSection === "jobs" ? "active" : ""}`}
              onClick={() => setActiveSection("jobs")}
            >
              <i className="fas fa-briefcase"></i>
              <span>Job Applications</span>
            </Link>
            {/* <Link
              to="#"
              className={`nav-item ${
                activeSection === "announcements" ? "active" : ""
              }`}
              onClick={() => setActiveSection("announcements")}
            >
              <i className="fas fa-briefcase"></i>
              <span>Notifications</span>
            </Link> */}
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveSection("profile")}
            >
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </Link>
          </nav>
        </aside>
        {/* Main Content */}{" "}
        <main className="dashboard-main">
          {/* Success Message */}
          {successMessage && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              {successMessage}
            </div>
          )}
          {activeSection === "dashboard" && (
            <>
              <div className="stats-container">
                {stats.map((stat) => (
                  <div key={stat.id} className="stat-card">
                    <div className="stat-icon">
                      <i className={`fas fa-${stat.icon}`}></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stat.title}</h3>
                      <p>{stat.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              <section className="exam-results-section">
                <h2>Recent Exam Results</h2>
                <div className="results-grid">
                  <div className="result-card aptitude">
                    <h3>Aptitude</h3>
                    <div className="chart-container">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  </div>
                  <div className="result-card programming">
                    <h3>Programming (DSA)</h3>
                    <div className="chart-container">
                      <Bar
                        data={{
                          ...chartData,
                          labels: examData.programming.map((test) => test.name),
                          datasets: [
                            {
                              ...chartData.datasets[0],
                              data: examData.programming.map(
                                (test) => test.score
                              ),
                            },
                          ],
                        }}
                        options={chartOptions}
                      />
                    </div>
                  </div>
                  <div className="result-card english">
                    <h3>English</h3>
                    <div className="chart-container">
                      <Bar
                        data={{
                          ...chartData,
                          labels: examData.english.map((test) => test.name),
                          datasets: [
                            {
                              ...chartData.datasets[0],
                              data: examData.english.map((test) => test.score),
                            },
                          ],
                        }}
                        options={chartOptions}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}{" "}
          {activeSection === "exam-results" && (
            <section className="dashboard-section">
              {" "}
              <div className="section-header">
                <h2>Exam Results</h2>
                <button
                  className="export-button"
                  onClick={handleExportResults}
                  disabled={getFilteredExamResults().length === 0}
                >
                  <i className="fas fa-download"></i> Export Results
                </button>
              </div>
              {/* Show loading state if still loading */}{" "}
              {loading ? (
                <div className="results-loading">
                  <div className="spinner"></div>
                  <p>Loading your exam results...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <i className="fas fa-exclamation-circle"></i>
                  <h4>Error loading results</h4>
                  <p>{error}</p>
                  <button
                    className="action-button"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fas fa-redo"></i> Try Again
                  </button>
                </div>
              ) : (
                <div className="exam-results-container">
                  <div className="results-filter-bar">
                    <div className="filter-group">
                      <label htmlFor="exam-type-filter">Filter by Type:</label>
                      <select
                        id="exam-type-filter"
                        value={examTypeFilter}
                        onChange={(e) => setExamTypeFilter(e.target.value)}
                      >
                        <option value="All">All Exams</option>
                        <option value="Aptitude">Aptitude</option>
                        <option value="Programming">Programming</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    <div className="status-toggle">
                      <button
                        className={resultStatusFilter === "All" ? "active" : ""}
                        onClick={() => setResultStatusFilter("All")}
                      >
                        All
                      </button>
                      <button
                        className={
                          resultStatusFilter === "Passed" ? "active" : ""
                        }
                        onClick={() => setResultStatusFilter("Passed")}
                      >
                        Passed
                      </button>
                      <button
                        className={
                          resultStatusFilter === "Failed" ? "active" : ""
                        }
                        onClick={() => setResultStatusFilter("Failed")}
                      >
                        Failed
                      </button>
                    </div>
                  </div>

                  {calculateTotalTests(examData) === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-clipboard-list"></i>
                      <h4>No Exam Results Yet</h4>
                      <p>
                        You haven't taken any exams yet. Once you complete an
                        exam, your results will appear here.
                      </p>
                      <button
                        className="action-button take-exam"
                        onClick={() => setActiveSection("exams")}
                      >
                        <i className="fas fa-file-alt"></i> Go to Available
                        Exams
                      </button>
                    </div>
                  ) : getFilteredExamResults().length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-filter"></i>
                      <h4>No Results Match Your Filters</h4>
                      <p>
                        Try changing your filter criteria or select "All" to see
                        all your exam results.
                      </p>
                      <button
                        className="action-button"
                        onClick={() => {
                          setExamTypeFilter("All");
                          setResultStatusFilter("All");
                        }}
                      >
                        <i className="fas fa-times-circle"></i> Clear Filters
                      </button>
                    </div>
                  ) : (
                    <table className="exam-results-table">
                      <thead>
                        <tr>
                          <th>Exam Name</th>
                          <th>Type</th>
                          <th>Date</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredExamResults().map((test) => {
                          return (
                            <tr key={test.id}>
                              <td data-label="Exam Name">{test.name}</td>
                              <td data-label="Type">
                                <span
                                  className={`exam-type-badge ${test.type.toLowerCase()}`}
                                >
                                  {test.type}
                                </span>
                              </td>
                              <td data-label="Date">{formatDate(test.date)}</td>
                              <td data-label="Score">
                                <div className="score-display">
                                  <strong>{test.score}</strong>
                                  <span className="max-score">
                                    /{test.maxScore}
                                  </span>
                                </div>
                              </td>
                              <td data-label="Percentage">
                                <div className="percentage-bar-container">
                                  <div
                                    className={`percentage-bar ${
                                      test.isPassed ? "passed" : "failed"
                                    }`}
                                    style={{ width: `${test.percentage}%` }}
                                  ></div>
                                  <span className="percentage-text">
                                    {test.percentage}%
                                  </span>
                                </div>
                              </td>
                              <td data-label="Status">
                                <span
                                  className={`result-status ${
                                    test.isPassed ? "passed" : "failed"
                                  }`}
                                >
                                  {test.isPassed ? "PASSED" : "FAILED"}
                                </span>
                              </td>
                              <td data-label="Actions">
                                <button
                                  className="action-button view"
                                  onClick={() => handleViewExamDetails(test)}
                                >
                                  <i className="fas fa-eye"></i> View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </section>
          )}{" "}
          {activeSection === "exams" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Exams</h2>
              </div>{" "}
              <div className="exams-container">
                <table>
                  <thead>
                    {" "}
                    <tr>
                      <th>Exam Name</th>
                      <th>Type</th>
                      <th>Scheduled For</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableExams.length > 0 ? (
                      availableExams.map((exam) => {
                        const examStatus = studentService.getExamStatus(exam);
                        const isActive = studentService.isExamActive(exam);

                        return (
                          <tr key={exam._id}>
                            <td>{exam.title}</td>
                            <td>{exam.type}</td>
                            <td>
                              {formatDate(exam.scheduledDate)}
                              {exam.startDate && exam.endDate && (
                                <div className="exam-date-range">
                                  <small>
                                    Available: {formatDate(exam.startDate)} -{" "}
                                    {formatDate(exam.endDate)}
                                  </small>
                                </div>
                              )}
                            </td>
                            <td>{exam.duration} minutes</td>
                            <td>
                              <span
                                className={`status-badge ${examStatus.toLowerCase()}`}
                              >
                                {examStatus}
                              </span>
                            </td>
                            <td>
                              {" "}
                              {isActive ? (
                                <Link
                                  to={`/exam-attempt/${exam._id}`}
                                  className="action-button take-exam"
                                >
                                  <i className="fas fa-edit mr-1"></i> Take Exam
                                </Link>
                              ) : (
                                <button
                                  className="action-button take-exam disabled"
                                  disabled
                                  title={`This exam is ${examStatus} and cannot be taken now`}
                                >
                                  <i className="fas fa-lock mr-1"></i> Take Exam
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-exams-message">
                          No exams are currently available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}{" "}
          {activeSection === "jobs" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Job Applications</h2>{" "}
                <button
                  className="export-button"
                  onClick={handleExportApplications}
                  disabled={
                    !studentData?.appliedJobs ||
                    studentData.appliedJobs.length === 0
                  }
                >
                  <i className="fas fa-download"></i> Export Applications
                </button>
              </div>

              {loading ? (
                <div className="results-loading">
                  <div className="spinner"></div>
                  <p>Loading job opportunities...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <i className="fas fa-exclamation-circle"></i>
                  <h4>Error loading jobs</h4>
                  <p>{error}</p>
                  <button
                    className="action-button"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fas fa-redo"></i> Try Again
                  </button>
                </div>
              ) : (
                <div className="jobs-container">
                  {/* Available Jobs Section */}
                  <div className="jobs-section available-jobs">
                    <div className="section-title">
                      <h3>
                        <i className="fas fa-briefcase"></i> Available
                        Opportunities
                      </h3>
                      <div className="job-count">
                        <span>
                          {studentData?.availableJobs?.length || 0}{" "}
                          opportunities
                        </span>
                      </div>
                    </div>

                    {studentData?.availableJobs?.length > 0 ? (
                      <div className="jobs-table-container">
                        <table className="jobs-table">
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>Role</th>
                              <th>Package (LPA)</th>
                              <th>Last Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentData?.availableJobs?.map((job) => (
                              <tr
                                key={job._id}
                                className={job.hasApplied ? "job-applied" : ""}
                              >
                                <td data-label="Company">
                                  <div className="company-cell">
                                    <span className="company-name">
                                      {job.companyName}
                                    </span>
                                  </div>
                                </td>
                                <td data-label="Role">
                                  <span className="job-role">
                                    {job.jobRole}
                                  </span>
                                  {job.location && (
                                    <span className="job-location">
                                      <i className="fas fa-map-marker-alt"></i>{" "}
                                      {job.location}
                                    </span>
                                  )}
                                </td>
                                <td data-label="Package">
                                  <div className="salary-display">
                                    {typeof job.package === "object" ? (
                                      <>
                                        {job.package.basePay && (
                                          <span className="base-salary">
                                            {job.package.basePay} LPA
                                          </span>
                                        )}
                                        {job.package.totalCTC && (
                                          <span className="total-ctc">
                                            Total: {job.package.totalCTC} LPA
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span>{job.package}</span>
                                    )}
                                  </div>
                                </td>
                                <td data-label="Last Date">
                                  <div className="application-deadline">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>
                                      {formatDate(job.lastDateToApply)}
                                    </span>
                                    {new Date(job.lastDateToApply) <
                                    new Date() ? (
                                      <span className="deadline-closed">
                                        Closed
                                      </span>
                                    ) : (
                                      <span className="deadline-days-left">
                                        {Math.ceil(
                                          (new Date(job.lastDateToApply) -
                                            new Date()) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        days left
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td data-label="Actions">
                                  <button
                                    className={`job-action-button ${
                                      job.hasApplied ? "applied" : "apply"
                                    }`}
                                    onClick={() => handleApplyJob(job._id)}
                                    disabled={
                                      job.hasApplied ||
                                      new Date(job.lastDateToApply) < new Date()
                                    }
                                  >
                                    <i
                                      className={`fas fa-${
                                        job.hasApplied
                                          ? "check-circle"
                                          : "paper-plane"
                                      }`}
                                    ></i>
                                    {job.hasApplied ? "Applied" : "Apply Now"}
                                  </button>
                                  <button
                                    className="job-action-button view"
                                    onClick={() => handleViewJobDetails(job)}
                                  >
                                    <i className="fas fa-eye"></i>
                                    Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-briefcase"></i>
                        <h4>No Jobs Available</h4>
                        <p>
                          There are currently no job opportunities available.
                          Check back later for new postings.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* My Applications Section */}
                  <div className="jobs-section applied-jobs">
                    <div className="section-title">
                      <h3>
                        <i className="fas fa-clipboard-check"></i> My
                        Applications
                      </h3>
                      <div className="job-count">
                        <span>
                          {studentData?.appliedJobs?.length || 0} applications
                        </span>
                      </div>
                    </div>

                    {studentData?.appliedJobs?.length > 0 ? (
                      <div className="jobs-table-container">
                        <table className="jobs-table">
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>Role</th>
                              <th>Applied Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {" "}
                            {studentData?.appliedJobs?.map((application) => (
                              <tr
                                key={application._id}
                                className={`application-status-${application.status.toLowerCase()}`}
                              >
                                <td data-label="Company">
                                  <div className="company-cell">
                                    <span className="company-name">
                                      {application.companyName ||
                                        application.company ||
                                        "Unknown Company"}
                                    </span>
                                  </div>
                                </td>
                                <td data-label="Role">
                                  <span className="job-role">
                                    {application.jobRole ||
                                      application.role ||
                                      "Unknown Role"}
                                  </span>
                                  {application.location && (
                                    <span className="job-location">
                                      <i className="fas fa-map-marker-alt"></i>{" "}
                                      {application.location}
                                    </span>
                                  )}
                                </td>
                                <td data-label="Applied Date">
                                  <div className="application-date">
                                    <i className="fas fa-calendar-check"></i>
                                    <span>
                                      {formatDate(application.appliedDate)}
                                    </span>
                                  </div>
                                </td>
                                <td data-label="Status">
                                  <span
                                    className={`application-status ${application.status.toLowerCase()}`}
                                  >
                                    {application.status === "APPLIED" && (
                                      <i className="fas fa-hourglass-half"></i>
                                    )}
                                    {application.status === "SHORTLISTED" && (
                                      <i className="fas fa-list-ul"></i>
                                    )}
                                    {application.status === "INTERVIEW" && (
                                      <i className="fas fa-user-tie"></i>
                                    )}
                                    {application.status === "SELECTED" && (
                                      <i className="fas fa-check-circle"></i>
                                    )}
                                    {application.status === "REJECTED" && (
                                      <i className="fas fa-times-circle"></i>
                                    )}
                                    {application.status}
                                  </span>
                                </td>
                                <td data-label="Actions">
                                  {" "}
                                  <button
                                    className="job-action-button view"
                                    onClick={() =>
                                      handleViewJobDetails(application)
                                    }
                                  >
                                    <i className="fas fa-eye"></i>
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-clipboard-list"></i>
                        <h4>No Applications Yet</h4>
                        <p>
                          You haven't applied to any jobs yet. Browse available
                          opportunities and submit your first application.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
          {activeSection === "announcements" && (
            <section className="management-section">
              <div className="section-header">
                <h2>Announcements Management</h2>
                <button
                  className="add-button"
                  onClick={() => setShowAddAnnouncementModal(true)}
                >
                  <i className="fas fa-plus"></i> Create Announcement
                </button>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-options">
                  <select
                    value={announcementFilter.type}
                    onChange={(e) =>
                      handleAnnouncementFilter("type", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    <option value="general">General</option>
                    <option value="placement">Placement</option>
                    <option value="academic">Academic</option>
                    <option value="event">Event</option>
                  </select>
                  <select
                    value={announcementFilter.visibility}
                    onChange={(e) =>
                      handleAnnouncementFilter("visibility", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">All Visibility</option>
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="tpos">TPOs Only</option>
                  </select>
                </div>
              </div>

              {loading && (
                <div className="loading-message">Loading announcements...</div>
              )}
              {error && <div className="error-message">{error}</div>}

              <div className="announcements-grid">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div key={announcement._id} className="announcement-card">
                      <div className="announcement-header">
                        <h3>{announcement.title}</h3>
                        <span className="announcement-date">
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="announcement-content">
                        <p>{announcement.content}</p>
                        <div className="announcement-meta">
                          <span
                            className={`announcement-badge ${announcement.type}`}
                          >
                            {announcement.type}
                          </span>
                          <span
                            className={`priority-badge ${announcement.priority}`}
                          >
                            {announcement.priority} priority
                          </span>
                        </div>
                      </div>
                      <div className="announcement-actions">
                        <button
                          className="action-button edit"
                          onClick={() => handleEditAnnouncement(announcement)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="action-button delete"
                          onClick={() =>
                            handleAnnouncementDelete(announcement._id)
                          }
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No announcements found</div>
                )}
              </div>

              {/* Add/Edit Announcement Modal */}
              {showAddAnnouncementModal && (
                <div className="modal-overlay">
                  <div className="modal">
                    <h2>
                      {editingAnnouncement
                        ? "Edit Announcement"
                        : "Create New Announcement"}
                    </h2>
                    <form
                      onSubmit={handleAnnouncementSubmit}
                      className="modal-form"
                    >
                      <div className="form-group">
                        <label htmlFor="title">Title*</label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={announcementFormData.title}
                          onChange={handleAnnouncementInputChange}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="type">Type*</label>
                          <select
                            id="type"
                            name="type"
                            value={announcementFormData.type}
                            onChange={handleAnnouncementInputChange}
                            required
                          >
                            <option value="">Select Type</option>
                            <option value="general">General</option>
                            <option value="placement">Placement</option>
                            <option value="academic">Academic</option>
                            <option value="event">Event</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="priority">Priority</label>
                          <select
                            id="priority"
                            name="priority"
                            value={announcementFormData.priority}
                            onChange={handleAnnouncementInputChange}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="visibility">Visibility*</label>
                          <select
                            id="visibility"
                            name="visibility"
                            value={announcementFormData.visibility}
                            onChange={handleAnnouncementInputChange}
                            required
                          >
                            <option value="all">All Users</option>
                            <option value="students">Students Only</option>
                            <option value="tpos">TPOs Only</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="expiryDate">Expiry Date</label>
                          <input
                            type="date"
                            id="expiryDate"
                            name="expiryDate"
                            value={announcementFormData.expiryDate}
                            onChange={handleAnnouncementInputChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="content">Content*</label>
                        <textarea
                          id="content"
                          name="content"
                          value={announcementFormData.content}
                          onChange={handleAnnouncementInputChange}
                          rows="6"
                          required
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>Attachments</label>
                        <div className="file-upload">
                          <input
                            type="file"
                            id="attachments"
                            name="attachments"
                            onChange={handleAnnouncementFileChange}
                            multiple
                          />
                          <label
                            htmlFor="attachments"
                            className="file-upload-label"
                          >
                            <i className="fas fa-cloud-upload-alt"></i>
                            Choose files to upload
                          </label>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="modal-button cancel-button"
                          onClick={() => setShowAddAnnouncementModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="modal-button submit-button"
                        >
                          {editingAnnouncement
                            ? "Update Announcement"
                            : "Create Announcement"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}
          {activeSection === "announcements" && (
            <section className="management-section">
              <div className="section-header">
                <h2>Announcements Management</h2>
                <button
                  className="add-button"
                  onClick={() => setShowAddAnnouncementModal(true)}
                >
                  <i className="fas fa-plus"></i> Create Announcement
                </button>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-options">
                  <select
                    value={announcementFilter.type}
                    onChange={(e) =>
                      handleAnnouncementFilter("type", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    <option value="general">General</option>
                    <option value="placement">Placement</option>
                    <option value="academic">Academic</option>
                    <option value="event">Event</option>
                  </select>
                  <select
                    value={announcementFilter.visibility}
                    onChange={(e) =>
                      handleAnnouncementFilter("visibility", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">All Visibility</option>
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="tpos">TPOs Only</option>
                  </select>
                </div>
              </div>

              {loading && (
                <div className="loading-message">Loading announcements...</div>
              )}
              {error && <div className="error-message">{error}</div>}

              <div className="announcements-grid">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div key={announcement._id} className="announcement-card">
                      <div className="announcement-header">
                        <h3>{announcement.title}</h3>
                        <span className="announcement-date">
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="announcement-content">
                        <p>{announcement.content}</p>
                        <div className="announcement-meta">
                          <span
                            className={`announcement-badge ${announcement.type}`}
                          >
                            {announcement.type}
                          </span>
                          <span
                            className={`priority-badge ${announcement.priority}`}
                          >
                            {announcement.priority} priority
                          </span>
                        </div>
                      </div>
                      <div className="announcement-actions">
                        <button
                          className="action-button edit"
                          onClick={() => handleEditAnnouncement(announcement)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="action-button delete"
                          onClick={() =>
                            handleAnnouncementDelete(announcement._id)
                          }
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No announcements found</div>
                )}
              </div>

              {/* Add/Edit Announcement Modal */}
              {showAddAnnouncementModal && (
                <div className="modal-overlay">
                  <div className="modal">
                    <h2>
                      {editingAnnouncement
                        ? "Edit Announcement"
                        : "Create New Announcement"}
                    </h2>
                    <form
                      onSubmit={handleAnnouncementSubmit}
                      className="modal-form"
                    >
                      <div className="form-group">
                        <label htmlFor="title">Title*</label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={announcementFormData.title}
                          onChange={handleAnnouncementInputChange}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="type">Type*</label>
                          <select
                            id="type"
                            name="type"
                            value={announcementFormData.type}
                            onChange={handleAnnouncementInputChange}
                            required
                          >
                            <option value="">Select Type</option>
                            <option value="general">General</option>
                            <option value="placement">Placement</option>
                            <option value="academic">Academic</option>
                            <option value="event">Event</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="priority">Priority</label>
                          <select
                            id="priority"
                            name="priority"
                            value={announcementFormData.priority}
                            onChange={handleAnnouncementInputChange}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="visibility">Visibility*</label>
                          <select
                            id="visibility"
                            name="visibility"
                            value={announcementFormData.visibility}
                            onChange={handleAnnouncementInputChange}
                            required
                          >
                            <option value="all">All Users</option>
                            <option value="students">Students Only</option>
                            <option value="tpos">TPOs Only</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="expiryDate">Expiry Date</label>
                          <input
                            type="date"
                            id="expiryDate"
                            name="expiryDate"
                            value={announcementFormData.expiryDate}
                            onChange={handleAnnouncementInputChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="content">Content*</label>
                        <textarea
                          id="content"
                          name="content"
                          value={announcementFormData.content}
                          onChange={handleAnnouncementInputChange}
                          rows="6"
                          required
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>Attachments</label>
                        <div className="file-upload">
                          <input
                            type="file"
                            id="attachments"
                            name="attachments"
                            onChange={handleAnnouncementFileChange}
                            multiple
                          />
                          <label
                            htmlFor="attachments"
                            className="file-upload-label"
                          >
                            <i className="fas fa-cloud-upload-alt"></i>
                            Choose files to upload
                          </label>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="modal-button cancel-button"
                          onClick={() => setShowAddAnnouncementModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="modal-button submit-button"
                        >
                          {editingAnnouncement
                            ? "Update Announcement"
                            : "Create Announcement"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}
          {activeSection === "profile" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Profile Settings</h2>
                <div className="profile-actions">
                  {!editMode ? (
                    <button
                      className="edit-button"
                      onClick={() => setEditMode(true)}
                    >
                      <i className="fas fa-edit"></i> Edit Profile
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button
                        className="cancel-button"
                        onClick={() => setEditMode(false)}
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                      <button
                        className="save-button"
                        onClick={handleSaveChanges}
                      >
                        <i className="fas fa-save"></i> Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {successMessage && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  {successMessage}
                </div>
              )}

              <div className="profile-content">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="profile-title">
                    <h3>{studentData?.name}</h3>
                    <p>{studentData?.usn}</p>
                    <span className="badge">
                      {studentData?.department} - {studentData?.branch}
                    </span>
                  </div>
                </div>

                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={studentData?.name?.split(" ")[0] || ""}
                        onChange={(e) => {
                          const lastName =
                            studentData?.name?.split(" ").slice(1).join(" ") ||
                            "";
                          setStudentData({
                            ...studentData,
                            name: `${e.target.value} ${lastName}`,
                          });
                        }}
                        readOnly={!editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={
                          studentData?.name?.split(" ").slice(1).join(" ") || ""
                        }
                        onChange={(e) => {
                          const firstName =
                            studentData?.name?.split(" ")[0] || "";
                          setStudentData({
                            ...studentData,
                            name: `${firstName} ${e.target.value}`,
                          });
                        }}
                        readOnly={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        pattern="[0-9]{10}"
                        value={studentData?.phone || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            phone: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email address</label>
                      <input
                        type="email"
                        value={studentData?.email || ""}
                        readOnly // Email should not be editable
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={studentData?.city || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            city: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>State/County</label>
                      <input
                        type="text"
                        value={studentData?.state || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            state: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>USN</label>
                      <input
                        type="text"
                        value={studentData?.usn || ""}
                        readOnly // USN should not be editable
                      />
                    </div>
                    <div className="form-group">
                      <label>Branch</label>
                      <input
                        type="text"
                        value={studentData?.branch || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            branch: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        value={studentData?.department || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            department: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>10th Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={
                          studentData?.percentage10 ||
                          studentData?.tenthPercentage ||
                          ""
                        }
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            percentage10: e.target.value,
                            tenthPercentage: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>12th Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={
                          studentData?.percentage12 ||
                          studentData?.twelfthPercentage ||
                          ""
                        }
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            percentage12: e.target.value,
                            twelfthPercentage: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>Degree Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={studentData?.percentageDegree || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            percentageDegree: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Current Semester</label>
                      <input
                        type="text"
                        value={
                          studentData?.currentSemester ||
                          studentData?.semester ||
                          ""
                        }
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            currentSemester: e.target.value,
                            semester: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                    <div className="form-group">
                      <label>Current Semester CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={studentData?.currentSemesterCGPA || ""}
                        onChange={(e) =>
                          setStudentData({
                            ...studentData,
                            currentSemesterCGPA: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Upload Resume</label>
                      {editMode ? (
                        <div className="file-upload-wrapper">
                          <input
                            type="file"
                            id="resume-upload"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            disabled={loading}
                          />
                          <label
                            htmlFor="resume-upload"
                            className="file-upload-button"
                          >
                            {loading && uploadingResume
                              ? "Uploading..."
                              : "Choose File"}
                          </label>
                          <span className="file-name">
                            {selectedFile?.name || "No file chosen"}
                          </span>
                        </div>
                      ) : (
                        <div className="resume-display">
                          {studentData?.resume ? (
                            <div className="resume-info">
                              <button
                                className="download-resume"
                                onClick={handleDownloadResume}
                                disabled={loading}
                              >
                                <i className="fas fa-download"></i>
                                {loading
                                  ? "Downloading..."
                                  : studentData.resume.originalName}
                              </button>
                              <small className="upload-date">
                                Uploaded on:{" "}
                                {new Date(
                                  studentData.resume.uploadDate
                                ).toLocaleDateString()}
                              </small>
                            </div>
                          ) : (
                            <span className="no-resume">
                              No resume uploaded
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    {editMode ? (
                      <>
                        <button
                          className="save-button"
                          onClick={handleSaveChanges}
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          className="cancel-button"
                          onClick={() => setEditMode(false)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          )}{" "}
        </main>
      </div>

      <Footer />

      {/* Exam Details Modal */}
      {showExamDetailsModal && selectedExam && (
        <div className="modal-overlay">
          <div className="modal exam-details-modal">
            <div className="modal-header">
              <h2>Exam Details</h2>
              <button className="close-button" onClick={closeExamDetailsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="exam-details-container">
                <div className="exam-details-header">
                  <h3>{selectedExam.name}</h3>
                  <span
                    className={`exam-type-badge ${selectedExam.type.toLowerCase()}`}
                  >
                    {selectedExam.type}
                  </span>
                </div>

                <div className="exam-details-info">
                  <div className="info-group">
                    <label>Date</label>
                    <p>{formatDate(selectedExam.date)}</p>
                  </div>

                  <div className="info-group">
                    <label>Score</label>
                    <p>
                      <strong>{selectedExam.score}</strong>
                      <span className="max-score">
                        /{selectedExam.maxScore}
                      </span>
                    </p>
                  </div>

                  <div className="info-group">
                    <label>Percentage</label>
                    <div>
                      <div className="percentage-bar-container lg">
                        <div
                          className={`percentage-bar ${
                            selectedExam.isPassed ? "passed" : "failed"
                          }`}
                          style={{ width: `${selectedExam.percentage}%` }}
                        ></div>
                        <span className="percentage-text">
                          {selectedExam.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="info-group">
                    <label>Result</label>
                    <p>
                      <span
                        className={`result-status ${
                          selectedExam.isPassed ? "passed" : "failed"
                        }`}
                      >
                        {selectedExam.isPassed ? "PASSED" : "FAILED"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="exam-details-section">
                  <h4>Performance Analysis</h4>
                  <p className="analysis-text">
                    {selectedExam.isPassed
                      ? `Congratulations! You've successfully passed this ${selectedExam.type.toLowerCase()} exam with a score of ${
                          selectedExam.score
                        }/${selectedExam.maxScore} (${
                          selectedExam.percentage
                        }%).`
                      : `You did not pass this ${selectedExam.type.toLowerCase()} exam. Your score was ${
                          selectedExam.score
                        }/${selectedExam.maxScore} (${
                          selectedExam.percentage
                        }%).`}
                  </p>

                  <p className="recommendation-text">
                    {selectedExam.isPassed
                      ? "Keep up the good work! Continue practicing to maintain your skills."
                      : "We recommend reviewing the material and practicing more before retaking the exam."}
                  </p>
                </div>
              </div>
            </div>{" "}
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={closeExamDetailsModal}
              >
                Close
              </button>
              <button
                className="primary-button"
                onClick={() => handleExportSingleResult(selectedExam)}
              >
                <i className="fas fa-download"></i> Download Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJob && (
        <div className="modal-overlay">
          <div className="modal job-details-modal">
            {/* <div className="modal-header">
              <h2>Job Details</h2>
               <button className="close-button" onClick={closeJobDetailsModal}>
                <i className="fas fa-times"></i>
              </button> 
            </div> */}
            <div className="modal-content">
              <div className="job-details-container">
                {/* Company and Role Header */}
                <h2>Job Details</h2>
                <div className="job-details-header">
                  <div className="company-logo-large">
                    {selectedJob.companyLogo ? (
                      <img
                        src={selectedJob.companyLogo}
                        alt={`${selectedJob.company} logo`}
                      />
                    ) : (
                      <i className="fas fa-building"></i>
                    )}
                  </div>
                  <div className="job-title-info">
                    <h3 className="job-title">{selectedJob.role}</h3>
                    <div className="company-name-large">
                      {selectedJob.companyName}
                    </div>
                    {selectedJob.location && (
                      <div className="job-location-large">
                        <i className="fas fa-map-marker-alt"></i>{" "}
                        {selectedJob.location}
                      </div>
                    )}
                  </div>

                  {/* If we're showing an application, display its status */}
                  {selectedJob.status && (
                    <div className="application-status-large">
                      <span
                        className={`application-status ${selectedJob.status.toLowerCase()}`}
                      >
                        {selectedJob.status === "APPLIED" && (
                          <i className="fas fa-hourglass-half"></i>
                        )}
                        {selectedJob.status === "SHORTLISTED" && (
                          <i className="fas fa-list-ul"></i>
                        )}
                        {selectedJob.status === "INTERVIEW" && (
                          <i className="fas fa-user-tie"></i>
                        )}
                        {selectedJob.status === "SELECTED" && (
                          <i className="fas fa-check-circle"></i>
                        )}
                        {selectedJob.status === "REJECTED" && (
                          <i className="fas fa-times-circle"></i>
                        )}
                        {selectedJob.status}
                      </span>
                      {selectedJob.appliedDate && (
                        <div className="applied-date-info">
                          Applied on {formatDate(selectedJob.appliedDate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Key Details Section */}
                <div className="job-details-section">
                  <h4>Key Details</h4>
                  <div className="job-key-details">
                    <div className="key-detail-item">
                      <div className="detail-icon">
                        <i className="fas fa-money-bill-wave"></i>
                      </div>
                      <div className="detail-content">
                        <label>Package</label>
                        <div className="detail-value">
                          {typeof selectedJob.package === "object" ? (
                            <>
                              {selectedJob.package.basePay && (
                                <div>
                                  {selectedJob.package.basePay} LPA (Base)
                                </div>
                              )}
                              {selectedJob.package.totalCTC && (
                                <div>
                                  {selectedJob.package.totalCTC} LPA (CTC)
                                </div>
                              )}
                            </>
                          ) : (
                            <div>{selectedJob.package} LPA</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedJob.jobType && (
                      <div className="key-detail-item">
                        <div className="detail-icon">
                          <i className="fas fa-briefcase"></i>
                        </div>
                        <div className="detail-content">
                          <label>Job Type</label>
                          <div className="detail-value">
                            {selectedJob.jobType}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedJob.lastDateToApply && (
                      <div className="key-detail-item">
                        <div className="detail-icon">
                          <i className="fas fa-calendar-alt"></i>
                        </div>
                        <div className="detail-content">
                          <label>Application Deadline</label>
                          <div className="detail-value">
                            {formatDate(selectedJob.lastDateToApply)}
                            {new Date(selectedJob.lastDateToApply) <
                            new Date() ? (
                              <span className="deadline-closed">Closed</span>
                            ) : (
                              <span className="deadline-days-left">
                                {Math.ceil(
                                  (new Date(selectedJob.lastDateToApply) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days left
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedJob.positions && (
                      <div className="key-detail-item">
                        <div className="detail-icon">
                          <i className="fas fa-users"></i>
                        </div>
                        <div className="detail-content">
                          <label>Positions</label>
                          <div className="detail-value">
                            {selectedJob.positions}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Description */}
                {selectedJob.description && (
                  <div className="job-details-section">
                    <h4>Job Description</h4>
                    <div className="job-description">
                      {selectedJob.description
                        .split("\n")
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {selectedJob.requirements && (
                  <div className="job-details-section">
                    <h4>Requirements</h4>
                    <div className="job-requirements">
                      <ul>
                        {selectedJob.requirements
                          .split("\n")
                          .map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Eligibility Criteria */}
                {selectedJob.eligibilityCriteria && (
                  <div className="job-details-section">
                    <h4>Eligibility Criteria</h4>
                    <div className="eligibility-criteria">
                      <ul>
                        {Array.isArray(selectedJob.eligibilityCriteria)
                          ? selectedJob.eligibilityCriteria.map(
                              (criteria, index) => (
                                <li key={index}>{criteria}</li>
                              )
                            )
                          : selectedJob.eligibilityCriteria
                              .split("\n")
                              .map((criteria, index) => (
                                <li key={index}>{criteria}</li>
                              ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Application Process */}
                {selectedJob.applicationProcess && (
                  <div className="job-details-section">
                    <h4>Application Process</h4>
                    <div className="application-process">
                      <ol>
                        {Array.isArray(selectedJob.applicationProcess)
                          ? selectedJob.applicationProcess.map(
                              (step, index) => <li key={index}>{step}</li>
                            )
                          : selectedJob.applicationProcess
                              .split("\n")
                              .map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedJob.additionalNotes && (
                  <div className="job-details-section">
                    <h4>Additional Information</h4>
                    <div className="additional-notes">
                      {selectedJob.additionalNotes
                        .split("\n")
                        .map((note, index) => (
                          <p key={index}>{note}</p>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={closeJobDetailsModal}
              >
                Close
              </button>

              {/* Show Apply Button only if the job is available and user hasn't applied */}
              {selectedJob.lastDateToApply &&
                new Date(selectedJob.lastDateToApply) >= new Date() &&
                !selectedJob.hasApplied &&
                !selectedJob.status && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      closeJobDetailsModal();
                      handleApplyJob(selectedJob._id);
                    }}
                  >
                    <i className="fas fa-paper-plane"></i> Apply Now
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function calculateOverallAverage(examData) {
  const allScores = [
    ...examData.aptitude,
    ...examData.programming,
    ...examData.english,
  ].map((test) => (test.score / test.maxScore) * 100);

  if (allScores.length === 0) return "0%";

  const average = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  return `${average.toFixed(1)}%`;
}

function calculateTotalTests(examData) {
  return (
    examData.aptitude.length +
    examData.programming.length +
    examData.english.length
  );
}

export default StudentDashboard;
