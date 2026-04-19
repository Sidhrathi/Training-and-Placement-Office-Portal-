import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Modal,
  Button,
  Form,
  Tab,
  Nav,
  Dropdown,
} from "react-bootstrap";
import {
  FaUsers,
  FaUserTie,
  FaBriefcase,
  FaGraduationCap,
  FaEye,
  FaEdit,
  FaCheck,
  FaTimes,
  FaEllipsisV,
  FaFilePdf,
} from "react-icons/fa";
import Header from "./Header";
import Footer from "./footer";
import JobDriveModal from "./JobDriveModal";
import api from "../services/api";
import tpoService from "../services/tpoService";
import "../styles/TPODashboard.css";
import "../styles/ExamDropdown.css";
import "../styles/ExamModals.css";
import "../styles/JobModal.css";

const TPODashboard = () => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTPOs: 0,
    activeJobs: 0,
    examsCount: 0,
  });
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [academicFilters, setAcademicFilters] = useState({
    minTenthPercentage: "",
    minTwelfthPercentage: "",
    minDegreePercentage: "",
    minCGPA: "",
    maxBacklogs: "",
  });
  const [branchFilter, setBranchFilter] = useState("");
  const [placementStatusFilter, setPlacementStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state variables for student view and update
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updatedPlacementStatus, setUpdatedPlacementStatus] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Department options based on the seed script
  const departmentOptions = [
    "MCA Department",
    "Computer Applications",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electronics and Communication",
    "Electrical Engineering",
    "Information Science",
    "Artificial Intelligence",
    "Data Science",
  ];

  // Branch options based on the seed script
  const branchOptions = [
    "Computer Science",
    "Information Technology",
    "Data Science",
    "AI & ML",
    "Cloud Computing",
  ];
  const [exams, setExams] = useState([]);
  const [examSearch, setExamSearch] = useState("");
  const [examStatusFilter, setExamStatusFilter] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [showViewExamModal, setShowViewExamModal] = useState(false);
  const [showManageQuestionsModal, setShowManageQuestionsModal] =
    useState(false);
  const [showViewResultsModal, setShowViewResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedResultsData, setSelectedResultsData] = useState([]);
  const [examFormData, setExamFormData] = useState({
    title: "",
    description: "",
    type: "Aptitude",
    duration: 60,
    passingPercentage: 60,
    startDate: "",
    endDate: "",
    status: "Draft",
    eligibility: {
      departments: [],
      branches: [],
      semesters: [],
      minCGPA: "",
      minPercentage: "",
      maxBacklogs: "",
    },
    instructions: "",
  });
  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 1,
  });
  const [questions, setQuestions] = useState([]);
  const [examActionSuccess, setExamActionSuccess] = useState("");
  const [examActionError, setExamActionError] = useState("");
  const [isExamLoading, setIsExamLoading] = useState(false);

  // Exam types and status options
  const examTypes = [
    "Aptitude",
    "Technical",
    "Verbal",
    "Coding",
    "Mock Interview",
    "Personality",
  ];
  const examStatusOptions = [
    "All",
    "Draft",
    "Scheduled",
    "Active",
    "Completed",
    "Archived",
  ];

  // Sample semester options for eligibility
  const semesterOptions = [
    { value: "1", label: "1st Semester" },
    { value: "2", label: "2nd Semester" },
    { value: "3", label: "3rd Semester" },
    { value: "4", label: "4th Semester" },
    { value: "5", label: "5th Semester" },
    { value: "6", label: "6th Semester" },
    { value: "7", label: "7th Semester" },
    { value: "8", label: "8th Semester" },
  ];

  // Job Drive States
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    companyName: "",
    companyWebsite: "",
    jobRole: "",
    category: "IT",
    description: "",
    package: {
      basePay: "",
      totalCTC: "",
    },
    location: "",
    type: "full-time",
    eligibility: {
      branches: [],
      minCGPA: "",
      maxBacklogs: 0,
      minTenthPercentage: "",
      minTwelfthPercentage: "",
      otherRequirements: [],
    },
    driveDetails: {
      startDate: "",
      lastDateToApply: "",
      rounds: [],
    },
    status: "published",
  });
  const [jobDrives, setJobDrives] = useState([]);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState({
    status: "",
  });
  const [showJobModal, setShowJobModal] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Announcement Management State
  const [announcements, setAnnouncements] = useState([]);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementFilter, setAnnouncementFilter] = useState({
    type: '',
    visibility: ''
  });
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    type: '',
    priority: 'low',
    visibility: 'all',
    content: '',
    expiryDate: '',
    attachments: []
  });
  const [announcementSearchQuery, setAnnouncementSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/tpo-login");
      return;
    }

    if (activeSection === "dashboard") {
      fetchDashboardData();
    }
  }, [activeSection, navigate]);

  // Separate useEffect for student filtering
  useEffect(() => {
    if (activeSection === "manage-students") {
      const delayDebounceFn = setTimeout(() => {
        fetchStudents();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [
    activeSection,
    searchQuery,
    departmentFilter,
    semesterFilter,
    branchFilter,
    placementStatusFilter,
    academicFilters,
  ]);

  // Exam API functions
  useEffect(() => {
    if (activeSection === "exams") {
      fetchExams();
    }
  }, [activeSection, examSearch, examStatusFilter, examTypeFilter]);

  // Announcement API functions
  useEffect(() => {
    if (activeSection === "announcements") {
      fetchAnnouncements();
    }
  }, [activeSection, announcementSearchQuery, announcementFilter]);

  const fetchExams = async () => {
    try {
      setIsExamLoading(true);
      setExamActionError("");

      // Create query params for GET request instead of POST
      const params = new URLSearchParams();
      if (examSearch) params.append("search", examSearch);
      if (examStatusFilter && examStatusFilter !== "All")
        params.append("status", examStatusFilter);
      if (examTypeFilter) params.append("type", examTypeFilter);

      // Use GET request with query params
      const response = await api.get(`/tpo/exams?${params.toString()}`);

      if (response.data && Array.isArray(response.data)) {
        setExams(response.data);
      } else if (response.data && response.data.data) {
        // Handle case where API returns data in a nested structure
        setExams(response.data.data);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      setExamActionError("Failed to fetch exams. Please try again.");
    } finally {
      setIsExamLoading(false);
    }
  };

  const fetchQuestions = async (examId) => {
    try {
      setIsExamLoading(true);
      const response = await api.get(`/tpo/exams/${examId}/questions`);
      setQuestions(response.data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setExamActionError("Failed to fetch questions. Please try again.");
    } finally {
      setIsExamLoading(false);
    }
  };

  const fetchExamResults = async (examId) => {
    try {
      setIsExamLoading(true);
      const response = await api.get(`/tpo/exams/${examId}/results`);
      setSelectedResultsData(response.data || []);
    } catch (error) {
      console.error("Error fetching exam results:", error);
      setExamActionError("Failed to fetch exam results. Please try again.");
    } finally {
      setIsExamLoading(false);
    }
  };

  // Announcement handlers
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      let response;
      if (announcementSearchQuery) {
        response = await tpoService.searchAnnouncements(announcementSearchQuery);
      } else {
        response = await tpoService.getAllAnnouncements();
      }
      
      let announcementsList = response.data || [];
      
      // Apply filters
      if (announcementFilter.type) {
        announcementsList = announcementsList.filter(a => a.type === announcementFilter.type);
      }
      if (announcementFilter.visibility) {
        announcementsList = announcementsList.filter(a => a.visibility === announcementFilter.visibility);
      }
      
      setAnnouncements(announcementsList);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError("Failed to fetch announcements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingAnnouncement) {
        await tpoService.updateAnnouncement(editingAnnouncement._id, announcementFormData);
      } else {
        await tpoService.createAnnouncement(announcementFormData);
      }
      await fetchAnnouncements();
      setShowAddAnnouncementModal(false);
      setAnnouncementFormData({
        title: '',
        type: '',
        priority: 'low',
        visibility: 'all',
        content: '',
        expiryDate: '',
        attachments: []
      });
      setEditingAnnouncement(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        setLoading(true);
        await tpoService.deleteAnnouncement(id);
        await fetchAnnouncements();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete announcement');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementFormData({
      title: announcement.title,
      type: announcement.type,
      priority: announcement.priority,
      visibility: announcement.visibility,
      content: announcement.content,
      expiryDate: announcement.expiryDate ? announcement.expiryDate.split('T')[0] : '',
      attachments: announcement.attachments || []
    });
    setShowAddAnnouncementModal(true);
  };

  const handleAnnouncementInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnnouncementFilter = (filterType, value) => {
    setAnnouncementFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/tpo/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 401) {
        navigate("/tpo-login");
      }
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only include filters that have values
      const filters = {
        ...(searchQuery && { search: searchQuery }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(branchFilter && { branch: branchFilter }),
        ...(semesterFilter && { semester: semesterFilter }),
        ...(placementStatusFilter && {
          placementStatus: placementStatusFilter,
        }),
        ...(academicFilters.minTenthPercentage && {
          minTenthPercentage: academicFilters.minTenthPercentage,
        }),
        ...(academicFilters.minTwelfthPercentage && {
          minTwelfthPercentage: academicFilters.minTwelfthPercentage,
        }),
        ...(academicFilters.minDegreePercentage && {
          minDegreePercentage: academicFilters.minDegreePercentage,
        }),
        ...(academicFilters.minCGPA && { minCGPA: academicFilters.minCGPA }),
        ...(academicFilters.maxBacklogs !== "" && {
          maxBacklogs: academicFilters.maxBacklogs,
        }),
      };

      const response = await api.post("/tpo/students/filter", filters);
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      if (error.response?.status === 401) {
        navigate("/tpo-login");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to fetch students. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAcademicFilterChange = (e) => {
    const { name, value } = e.target;
    setAcademicFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/tpo-login");
  };

  const handleExportData = async () => {
    try {
      setLoading(true);

      // Create query params from current filters
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (departmentFilter) params.append("department", departmentFilter);
      if (branchFilter) params.append("branch", branchFilter);
      if (semesterFilter) params.append("semester", semesterFilter);
      if (placementStatusFilter)
        params.append("placementStatus", placementStatusFilter);

      // Add academic filters
      if (academicFilters.minTenthPercentage)
        params.append("minTenthPercentage", academicFilters.minTenthPercentage);
      if (academicFilters.minTwelfthPercentage)
        params.append(
          "minTwelfthPercentage",
          academicFilters.minTwelfthPercentage
        );
      if (academicFilters.minDegreePercentage)
        params.append(
          "minDegreePercentage",
          academicFilters.minDegreePercentage
        );
      if (academicFilters.minCGPA)
        params.append("minCGPA", academicFilters.minCGPA);
      if (academicFilters.maxBacklogs !== "")
        params.append("maxBacklogs", academicFilters.maxBacklogs);

      const response = await api.get(
        `/tpo/students/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Add timestamp to filename
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      link.setAttribute("download", `students_data_${timestamp}.csv`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to export student data. Please try again.");
      console.error("Export error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleUpdateStudent = (student) => {
    setSelectedStudent(student);
    setUpdatedPlacementStatus(student.placementStatus || "");
    setShowUpdateModal(true);
  };

  const handleUpdatePlacementStatus = async () => {
    try {
      setLoading(true);
      setUpdateError("");
      setUpdateSuccess(false);

      const response = await api.put(
        `/tpo/students/${selectedStudent._id}/update-placement-status`,
        {
          placementStatus: updatedPlacementStatus,
        }
      );

      setUpdateSuccess(true);
      setShowUpdateModal(false);
      fetchStudents();
    } catch (error) {
      setUpdateError("Failed to update placement status. Please try again.");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("");
    setBranchFilter("");
    setSemesterFilter("");
    setPlacementStatusFilter("");
    setAcademicFilters({
      minTenthPercentage: "",
      minTwelfthPercentage: "",
      minDegreePercentage: "",
      minCGPA: "",
      maxBacklogs: "",
    });
  };

  const handleExamSearch = (e) => {
    setExamSearch(e.target.value);
  };

  const handleExamFormChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("eligibility.")) {
      const eligibilityField = name.split(".")[1];
      setExamFormData({
        ...examFormData,
        eligibility: {
          ...examFormData.eligibility,
          [eligibilityField]: value,
        },
      });
    } else {
      setExamFormData({
        ...examFormData,
        [name]: value,
      });
    }
  };

  const handleMultiSelectChange = (fieldName, selectedOptions) => {
    setExamFormData({
      ...examFormData,
      eligibility: {
        ...examFormData.eligibility,
        [fieldName]: selectedOptions,
      },
    });
  };

  const handleQuestionFormChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name === "options" && index !== null) {
      const updatedOptions = [...questionFormData.options];
      updatedOptions[index] = value;

      setQuestionFormData({
        ...questionFormData,
        options: updatedOptions,
      });
    } else {
      setQuestionFormData({
        ...questionFormData,
        [name]: value,
      });
    }
  };

  const resetExamForm = () => {
    setExamFormData({
      title: "",
      description: "",
      type: "Aptitude",
      duration: 60,
      passingPercentage: 60,
      startDate: "",
      endDate: "",
      status: "Draft",
      eligibility: {
        departments: [],
        branches: [],
        semesters: [],
        minCGPA: "",
        minPercentage: "",
        maxBacklogs: "",
      },
      instructions: "",
    });
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      question: "",
      options: ["", "", "", ""],
      correctOption: 0,
      marks: 1,
    });
  };

  const handleCreateExam = async () => {
    try {
      setIsExamLoading(true);
      setExamActionError("");
      setExamActionSuccess("");

      const response = await api.post("/tpo/exams", examFormData);
      setExamActionSuccess("Exam created successfully!");
      // No need to hide modal anymore as we navigate to a separate page for creating exams
      resetExamForm();
      fetchExams();
    } catch (error) {
      console.error("Error creating exam:", error);
      setExamActionError(
        "Failed to create exam. Please check all fields and try again."
      );
    } finally {
      setIsExamLoading(false);
    }
  };

  const handleUpdateExam = async () => {
    try {
      setIsExamLoading(true);
      setExamActionError("");
      setExamActionSuccess("");

      await api.put(`/tpo/exams/${selectedExam._id}`, examFormData);

      setExamActionSuccess("Exam updated successfully!");
      setShowEditExamModal(false);
      resetExamForm();
      fetchExams();
    } catch (error) {
      console.error("Error updating exam:", error);
      setExamActionError(
        "Failed to update exam. Please check all fields and try again."
      );
    } finally {
      setIsExamLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this exam? This action cannot be undone."
      )
    ) {
      try {
        setIsExamLoading(true);
        setExamActionError("");

        await api.delete(`/tpo/exams/${examId}`);

        setExamActionSuccess("Exam deleted successfully!");
        fetchExams();
      } catch (error) {
        console.error("Error deleting exam:", error);
        setExamActionError("Failed to delete exam. Please try again.");
      } finally {
        setIsExamLoading(false);
      }
    }
  };

  const handleAddQuestion = async () => {
    try {
      setIsExamLoading(true);
      setExamActionError("");

      await api.post(
        `/tpo/exams/${selectedExam._id}/questions`,
        questionFormData
      );

      setExamActionSuccess("Question added successfully!");
      resetQuestionForm();
      fetchQuestions(selectedExam._id);
    } catch (error) {
      console.error("Error adding question:", error);
      setExamActionError(
        "Failed to add question. Please check all fields and try again."
      );
    } finally {
      setIsExamLoading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    try {
      setIsExamLoading(true);
      setExamActionError("");

      await api.put(
        `/tpo/exams/${selectedExam._id}/questions/${selectedQuestion._id}`,
        questionFormData
      );

      setExamActionSuccess("Question updated successfully!");
      setSelectedQuestion(null);
      resetQuestionForm();
      fetchQuestions(selectedExam._id);
    } catch (error) {
      console.error("Error updating question:", error);
      setExamActionError(
        "Failed to update question. Please check all fields and try again."
      );
    } finally {
      setIsExamLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this question? This action cannot be undone."
      )
    ) {
      try {
        setIsExamLoading(true);
        setExamActionError("");

        await api.delete(
          `/tpo/exams/${selectedExam._id}/questions/${questionId}`
        );

        setExamActionSuccess("Question deleted successfully!");
        fetchQuestions(selectedExam._id);
      } catch (error) {
        console.error("Error deleting question:", error);
        setExamActionError("Failed to delete question. Please try again.");
      } finally {
        setIsExamLoading(false);
      }
    }
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setExamFormData({
      title: exam.title,
      description: exam.description || "",
      type: exam.type || "Aptitude",
      duration: exam.duration || 60,
      passingPercentage: exam.passingPercentage || 60,
      startDate: exam.startDate
        ? new Date(exam.startDate).toISOString().split("T")[0]
        : "",
      endDate: exam.endDate
        ? new Date(exam.endDate).toISOString().split("T")[0]
        : "",
      status: exam.status || "Draft",
      eligibility: {
        departments: exam.eligibility?.departments || [],
        branches: exam.eligibility?.branches || [],
        semesters: exam.eligibility?.semesters || [],
        minCGPA: exam.eligibility?.minCGPA || "",
        minPercentage: exam.eligibility?.minPercentage || "",
        maxBacklogs: exam.eligibility?.maxBacklogs || "",
      },
      instructions: exam.instructions || "",
    });
    setShowEditExamModal(true);
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setShowViewExamModal(true);
  };

  const handleManageQuestions = (exam) => {
    setSelectedExam(exam);
    fetchQuestions(exam._id);
    setShowManageQuestionsModal(true);
  };

  const handleViewResults = (exam) => {
    setSelectedExam(exam);
    fetchExamResults(exam._id);
    setShowViewResultsModal(true);
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setQuestionFormData({
      question: question.question,
      options: question.options,
      correctOption: question.correctOption,
      marks: question.marks || 1,
    });
  };

  const handleCancelEditQuestion = () => {
    setSelectedQuestion(null);
    resetQuestionForm();
  };

  const handlePublishExam = async (examId) => {
    try {
      setIsExamLoading(true);
      setExamActionError("");

      await api.put(`/tpo/exams/${examId}/publish`);

      setExamActionSuccess("Exam published successfully!");
      fetchExams();
    } catch (error) {
      console.error("Error publishing exam:", error);
      setExamActionError(
        "Failed to publish exam. Please ensure the exam has questions and try again."
      );
    } finally {
      setIsExamLoading(false);
    }
  };

  const handleExportResults = async (examId) => {
    try {
      setIsExamLoading(true);

      const response = await api.get(`/tpo/exams/${examId}/results/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Add timestamp to filename
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      link.setAttribute("download", `exam_results_${timestamp}.csv`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting results:", error);
      setExamActionError("Failed to export results. Please try again.");
    } finally {
      setIsExamLoading(false);
    }
  };

  const handleClearExamFilters = () => {
    setExamSearch("");
    setExamStatusFilter("");
    setExamTypeFilter("");
  }; // Function to handle creating a new exam
  const handleCreateNewExam = () => {
    // Navigate to the exam creation page instead of showing a modal
    navigate("/create-exam");
  };

  // Convert stats to array format for rendering
  const statsArray = [
    {
      id: 1,
      title: "Total Students",
      count: stats.totalStudents,
      icon: "users",
    },
    { id: 2, title: "Total TPOs", count: stats.totalTPOs, icon: "user-tie" },
    {
      id: 3,
      title: "Active Job Drives",
      count: stats.activeJobs,
      icon: "briefcase",
    },
    {
      id: 4,
      title: "Exams Conducted",
      count: stats.examsCount,
      icon: "clipboard-list",
    },
  ];

  // Job Drive Functions
  const handleJobInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setJobFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setJobFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBranchSelection = (e) => {
    const { checked, value } = e.target;
    setJobFormData((prev) => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        branches: checked
          ? [...prev.eligibility.branches, value]
          : prev.eligibility.branches.filter((branch) => branch !== value),
      },
    }));
  };

  const handleAddRound = () => {
    setJobFormData((prev) => ({
      ...prev,
      driveDetails: {
        ...prev.driveDetails,
        rounds: [
          ...prev.driveDetails.rounds,
          {
            roundNumber: prev.driveDetails.rounds.length + 1,
            type: "",
            description: "",
            date: "",
            venue: "",
          },
        ],
      },
    }));
  };

  const handleRoundChange = (index, field, value) => {
    setJobFormData((prev) => ({
      ...prev,
      driveDetails: {
        ...prev.driveDetails,
        rounds: prev.driveDetails.rounds.map((round, i) =>
          i === index ? { ...round, [field]: value } : round
        ),
      },
    }));
  };

  const handleRemoveRound = (index) => {
    setJobFormData((prev) => ({
      ...prev,
      driveDetails: {
        ...prev.driveDetails,
        rounds: prev.driveDetails.rounds.filter((_, i) => i !== index),
      },
    }));
  };

  const resetJobForm = () => {
    setJobFormData({
      companyName: "",
      companyWebsite: "",
      jobRole: "",
      category: "IT",
      description: "",
      package: {
        basePay: "",
        totalCTC: "",
      },
      location: "",
      type: "full-time",
      eligibility: {
        branches: [],
        minCGPA: "",
        maxBacklogs: 0,
        minTenthPercentage: "",
        minTwelfthPercentage: "",
        otherRequirements: [],
      },
      driveDetails: {
        startDate: "",
        lastDateToApply: "",
        rounds: [],
      },
      status: "published",
    });
  };
  const handleSubmitJobDrive = async (e) => {
    if (e) e.preventDefault();
    try {
      const response = await api.get("/tpo/jobs", jobFormData);
      setJobDrives((prev) => [...prev, response.data]);
      setShowAddJobModal(false);
      resetJobForm();
    } catch (error) {
      console.error("Error creating job drive:", error);
    }
  };

  const handleViewApplicants = async (job) => {
    try {
      setLoadingApplicants(true);
      setCurrentJob(job);
      setShowApplicantsModal(true);

      const response = await api.get(`/jobs/${job._id}/applicants`);
      // Handle both old format (array) and new format (object with applicants array)
      if (response.data && Array.isArray(response.data)) {
        setApplicants(response.data);
      } else if (response.data && response.data.applicants) {
        setApplicants(response.data.applicants);
      } else {
        setApplicants([]);
      }
    } catch (error) {
      console.error("Error fetching job applicants:", error);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };
  const handleViewJob = async (job) => {
    try {
      setLoadingApplicants(true);
      setCurrentJob(job);
      setShowJobModal(true);

      const response = await api.get(`/jobs/${job._id}`);
      const jobDetails = response.data;
      setApplicants(jobDetails.applications || []);
    } catch (error) {
      console.error("Error fetching job applicants:", error);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleEditJob = (job) => {
    // Redirect to edit job page with job ID
    navigate(`/edit-job-drive/${job._id}`);
  };

  const handleDeleteJobConfirmation = (job) => {
    setCurrentJob(job);
    setShowDeleteModal(true);
  };

  const handleDeleteJob = async () => {
    if (!currentJob) return;

    try {
      await api.delete(`/tpo/jobs/${currentJob._id}`);
      setJobDrives((prevJobs) =>
        prevJobs.filter((job) => job._id !== currentJob._id)
      );
      setShowDeleteModal(false);
      setCurrentJob(null);
    } catch (error) {
      console.error("Error deleting job drive:", error);
    }
  };

  const handleUpdateApplicationStatus = async (jobId, studentId) => {
    try {
      const newStatus = prompt(
        "Enter new status (pending, shortlisted, rejected, selected):"
      );
      if (!newStatus) return;

      await api.put(`/jobs/${jobId}/applications/${studentId}`, {
        status: newStatus.toLowerCase(),
      });

      // Refresh the applicants list
      const response = await api.get(`/jobs/${jobId}/applicants`);
      // Handle both old format (array) and new format (object with applicants array)
      if (response.data && Array.isArray(response.data)) {
        setApplicants(response.data);
      } else if (response.data && response.data.applicants) {
        setApplicants(response.data.applicants);
      } else {
        setApplicants([]);
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update application status. Please try again.");
    }
  };

  const handleViewResume = async (studentId, studentName) => {
    try {
      const response = await tpoService.viewStudentResume(studentId);

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${studentName}_resume.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Get content type from response
      const contentType = response.headers['content-type'] || 'application/pdf';
      
      // Create a blob URL
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // For PDF files, open in new tab; for other files, download
      if (contentType === 'application/pdf' || contentType.includes('pdf')) {
        // Open PDF in new tab
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          // If popup blocked, fall back to download
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Download other file types
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Clean up after a delay to allow the file to open/download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error viewing resume:", error);
      if (error.response?.status === 404) {
        alert("Resume not found for this student.");
      } else if (error.response?.status === 401) {
        alert("You are not authorized to view this resume. Please log in again.");
      } else if (error.response?.status === 403) {
        alert("You do not have permission to view this resume.");
      } else {
        alert(`Failed to view resume: ${error.response?.data?.message || error.message || 'Please try again.'}`);
      }
    }
  };

  const handleClearJobFilters = () => {
    setJobFilter({ status: "" });
    setJobSearchQuery("");
  };

  // Fetch job drives when the section changes
  useEffect(() => {
    if (activeSection === "job-drives") {
      const fetchJobDrives = async () => {
        try {
          const response = await api.get("/tpo/jobs");
          setJobDrives(response.data);
          console.log(response.data);
        } catch (error) {
          console.error("Error fetching job drives:", error);
        }
      };
      fetchJobDrives();
    }
  }, [activeSection]);

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        {/* TPO Profile Icon */}
        <div className="tpo-profile">
          <button
            className="tpo-icon"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <i className="fas fa-user-tie"></i>
            <span>TPO</span>
            <i
              className={`fas fa-chevron-${
                showProfileDropdown ? "up" : "down"
              }`}
            ></i>
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <i className="fas fa-user-tie"></i>
                <span>TPO Panel</span>
              </div>
              <div className="dropdown-divider"></div>
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
                activeSection === "manage-students" ? "active" : ""
              }`}
              onClick={() => setActiveSection("manage-students")}
            >
              <i className="fas fa-user-graduate"></i>
              <span>Manage Students</span>
            </Link>
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "announcements" ? "active" : ""
              }`}
              onClick={() => setActiveSection("announcements")}
            >
              <i className="fas fa-bullhorn"></i>
              <span>Announcements</span>
            </Link>
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "job-drives" ? "active" : ""
              }`}
              onClick={() => setActiveSection("job-drives")}
            >
              <i className="fas fa-briefcase"></i>
              <span>Job Drives</span>
            </Link>
            <Link
              to="#"
              className={`nav-item ${
                activeSection === "exams" ? "active" : ""
              }`}
              onClick={() => setActiveSection("exams")}
            >
              <i className="fas fa-file-alt"></i>
              <span>Exams</span>
            </Link>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="dashboard-main">
          {activeSection === "dashboard" && (
            <div className="stats-container">
              {statsArray.map((stat) => (
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
          )}
          {activeSection === "manage-students" && (
            <section className="management-section">
              <div className="section-header">
                <h2>Student Management</h2>
                <div className="header-actions">
                  <button
                    className="clear-filter-button"
                    onClick={handleClearFilters}
                  >
                    <i className="fas fa-filter-circle-xmark"></i> Clear Filters
                  </button>
                  <button className="export-button" onClick={handleExportData}>
                    <i className="fas fa-download"></i> Export Data
                  </button>
                </div>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search students by name, USN, or email..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-section">
                  <div className="filter-row">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Departments</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>

                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Branches</option>
                      {branchOptions.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>

                    <select
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                      <option value="3">3rd Semester</option>
                      <option value="4">4th Semester</option>
                      <option value="5">5th Semester</option>
                      <option value="6">6th Semester</option>
                      <option value="7">7th Semester</option>
                      <option value="8">8th Semester</option>
                    </select>

                    <select
                      value={placementStatusFilter}
                      onChange={(e) => setPlacementStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Placement Status</option>
                      <option value="Not Placed">Not Placed</option>
                      <option value="Placed">Placed</option>
                      <option value="Offered">Offered</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                  <div className="filter-row academic-filters">
                    <input
                      type="number"
                      placeholder="Min 10th %"
                      name="minTenthPercentage"
                      value={academicFilters.minTenthPercentage}
                      onChange={handleAcademicFilterChange}
                      className="filter-input"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Min 12th %"
                      name="minTwelfthPercentage"
                      value={academicFilters.minTwelfthPercentage}
                      onChange={handleAcademicFilterChange}
                      className="filter-input"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Min Degree %"
                      name="minDegreePercentage"
                      value={academicFilters.minDegreePercentage}
                      onChange={handleAcademicFilterChange}
                      className="filter-input"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Min CGPA"
                      name="minCGPA"
                      value={academicFilters.minCGPA}
                      onChange={handleAcademicFilterChange}
                      className="filter-input"
                      min="0"
                      max="10"
                      step="0.01"
                    />
                    <select
                      name="maxBacklogs"
                      value={academicFilters.maxBacklogs}
                      onChange={handleAcademicFilterChange}
                      className="filter-select"
                    >
                      <option value="">Max Backlogs</option>
                      <option value="0">No Backlogs</option>
                      <option value="1">≤ 1 Backlog</option>
                      <option value="2">≤ 2 Backlogs</option>
                      <option value="3">≤ 3 Backlogs</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading students data...</p>
                </div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>USN</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Department</th>
                        <th>Branch</th>
                        <th>Semester</th>
                        <th>10th %</th>
                        <th>12th %</th>
                        <th>Degree %</th>
                        <th>CGPA</th>
                        <th>Backlogs</th>
                        <th>Placement Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <tr key={student._id}>
                            <td>{student.name}</td>
                            <td>{student.usn}</td>
                            <td>{student.email}</td>
                            <td>{student.phoneNumber}</td>
                            <td>{student.department}</td>
                            <td>{student.branch}</td>
                            <td>{student.semester}</td>
                            <td>{student.tenthPercentage}%</td>
                            <td>{student.twelfthPercentage}%</td>
                            <td>{student.degreePercentage}%</td>
                            <td>{student.cgpa}</td>
                            <td>{student.backlogs}</td>
                            <td>
                              <span
                                className={`status-badge ${(
                                  student.placementStatus || "not-placed"
                                )
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {student.placementStatus || "Not Placed"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="action-button view"
                                onClick={() => handleViewStudent(student)}
                              >
                                <FaEye />
                              </button>
                              <button
                                className="action-button edit"
                                onClick={() => handleUpdateStudent(student)}
                              >
                                <FaEdit />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="14" className="no-data">
                            No student records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {/* View Student Modal */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>View Student</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedStudent && (
                <div className="student-details">
                  <p>
                    <strong>Name:</strong> {selectedStudent.name}
                  </p>
                  <p>
                    <strong>USN:</strong> {selectedStudent.usn}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedStudent.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedStudent.phoneNumber}
                  </p>
                  <p>
                    <strong>Department:</strong> {selectedStudent.department}
                  </p>
                  <p>
                    <strong>Branch:</strong> {selectedStudent.branch}
                  </p>
                  <p>
                    <strong>Semester:</strong> {selectedStudent.semester}
                  </p>
                  <p>
                    <strong>10th Percentage:</strong>{" "}
                    {selectedStudent.tenthPercentage}%
                  </p>
                  <p>
                    <strong>12th Percentage:</strong>{" "}
                    {selectedStudent.twelfthPercentage}%
                  </p>
                  <p>
                    <strong>Degree Percentage:</strong>{" "}
                    {selectedStudent.degreePercentage}%
                  </p>
                  <p>
                    <strong>CGPA:</strong> {selectedStudent.cgpa}
                  </p>
                  <p>
                    <strong>Backlogs:</strong> {selectedStudent.backlogs}
                  </p>
                  <p>
                    <strong>Placement Status:</strong>{" "}
                    {selectedStudent.placementStatus || "Not Placed"}
                  </p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          {/* Update Student Modal */}
          <Modal
            show={showUpdateModal}
            onHide={() => setShowUpdateModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Update Placement Status</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedStudent && (
                <Form>
                  <Form.Group controlId="formPlacementStatus">
                    <Form.Label>Placement Status</Form.Label>
                    <Form.Control
                      as="select"
                      value={updatedPlacementStatus}
                      onChange={(e) =>
                        setUpdatedPlacementStatus(e.target.value)
                      }
                    >
                      <option value="">Select Status</option>
                      <option value="Not Placed">Not Placed</option>
                      <option value="Placed">Placed</option>
                      <option value="Offered">Offered</option>
                      <option value="Declined">Declined</option>
                    </Form.Control>
                  </Form.Group>
                  {updateError && (
                    <p className="error-message">{updateError}</p>
                  )}
                  {updateSuccess && (
                    <p className="success-message">
                      Placement status updated successfully!
                    </p>
                  )}
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowUpdateModal(false)}
              >
                Close
              </Button>
              <Button variant="primary" onClick={handleUpdatePlacementStatus}>
                Update
              </Button>
            </Modal.Footer>
          </Modal>
          {/* 3. Announcements & Notifications Section */}
          {activeSection === "announcements" && (
            <section className="management-section">
              <div className="section-header">
                <h2>Announcements & Notifications</h2>
                <div className="header-actions">
                  <button 
                    className="add-button"
                    onClick={() => {
                      setEditingAnnouncement(null);
                      setAnnouncementFormData({
                        title: '',
                        type: '',
                        priority: 'low',
                        visibility: 'all',
                        content: '',
                        expiryDate: '',
                        attachments: []
                      });
                      setShowAddAnnouncementModal(true);
                    }}
                  >
                    <i className="fas fa-plus"></i> Add New Announcement
                  </button>
                </div>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search announcements by title or content..."
                    value={announcementSearchQuery}
                    onChange={(e) => setAnnouncementSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-section">
                  <div className="filter-row">
                    <select 
                      className="filter-select"
                      value={announcementFilter.type}
                      onChange={(e) => handleAnnouncementFilter('type', e.target.value)}
                    >
                      <option value="">All Categories</option>
                      <option value="general">General</option>
                      <option value="placement">Placement</option>
                      <option value="academic">Academic</option>
                      <option value="event">Event</option>
                    </select>

                    <select 
                      className="filter-select"
                      value={announcementFilter.visibility}
                      onChange={(e) => handleAnnouncementFilter('visibility', e.target.value)}
                    >
                      <option value="">All Visibility</option>
                      <option value="all">All Users</option>
                      <option value="students">Students Only</option>
                      <option value="tpos">TPOs Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading && <div className="loading-message">Loading announcements...</div>}
              {error && <div className="error-message">{error}</div>}

              <div className="announcements-grid">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div key={announcement._id} className="announcement-card">
                      <div className="announcement-header">
                        <h3>{announcement.title}</h3>
                        <span className="announcement-date">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="announcement-content">
                        <p>{announcement.content}</p>
                        <div className="announcement-meta">
                          <span className={`announcement-badge ${announcement.type}`}>
                            {announcement.type}
                          </span>
                          <span className={`priority-badge ${announcement.priority}`}>
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
                          onClick={() => handleAnnouncementDelete(announcement._id)}
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
                <div className="modal-overlay" onClick={() => setShowAddAnnouncementModal(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                      <button 
                        className="close-button"
                        onClick={() => setShowAddAnnouncementModal(false)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <form onSubmit={handleAnnouncementSubmit} className="modal-form">
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

                      <div className="modal-actions">
                        <button 
                          type="button"
                          className="btn-secondary"
                          onClick={() => setShowAddAnnouncementModal(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Create')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}
          {/* 4. Job Drives Management Section */}
          {activeSection === "job-drives" && (
            <section className="management-section">
              {" "}
              <div className="section-header">
                <h2>Job Drives Management</h2>
                <div className="header-actions">
                  <button
                    className="clear-filter-button"
                    onClick={handleClearJobFilters}
                  >
                    <i className="fas fa-filter-circle-xmark"></i> Clear Filters
                  </button>
                  <button
                    className="add-button"
                    onClick={() => navigate("/add-job-drive")}
                  >
                    <i className="fas fa-plus"></i> Add New Job Drive
                  </button>
                </div>
              </div>
              <div className="search-container">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search job drives by company, role, or location..."
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>{" "}
                <div className="filter-section">
                  <div className="filter-row">
                    <select
                      value={jobFilter.status}
                      onChange={(e) =>
                        setJobFilter({ ...jobFilter, status: e.target.value })
                      }
                      className="filter-select"
                    >
                      <option value="">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>{" "}
              <div className="job-drives-grid">
                {jobDrives.length > 0 ? (
                  jobDrives
                    .filter((job) => {
                      // Filter by status
                      if (jobFilter.status && job.status !== jobFilter.status) {
                        return false;
                      }

                      // Filter by search query
                      if (jobSearchQuery) {
                        const query = jobSearchQuery.toLowerCase();
                        return (
                          job.companyName.toLowerCase().includes(query) ||
                          job.jobRole.toLowerCase().includes(query) ||
                          job.location.toLowerCase().includes(query) ||
                          job.description.toLowerCase().includes(query)
                        );
                      }

                      return true;
                    })
                    .map((job) => (
                      <div className="job-drive-card" key={job._id}>
                        <div className="job-drive-header">
                          <h3>
                            {job.companyName} - {job.jobRole}
                          </h3>
                          <div
                            className="job-status-badge"
                            data-status={job.status}
                          >
                            {job.status.charAt(0).toUpperCase() +
                              job.status.slice(1)}
                          </div>
                          <span className="job-drive-date">
                            {new Date(
                              job.driveDetails.startDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="job-drive-content">
                          <div className="job-info-row">
                            <div className="job-info-item">
                              <i className="fas fa-map-marker-alt"></i>{" "}
                              {job.location}
                            </div>
                            <div className="job-info-item">
                              <i className="fas fa-rupee-sign"></i>{" "}
                              {job.package.basePay} LPA
                            </div>
                            <div className="job-info-item">
                              <i className="fas fa-graduation-cap"></i>{" "}
                              {job.eligibility.branches.join(", ")}
                            </div>
                          </div>
                          <p>
                            {job.description.length > 150
                              ? job.description.substring(0, 150) + "..."
                              : job.description}
                          </p>
                          <div className="job-timeline">
                            <div className="timeline-item">
                              <i className="fas fa-calendar-day"></i>
                              <span>
                                Apply by:{" "}
                                {new Date(
                                  job.driveDetails.lastDateToApply
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="timeline-item">
                              <i className="fas fa-users"></i>
                              <span>
                                {job.applications ? job.applications.length : 0}{" "}
                                Applications
                              </span>
                            </div>
                          </div>
                        </div>{" "}
                        <div className="job-drive-actions">
                          <button
                            className="action-button users"
                            title="View Applicants"
                            onClick={() => handleViewApplicants(job)}
                          >
                            <i className="fas fa-users"></i>
                          </button>
                          <button
                            className="action-button view"
                            title="View Details"
                            onClick={() => handleViewJob(job)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="action-button edit"
                            title="Edit Job Drive"
                            onClick={() => handleEditJob(job)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="action-button delete"
                            title="Delete Job Drive"
                            onClick={() => handleDeleteJobConfirmation(job)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="no-data-message">
                    <i className="fas fa-briefcase"></i>
                    <p>
                      No job drives found. Click "Add New Job Drive" to create
                      one.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
          {/* 5. Exams Management Section */}
          {activeSection === "exams" && (
            <section className="management-section">
              <div className="section-header">
                <h2>Exam Management</h2>
                <div className="header-actions">
                  <button
                    className="clear-filter-button"
                    onClick={handleClearExamFilters}
                  >
                    <i className="fas fa-filter-circle-xmark"></i> Clear Filters
                  </button>
                  <button className="add-button" onClick={handleCreateNewExam}>
                    <i className="fas fa-plus"></i> Create New Exam
                  </button>
                </div>
              </div>

              {/* Exams Search and Filter Controls */}
              <div className="search-container">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search exams by title or description..."
                    value={examSearch}
                    onChange={handleExamSearch}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-section">
                  <div className="filter-row">
                    <select
                      value={examStatusFilter}
                      onChange={(e) => setExamStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Status</option>
                      {examStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <select
                      value={examTypeFilter}
                      onChange={(e) => setExamTypeFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Types</option>
                      {examTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exams Table */}
              {isExamLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading exams data...</p>
                </div>
              ) : examActionError ? (
                <div className="error-message">{examActionError}</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Duration</th>
                        <th>Passing %</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.length > 0 ? (
                        exams.map((exam) => (
                          <tr key={exam._id}>
                            <td>{exam.title}</td>
                            <td>{exam.description}</td>
                            <td>{exam.type}</td>
                            <td>{exam.duration} mins</td>
                            <td>{exam.passingPercentage}%</td>
                            <td>
                              {new Date(exam.startDate).toLocaleDateString()}
                            </td>
                            <td>
                              {new Date(exam.endDate).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${exam.status
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {exam.status}
                              </span>
                            </td>{" "}
                            <td>
                              <Dropdown className="action-dropdown">
                                <Dropdown.Toggle
                                  variant="secondary"
                                  id={`dropdown-${exam._id}`}
                                >
                                  <FaEllipsisV />
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    onClick={() => handleViewExam(exam)}
                                  >
                                    <FaEye /> View
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() => handleEditExam(exam)}
                                  >
                                    <FaEdit /> Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() => handleManageQuestions(exam)}
                                  >
                                    <i className="fas fa-question-circle"></i>{" "}
                                    Manage Questions
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() => handleViewResults(exam)}
                                  >
                                    <i className="fas fa-chart-bar"></i> View
                                    Results
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() => handleDeleteExam(exam._id)}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </Dropdown.Item>
                                  {exam.status === "Draft" && (
                                    <Dropdown.Item
                                      onClick={() =>
                                        handlePublishExam(exam._id)
                                      }
                                    >
                                      <i className="fas fa-upload"></i> Publish
                                    </Dropdown.Item>
                                  )}
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="no-data">
                            No exam records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}{" "}
          {/* View Applicants Modal */}
          <Modal
            show={showApplicantsModal}
            onHide={() => setShowApplicantsModal(false)}
            size="xl"
            className="applicants-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Job Applications - {currentJob?.companyName} (
                {currentJob?.jobRole})
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {loadingApplicants ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading applicants data...</p>
                </div>
              ) : (
                <div className="table-container">
                  {applicants && applicants.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>USN</th>
                          <th>Branch</th>
                          <th>CGPA</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicants.map((app) => (
                          <tr key={app.student._id}>
                            <td>{app.student.name}</td>
                            <td>{app.student.usn}</td>
                            <td>{app.student.branch}</td>
                            <td>{app.student.cgpa}</td>
                            <td>
                              <span
                                className={`status-badge ${app.status.toLowerCase()}`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="action-button edit"
                                  onClick={() =>
                                    handleUpdateApplicationStatus(
                                      currentJob._id,
                                      app.student._id
                                    )
                                  }
                                  title="Change Application Status"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="action-button view"
                                  onClick={() =>
                                    handleViewResume(
                                      app.student._id,
                                      app.student.name
                                    )
                                  }
                                  title="View Resume"
                                >
                                  <FaFilePdf />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data-message">
                      <i className="fas fa-users"></i>
                      <p>No applications found for this job drive.</p>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowApplicantsModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          {/* Add Job Drive Modal */}
          <JobDriveModal
            show={showAddJobModal}
            onHide={() => setShowAddJobModal(false)}
            jobFormData={jobFormData}
            handleJobInputChange={handleJobInputChange}
            handleBranchSelection={handleBranchSelection}
            handleAddRound={handleAddRound}
            handleRoundChange={handleRoundChange}
            handleRemoveRound={handleRemoveRound}
            handleSubmitJobDrive={handleSubmitJobDrive}
          />
          {/* Original Modal - Now Hidden 
                    <Modal 
                        show={false} 
                        onHide={() => setShowAddJobModal(false)} 
                        size="lg" 
                        centered
                        className="custom-job-modal"
                    >
                        <Modal.Header closeButton className="custom-modal-header">
                            <Modal.Title>Post New Job Drive</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="custom-modal-body">
                            <Form id="jobDriveForm" className="job-form">
                                <div className="form-section">
                                    <h5>Company Details</h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group controlId="companyName">
                                                <Form.Label>Company Name *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="companyName"
                                                    value={jobFormData.companyName}
                                                    onChange={handleJobInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="companyWebsite">
                                                <Form.Label>Company Website</Form.Label>
                                                <Form.Control
                                                    type="url"
                                                    name="companyWebsite"
                                                    value={jobFormData.companyWebsite}
                                                    onChange={handleJobInputChange}
                                                    placeholder="https://example.com"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group controlId="category">
                                        <Form.Label>Category *</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="category"
                                            value={jobFormData.category}
                                            onChange={handleJobInputChange}
                                            required
                                        >
                                            <option value="IT">IT</option>
                                            <option value="Core">Core</option>
                                            <option value="Management">Management</option>
                                        </Form.Control>
                                    </Form.Group>
                                </div>

                                <div className="form-section mt-4">
                                    <h5>Job Details</h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group controlId="jobRole">
                                                <Form.Label>Job Role *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="jobRole"
                                                    value={jobFormData.jobRole}
                                                    onChange={handleJobInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="type">
                                                <Form.Label>Job Type *</Form.Label>
                                                <Form.Control
                                                    as="select"
                                                    name="type"
                                                    value={jobFormData.type}
                                                    onChange={handleJobInputChange}
                                                    required
                                                >
                                                    <option value="full-time">Full Time</option>
                                                    <option value="internship">Internship</option>
                                                    <option value="contract">Contract</option>
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group controlId="package.basePay">
                                                <Form.Label>Base Pay (LPA) *</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="package.basePay"
                                                    value={jobFormData.package.basePay}
                                                    onChange={handleJobInputChange}
                                                    required
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="package.totalCTC">
                                                <Form.Label>Total CTC (LPA)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="package.totalCTC"
                                                    value={jobFormData.package.totalCTC}
                                                    onChange={handleJobInputChange}
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group controlId="location">
                                        <Form.Label>Location *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="location"
                                            value={jobFormData.location}
                                            onChange={handleJobInputChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group controlId="description">
                                        <Form.Label>Job Description *</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            name="description"
                                            value={jobFormData.description}
                                            onChange={handleJobInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </div>

                                <div className="form-section mt-4">
                                    <h5>Eligibility Criteria</h5>
                                    <div className="checkbox-group mb-3">
                                        <Form.Label>Eligible Branches *</Form.Label>
                                        <div className="d-flex flex-wrap gap-3">
                                            {['Computer Science', 'Information Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'MCA'].map(branch => (
                                                <Form.Check
                                                    key={branch}
                                                    type="checkbox"
                                                    label={branch}
                                                    name="eligibility.branches"
                                                    value={branch}
                                                    checked={jobFormData.eligibility.branches.includes(branch)}
                                                    onChange={handleBranchSelection}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group controlId="eligibility.minCGPA">
                                                <Form.Label>Minimum CGPA</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="eligibility.minCGPA"
                                                    value={jobFormData.eligibility.minCGPA}
                                                    onChange={handleJobInputChange}
                                                    min="0"
                                                    max="10"
                                                    step="0.01"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="eligibility.maxBacklogs">
                                                <Form.Label>Maximum Backlogs</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="eligibility.maxBacklogs"
                                                    value={jobFormData.eligibility.maxBacklogs}
                                                    onChange={handleJobInputChange}
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group controlId="eligibility.minTenthPercentage">
                                                <Form.Label>Minimum 10th Percentage</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="eligibility.minTenthPercentage"
                                                    value={jobFormData.eligibility.minTenthPercentage}
                                                    onChange={handleJobInputChange}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="eligibility.minTwelfthPercentage">
                                                <Form.Label>Minimum 12th Percentage</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="eligibility.minTwelfthPercentage"
                                                    value={jobFormData.eligibility.minTwelfthPercentage}
                                                    onChange={handleJobInputChange}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="form-section mt-4">
                                    <h5>Drive Schedule</h5>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group controlId="driveDetails.startDate">
                                                <Form.Label>Drive Start Date *</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="driveDetails.startDate"
                                                    value={jobFormData.driveDetails.startDate}
                                                    onChange={handleJobInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group controlId="driveDetails.lastDateToApply">
                                                <Form.Label>Last Date to Apply *</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="driveDetails.lastDateToApply"
                                                    value={jobFormData.driveDetails.lastDateToApply}
                                                    onChange={handleJobInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="rounds-section mt-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6>Selection Rounds</h6>
                                            <Button variant="outline-primary" size="sm" onClick={handleAddRound}>
                                                <i className="fas fa-plus"></i> Add Round
                                            </Button>
                                        </div>
                                        {jobFormData.driveDetails.rounds.map((round, index) => (
                                            <div key={index} className="round-item mb-3 p-3 border rounded">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <h6>Round {round.roundNumber}</h6>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleRemoveRound(index)}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </Button>
                                                </div>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group>
                                                            <Form.Label>Round Type</Form.Label>
                                                            <Form.Control
                                                                as="select"
                                                                value={round.type}
                                                                onChange={(e) => handleRoundChange(index, 'type', e.target.value)}
                                                            >
                                                                <option value="">Select Type</option>
                                                                <option value="aptitude">Aptitude Test</option>
                                                                <option value="technical">Technical Round</option>
                                                                <option value="coding">Coding Round</option>
                                                                <option value="interview">Interview</option>
                                                                <option value="hr">HR Round</option>
                                                            </Form.Control>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group>
                                                            <Form.Label>Date</Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                value={round.date}
                                                                onChange={(e) => handleRoundChange(index, 'date', e.target.value)}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                                <Form.Group className="mt-2">
                                                    <Form.Label>Round Description</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={round.description}
                                                        onChange={(e) => handleRoundChange(index, 'description', e.target.value)}
                                                    />
                                                </Form.Group>
                                                <Form.Group className="mt-2">
                                                    <Form.Label>Venue</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={round.venue}
                                                        onChange={(e) => handleRoundChange(index, 'venue', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Form>                        </Modal.Body>
                        <Modal.Footer className="custom-modal-footer">
                            <div className="d-flex justify-content-center w-100">
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setShowAddJobModal(false)} 
                                    className="btn-cancel mx-2"
                                    style={{minWidth: "120px", padding: "10px 20px"}}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    onClick={handleSubmitJobDrive} 
                                    type="submit" 
                                    form="jobDriveForm" 
                                    className="btn-submit mx-2"
                                    style={{minWidth: "150px", padding: "10px 20px"}}
                                >                                    Post Job Drive
                                </Button>
                            </div>
                        </Modal.Footer>
                    </Modal>*/}
          {/* Edit Exam Modal */}
          <Modal
            show={showEditExamModal}
            onHide={() => setShowEditExamModal(false)}
            dialogClassName="exam-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>Edit Exam</Modal.Title>
            </Modal.Header>
            <Modal.Body className="custom-modal-body">
              <Form>
                <Form.Group controlId="formExamTitle">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={examFormData.title}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={examFormData.description}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    name="type"
                    value={examFormData.type}
                    onChange={handleExamFormChange}
                  >
                    {examTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="formExamDuration">
                  <Form.Label>Duration (in minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    value={examFormData.duration}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamPassingPercentage">
                  <Form.Label>Passing Percentage</Form.Label>
                  <Form.Control
                    type="number"
                    name="passingPercentage"
                    value={examFormData.passingPercentage}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamStartDate">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={examFormData.startDate}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamEndDate">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={examFormData.endDate}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamStatus">
                  <Form.Label>Status</Form.Label>
                  <Form.Control
                    as="select"
                    name="status"
                    value={examFormData.status}
                    onChange={handleExamFormChange}
                  >
                    {examStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="formExamEligibilityDepartments">
                  <Form.Label>Eligibility Departments</Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    name="eligibility.departments"
                    value={examFormData.eligibility.departments}
                    onChange={(e) =>
                      handleMultiSelectChange(
                        "departments",
                        Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                      )
                    }
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="formExamEligibilityBranches">
                  <Form.Label>Eligibility Branches</Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    name="eligibility.branches"
                    value={examFormData.eligibility.branches}
                    onChange={(e) =>
                      handleMultiSelectChange(
                        "branches",
                        Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                      )
                    }
                  >
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="formExamEligibilitySemesters">
                  <Form.Label>Eligibility Semesters</Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    name="eligibility.semesters"
                    value={examFormData.eligibility.semesters}
                    onChange={(e) =>
                      handleMultiSelectChange(
                        "semesters",
                        Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                      )
                    }
                  >
                    {semesterOptions.map((sem) => (
                      <option key={sem.value} value={sem.value}>
                        {sem.label}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="formExamEligibilityMinCGPA">
                  <Form.Label>Minimum CGPA</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.minCGPA"
                    value={examFormData.eligibility.minCGPA}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamEligibilityMinPercentage">
                  <Form.Label>Minimum Percentage</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.minPercentage"
                    value={examFormData.eligibility.minPercentage}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamEligibilityMaxBacklogs">
                  <Form.Label>Maximum Backlogs</Form.Label>
                  <Form.Control
                    type="number"
                    name="eligibility.maxBacklogs"
                    value={examFormData.eligibility.maxBacklogs}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
                <Form.Group controlId="formExamInstructions">
                  <Form.Label>Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="instructions"
                    value={examFormData.instructions}
                    onChange={handleExamFormChange}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>{" "}
            <Modal.Footer className="exam-modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowEditExamModal(false)}
              >
                Close
              </Button>
              <Button variant="primary" onClick={handleUpdateExam}>
                Update
              </Button>
            </Modal.Footer>
          </Modal>{" "}
          {/* View Exam Modal */}
          <Modal
            show={showViewExamModal}
            onHide={() => setShowViewExamModal(false)}
            dialogClassName="exam-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>View Exam</Modal.Title>
            </Modal.Header>
            <Modal.Body className="custom-modal-body">
              {selectedExam && (
                <div className="exam-details">
                  <p>
                    <strong>Title:</strong> {selectedExam.title}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedExam.description}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedExam.type}
                  </p>
                  <p>
                    <strong>Duration:</strong> {selectedExam.duration} mins
                  </p>
                  <p>
                    <strong>Passing Percentage:</strong>{" "}
                    {selectedExam.passingPercentage}%
                  </p>
                  <p>
                    <strong>Start Date:</strong>{" "}
                    {new Date(selectedExam.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>End Date:</strong>{" "}
                    {new Date(selectedExam.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`status-badge ${selectedExam.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {selectedExam.status}
                    </span>
                  </p>

                  <div className="eligibility-section">
                    <h4>Eligibility Criteria</h4>
                    <ul>
                      <li>
                        Departments:{" "}
                        {selectedExam.eligibility?.departments?.join(", ") ||
                          "Any"}
                      </li>
                      <li>
                        Branches:{" "}
                        {selectedExam.eligibility?.branches?.join(", ") ||
                          "Any"}
                      </li>
                      <li>
                        Semesters:{" "}
                        {selectedExam.eligibility?.semesters?.join(", ") ||
                          "Any"}
                      </li>
                      <li>
                        Minimum CGPA:{" "}
                        {selectedExam.eligibility?.minCGPA || "Not specified"}
                      </li>
                      <li>
                        Minimum Percentage:{" "}
                        {selectedExam.eligibility?.minPercentage
                          ? `${selectedExam.eligibility.minPercentage}%`
                          : "Not specified"}
                      </li>
                      <li>
                        Maximum Backlogs:{" "}
                        {selectedExam.eligibility?.maxBacklogs ||
                          "Not specified"}
                      </li>
                    </ul>
                  </div>

                  {selectedExam.instructions && (
                    <div className="instructions-section eligibility-section">
                      <h4>Instructions</h4>
                      <p>{selectedExam.instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>{" "}
            <Modal.Footer className="exam-modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowViewExamModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleManageQuestions(selectedExam)}
              >
                Manage Questions
              </Button>
              {selectedExam && selectedExam.status !== "Draft" && (
                <Button
                  variant="success"
                  onClick={() => handleViewResults(selectedExam)}
                >
                  View Results
                </Button>
              )}
            </Modal.Footer>
          </Modal>{" "}
          {/* Manage Questions Modal */}
          <Modal
            show={showManageQuestionsModal}
            onHide={() => {
              setShowManageQuestionsModal(false);
              setSelectedQuestion(null);
            }}
            size="lg"
            dialogClassName="exam-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Manage Questions - {selectedExam?.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="custom-modal-body">
              <div className="questions-container">
                <div className="question-form">
                  <h5>
                    {selectedQuestion ? "Edit Question" : "Add New Question"}
                  </h5>
                  <Form>
                    <Form.Group controlId="formQuestionText">
                      <Form.Label>Question Text</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="question"
                        value={questionFormData.question}
                        onChange={handleQuestionFormChange}
                        placeholder="Enter question here..."
                        rows={3}
                      />
                    </Form.Group>
                    <Form.Group controlId="formQuestionOptions">
                      <Form.Label>Options</Form.Label>
                      {questionFormData.options.map((option, index) => (
                        <div key={index} className="mb-2">
                          <Form.Control
                            type="text"
                            name="options"
                            value={option}
                            onChange={(e) => handleQuestionFormChange(e, index)}
                            placeholder={`Option ${index + 1}`}
                          />
                        </div>
                      ))}
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group controlId="formQuestionCorrectOption">
                          <Form.Label>Correct Option</Form.Label>
                          <Form.Control
                            as="select"
                            name="correctOption"
                            value={questionFormData.correctOption}
                            onChange={handleQuestionFormChange}
                          >
                            {questionFormData.options.map((option, index) => (
                              <option key={index} value={index}>{`Option ${
                                index + 1
                              }`}</option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="formQuestionMarks">
                          <Form.Label>Marks</Form.Label>
                          <Form.Control
                            type="number"
                            name="marks"
                            value={questionFormData.marks}
                            onChange={handleQuestionFormChange}
                            min="1"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="question-form-actions">
                      {selectedQuestion ? (
                        <>
                          <Button
                            variant="primary"
                            onClick={handleUpdateQuestion}
                          >
                            Update Question
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handleCancelEditQuestion}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button variant="primary" onClick={handleAddQuestion}>
                          Add Question
                        </Button>
                      )}
                    </div>
                  </Form>
                </div>
                <div className="questions-list">
                  <h5>Questions List ({questions.length})</h5>
                  {questions.length > 0 ? (
                    <ul>
                      {questions.map((question, index) => (
                        <li key={question._id}>
                          <div className="question-item">
                            <div className="question-text">
                              <strong>Q{index + 1}:</strong> {question.question}
                              <div className="question-meta">
                                <small>
                                  Marks: {question.marks} | Correct Option:{" "}
                                  {parseInt(question.correctOption) + 1}
                                </small>
                              </div>
                            </div>
                            <div className="question-actions">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <FaEdit /> Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleDeleteQuestion(question._id)
                                }
                              >
                                <i className="fas fa-trash"></i> Delete
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No questions added yet. Use the form above to add
                      questions to this exam.
                    </p>
                  )}
                </div>
              </div>
            </Modal.Body>{" "}
            <Modal.Footer className="exam-modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowManageQuestionsModal(false)}
              >
                Close
              </Button>
              {questions.length > 0 && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowManageQuestionsModal(false);
                    if (selectedExam.status === "Draft") {
                      handlePublishExam(selectedExam._id);
                    }
                  }}
                >
                  {selectedExam?.status === "Draft"
                    ? "Save & Publish Exam"
                    : "Save Changes"}
                </Button>
              )}
            </Modal.Footer>
          </Modal>{" "}
          {/* View Results Modal */}
          <Modal
            show={showViewResultsModal}
            onHide={() => setShowViewResultsModal(false)}
            dialogClassName="exam-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>Exam Results - {selectedExam?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="custom-modal-body">
              {selectedResultsData.length > 0 ? (
                <div className="results-container">
                  <div className="exam-summary mb-3">
                    <Row>
                      <Col md={4}>
                        <div className="summary-stat">
                          <div className="stat-label">Total Attempts</div>
                          <div className="stat-value">
                            {selectedResultsData.length}
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="summary-stat">
                          <div className="stat-label">Pass Percentage</div>
                          <div className="stat-value">
                            {Math.round(
                              (selectedResultsData.filter(
                                (r) => r.result === "Pass"
                              ).length /
                                selectedResultsData.length) *
                                100
                            )}
                            %
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="summary-stat">
                          <div className="stat-label">Average Score</div>
                          <div className="stat-value">
                            {Math.round(
                              selectedResultsData.reduce(
                                (acc, curr) => acc + parseInt(curr.score || 0),
                                0
                              ) / selectedResultsData.length
                            )}
                            %
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>USN</th>
                        <th>Score</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResultsData.map((result, index) => (
                        <tr key={result.studentId}>
                          <td>{index + 1}</td>
                          <td>{result.studentName}</td>
                          <td>{result.usn}</td>
                          <td>{result.score}%</td>
                          <td>
                            <span
                              className={`status-badge ${result.result.toLowerCase()}`}
                            >
                              {result.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data-container">
                  <i className="fas fa-clipboard-list no-data-icon"></i>
                  <p>No results available for this exam.</p>
                  {selectedExam?.status === "Scheduled" && (
                    <p className="text-muted">
                      This exam is scheduled but hasn't been taken by any
                      students yet.
                    </p>
                  )}
                </div>
              )}
            </Modal.Body>{" "}
            <Modal.Footer className="exam-modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowViewResultsModal(false)}
              >
                Close
              </Button>
              {selectedResultsData.length > 0 && (
                <Button
                  variant="primary"
                  onClick={() => handleExportResults(selectedExam._id)}
                >
                  <i className="fas fa-file-export"></i> Export Results
                </Button>
              )}
            </Modal.Footer>
          </Modal>
        </main>{" "}
      </div>
      <Footer />

      {/* Job Details Modal */}
      {showJobModal && currentJob && (
        <div className="modal-backdrop">
          <div className="modal-content job-details-modal">
            <div className="modal-header">
              <h3>
                {currentJob.companyName} - {currentJob.jobRole}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowJobModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="job-details">
                <div className="detail-section">
                  <h4>
                    <i className="fas fa-building"></i> Company Details
                  </h4>
                  <p>
                    <strong>Name:</strong> {currentJob.companyName}
                  </p>
                  {currentJob.companyWebsite && (
                    <p>
                      <strong>Website:</strong>{" "}
                      <a
                        href={currentJob.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {currentJob.companyWebsite}
                      </a>
                    </p>
                  )}
                  <p>
                    <strong>Category:</strong> {currentJob.category}
                  </p>
                </div>

                <div className="detail-section">
                  <h4>
                    <i className="fas fa-briefcase"></i> Job Details
                  </h4>
                  <p>
                    <strong>Role:</strong> {currentJob.jobRole}
                  </p>
                  <p>
                    <strong>Type:</strong> {currentJob.type}
                  </p>
                  <p>
                    <strong>Location:</strong> {currentJob.location}
                  </p>
                  <p>
                    <strong>Base Pay:</strong> {currentJob.package.basePay} LPA
                  </p>
                  {currentJob.package.totalCTC && (
                    <p>
                      <strong>Total CTC:</strong> {currentJob.package.totalCTC}{" "}
                      LPA
                    </p>
                  )}
                </div>

                <div className="detail-section">
                  <h4>
                    <i className="fas fa-file-alt"></i> Description
                  </h4>
                  <p>{currentJob.description}</p>
                </div>

                <div className="detail-section">
                  <h4>
                    <i className="fas fa-user-graduate"></i> Eligibility
                    Criteria
                  </h4>
                  <p>
                    <strong>Eligible Branches:</strong>{" "}
                    {currentJob.eligibility.branches.join(", ")}
                  </p>
                  <p>
                    <strong>Min CGPA:</strong> {currentJob.eligibility.minCGPA}
                  </p>
                  {currentJob.eligibility.maxBacklogs !== undefined && (
                    <p>
                      <strong>Max Backlogs:</strong>{" "}
                      {currentJob.eligibility.maxBacklogs}
                    </p>
                  )}
                  {currentJob.eligibility.minTenthPercentage && (
                    <p>
                      <strong>Min 10th %:</strong>{" "}
                      {currentJob.eligibility.minTenthPercentage}%
                    </p>
                  )}
                  {currentJob.eligibility.minTwelfthPercentage && (
                    <p>
                      <strong>Min 12th %:</strong>{" "}
                      {currentJob.eligibility.minTwelfthPercentage}%
                    </p>
                  )}
                </div>

                <div className="detail-section">
                  <h4>
                    <i className="fas fa-calendar-alt"></i> Drive Schedule
                  </h4>
                  <p>
                    <strong>Drive Start:</strong>{" "}
                    {new Date(
                      currentJob.driveDetails.startDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p>
                    <strong>Last Date to Apply:</strong>{" "}
                    {new Date(
                      currentJob.driveDetails.lastDateToApply
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  {currentJob.driveDetails.rounds &&
                    currentJob.driveDetails.rounds.length > 0 && (
                      <div className="rounds-section">
                        <h5>Selection Rounds</h5>
                        <div className="rounds-list">
                          {currentJob.driveDetails.rounds.map(
                            (round, index) => (
                              <div key={index} className="round-item">
                                <h6>
                                  Round {round.roundNumber}: {round.type}
                                </h6>
                                {round.date && (
                                  <p>
                                    <strong>Date:</strong>{" "}
                                    {new Date(round.date).toLocaleDateString()}
                                  </p>
                                )}
                                {round.description && (
                                  <p>
                                    <strong>Description:</strong>{" "}
                                    {round.description}
                                  </p>
                                )}
                                {round.venue && (
                                  <p>
                                    <strong>Venue:</strong> {round.venue}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowJobModal(false)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowJobModal(false);
                  handleEditJob(currentJob);
                }}
              >
                Edit Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentJob && (
        <div className="modal-backdrop">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <p>
                Are you sure you want to delete the job drive for{" "}
                <strong>
                  {currentJob.companyName} - {currentJob.jobRole}
                </strong>
                ?
              </p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteJob}>
                Delete Job Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TPODashboard;
