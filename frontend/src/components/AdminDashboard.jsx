import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './footer';
import '../styles/AdminDashboard.css';
import api from '../services/api';
import {
  getDashboardStats, getAllTPOs, createTPO, removeTPO, searchTPOs,
  getAllJobDrives, createJobDrive, updateJobDrive, deleteJobDrive, searchJobDrives,
  getAllExams, createExam, updateExam, deleteExam, searchExams,
  getLogs, searchLogs, exportLogs,
  getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, searchAnnouncements,
  getAllStudents, updateStudent, removeStudent
} from '../services/adminService';

// Job Management State
const initialJobFormState = {
  companyName: '',
  companyWebsite: '',
  jobRole: '',
  category: '',
  description: '',
  package: {
    basePay: '',
    totalCTC: ''
  },
  location: '',
  type: '',
  eligibility: {
    branches: [],
    minCGPA: '',
    maxBacklogs: 0,
    minTenthPercentage: '',
    minTwelfthPercentage: '',
    otherRequirements: []
  },
  driveDetails: {
    startDate: '',
    lastDateToApply: '',
    rounds: []
  },
  status: 'published'
};

// Exam Management State
const initialExamFormState = {
  title: '',
  type: '',
  duration: 60,
  totalMarks: 100,
  passingMarks: 40,
  scheduledDate: '',
  startTime: '',
  endTime: '',
  description: '',
  eligibility: {
    departments: [],
    semester: []
  },
  sections: []
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTPOs: 0,
    activeJobDrives: 0,
    examsConducted: 0
  });
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAddTpoForm, setShowAddTpoForm] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [tpos, setTpos] = useState([]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [newTpo, setNewTpo] = useState({
    name: '',
    email: '',
    department: '',
    password: ''
  });

  // Job Management State
  const [jobs, setJobs] = useState([]);
  const [jobFormData, setJobFormData] = useState(initialJobFormState);
  const [jobFilter, setJobFilter] = useState({
    type: '',
    sector: '',
    status: ''
  });

  // Exam Management State
  const [examFormData, setExamFormData] = useState(initialExamFormState);
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState({
    type: '',
    status: ''
  });

  // Announcement Management State
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [academicFilters, setAcademicFilters] = useState({
    minTenthPercentage: '',
    minTwelfthPercentage: '',
    minDegreePercentage: '',
    maxBacklogs: ''
  });
  
  const [studentFilter, setStudentFilter] = useState({
    department: '',
    semester: ''
  });

  const [logFilter, setLogFilter] = useState({
    status: '',
    type: ''
  });

  // Fetch data based on active section
  useEffect(() => {
    const fetchSectionData = async () => {
      setLoading(true);
      setError(null);
      try {
        switch (activeSection) {
          case 'dashboard':
            const statsResponse = await getDashboardStats();
            setStats(statsResponse.data);
            break;
          case 'manage-tpos':
            const tposResponse = await getAllTPOs();
            setTpos(tposResponse.data.data || []);
            break;
          case 'manage-students':
            const studentsResponse = await getAllStudents();
            setStudents(studentsResponse.data || []);
            break;
          case 'job-drives':
            const jobsResponse = await getAllJobDrives();
            setJobs(jobsResponse.data || []);
            break;
          case 'exams':
            const examsResponse = await getAllExams();
            setExams(examsResponse.data || []);
            break;
          case 'logs':
            const logsResponse = await getLogs(currentPage);
            setLogs(logsResponse.data.logs || []);
            setTotalPages(logsResponse.data.totalPages || 1);
            break;
          case 'announcements':
            const announcementsResponse = await getAllAnnouncements();
            setAnnouncements(announcementsResponse.data || []);
            break;
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchSectionData();
  }, [activeSection, currentPage]);

  // Generic search handler
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      
      try {
        switch (activeSection) {
          case 'manage-tpos':
            const tpoResults = await searchTPOs(searchQuery);
            setTpos(tpoResults.data.data || []);
            break;
          case 'manage-students':
            const studentResults = await searchStudents(searchQuery);
            setStudents(studentResults.data || []);
            break;
          case 'job-drives':
            const jobResults = await searchJobDrives(searchQuery);
            setJobs(jobResults.data || []);
            break;
          case 'exams':
            const examResults = await searchExams(searchQuery);
            setExams(examResults.data || []);
            break;
          case 'logs':
            const logResults = await searchLogs(searchQuery);
            setLogs(logResults.data.logs || []);
            break;
          case 'announcements':
            const announcementResults = await searchAnnouncements(searchQuery);
            setAnnouncements(announcementResults.data || []);
            break;
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    };

    const debounceTimeout = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, activeSection]);

  // Export handlers
  const handleExportLogs = async () => {
    try {
      const response = await exportLogs();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'system_logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export logs');
    }
  };

  // Handlers for job drives
  const handleJobDriveCreate = async () => {
    try {
      setLoading(true);
      await createJobDrive(jobFormData);
      const response = await getAllJobDrives();
      setJobs(response.data || []);
      setShowAddJobModal(false);
      setJobFormData(initialJobFormState);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job drive');
    } finally {
      setLoading(false);
    }
  };

  const handleJobDriveDelete = async (id) => {
    // Add confirmation prompt before deleting
    if (window.confirm('Are you sure you want to remove this job posting? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteJobDrive(id);
        const response = await getAllJobDrives();
        setJobs(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete job drive');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handlers for announcements
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement._id, announcementFormData);
      } else {
        await createAnnouncement(announcementFormData);
      }
      const response = await getAllAnnouncements();
      setAnnouncements(response.data || []);
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
    try {
      setLoading(true);
      await deleteAnnouncement(id);
      const response = await getAllAnnouncements();
      setAnnouncements(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setLoading(false);
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
      expiryDate: announcement.expiryDate || '',
      attachments: []
    });
    setShowAddAnnouncementModal(true);
  };

  // Add debounced search effect for jobs
  useEffect(() => {
    if (activeSection === 'job-drives' && searchQuery) {
      const delayDebounceFn = setTimeout(() => {
        handleJobSearch(searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (activeSection === 'job-drives') {
      fetchJobs();
    }
  }, [searchQuery, activeSection]);

  // Convert stats to array format for rendering
  const statsArray = [
    { id: 1, title: 'Total Students', count: stats.totalStudents, icon: 'users' },
    { id: 2, title: 'Total TPOs', count: stats.totalTPOs, icon: 'user-tie' },
    { id: 3, title: 'Active Job Drives', count: stats.activeJobDrives, icon: 'briefcase' },
    { id: 4, title: 'Exams Conducted', count: stats.examsConducted, icon: 'clipboard-list' }
  ];

  // Section and UI Handlers
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchQuery('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/admin-login');
  };

  // TPO Management Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTpo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createTPO(newTpo);
      const response = await getAllTPOs();
      setTpos(response.data?.data || []);
      setShowAddTpoForm(false);
      setNewTpo({ name: '', email: '', department: '', password: '' });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add TPO');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTPO = async (id) => {
    try {
      setLoading(true);
      await removeTPO(id);
      const response = await getAllTPOs();
      setTpos(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove TPO');
    } finally {
      setLoading(false);
    }
  };

  // Job Management Handlers
  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobFormData({
      ...job,
      package: {
        basePay: job.package.basePay,
        totalCTC: job.package.totalCTC || ''
      },
      eligibility: {
        branches: job.eligibility.branches || [],
        minCGPA: job.eligibility.minCGPA || '',
        maxBacklogs: job.eligibility.maxBacklogs || 0,
        minTenthPercentage: job.eligibility.minTenthPercentage || '',
        minTwelfthPercentage: job.eligibility.minTwelfthPercentage || '',
        otherRequirements: job.eligibility.otherRequirements || []
      },
      driveDetails: {
        startDate: job.driveDetails.startDate ? new Date(job.driveDetails.startDate).toISOString().split('T')[0] : '',
        lastDateToApply: job.driveDetails.lastDateToApply ? new Date(job.driveDetails.lastDateToApply).toISOString().split('T')[0] : '',
        rounds: job.driveDetails.rounds || []
      }
    });
    setShowAddJobModal(true);
  };

  const handleJobInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setJobFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setJobFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleJobFilter = (filterType, value) => {
    setJobFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleBranchSelection = (e) => {
    const { checked, value } = e.target;
    let updatedBranches = [...jobFormData.eligibility.branches];
    
    if (checked) {
      updatedBranches.push(value);
    } else {
      updatedBranches = updatedBranches.filter(branch => branch !== value);
    }
    
    setJobFormData(prev => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        branches: updatedBranches
      }
    }));
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form data
      if (jobFormData.eligibility.branches.length === 0) {
        setError('Please select at least one eligible branch');
        setLoading(false);
        return;
      }
      
      // Format dates properly
      const formattedData = {
        ...jobFormData,
        package: {
          ...jobFormData.package,
          basePay: parseFloat(jobFormData.package.basePay),
          totalCTC: jobFormData.package.totalCTC ? parseFloat(jobFormData.package.totalCTC) : parseFloat(jobFormData.package.basePay)
        },
        eligibility: {
          ...jobFormData.eligibility,
          minCGPA: parseFloat(jobFormData.eligibility.minCGPA) || 0,
          maxBacklogs: parseInt(jobFormData.eligibility.maxBacklogs) || 0,
          minTenthPercentage: jobFormData.eligibility.minTenthPercentage ? parseFloat(jobFormData.eligibility.minTenthPercentage) : 0,
          minTwelfthPercentage: jobFormData.eligibility.minTwelfthPercentage ? parseFloat(jobFormData.eligibility.minTwelfthPercentage) : 0
        }
      };
      
      if (editingJob) {
        await updateJobDrive(editingJob._id, formattedData);
      } else {
        await createJobDrive(formattedData);
      }
      
      // Refresh the job list
      const response = await getAllJobDrives();
      setJobs(response.data || []);
      
      // Reset and close form
      setShowAddJobModal(false);
      setJobFormData(initialJobFormState);
      setEditingJob(null);
      
    } catch (err) {
      console.error('Error with job drive:', err);
      setError(err.response?.data?.message || 'Failed to process job drive');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSearch = async (query) => {
    try {
      const response = await searchJobDrives(query);
      setJobs(response.data || []);
    } catch (err) {
      console.error('Job search failed:', err);
      setJobs([]);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await getAllJobDrives();
      setJobs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
      setJobs([]);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getAllJobDrives();
        setJobs(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    if (activeSection === 'job-drives') {
      fetchJobs();
    }
  }, [activeSection]);

  const filteredJobs = jobs.filter(job => {
    return (
      (!jobFilter.type || job.type === jobFilter.type) &&
      (!jobFilter.sector || job.category === jobFilter.sector) &&
      (!jobFilter.status || job.status === jobFilter.status)
    );
  });

  // Exam Management Handlers
  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setExamFormData({
      ...exam,
      scheduledDate: exam.scheduledDate ? new Date(exam.scheduledDate).toISOString().split('T')[0] : '',
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      eligibility: {
        departments: exam.eligibility?.departments || [],
        semester: exam.eligibility?.semester?.map(sem => sem.toString()) || []
      }
    });
    setShowAddExamModal(true);
  };

  const handleExamInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle checkbox selections for departments and semesters
      const field = name.split('.')[1]; // departments or semester
      let updatedValues = [...examFormData.eligibility[field]];
      
      if (checked) {
        updatedValues.push(value);
      } else {
        updatedValues = updatedValues.filter(item => item !== value);
      }
      
      setExamFormData(prev => ({
        ...prev,
        eligibility: {
          ...prev.eligibility,
          [field]: updatedValues
        }
      }));
    } else if (name.includes('.')) {
      // Handle nested fields
      const [parent, child] = name.split('.');
      setExamFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle regular fields
      setExamFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleExamFilter = (filterType, value) => {
    setExamFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Format data before submission
      const formattedData = {
        ...examFormData,
        scheduledFor: examFormData.scheduledDate, // Map to correct field name
        registrationDeadline: examFormData.scheduledDate, // You can set this to same as scheduled date if not collecting separately
        duration: parseInt(examFormData.duration) || 60,
        totalMarks: parseInt(examFormData.totalMarks) || 100,
        passingMarks: parseInt(examFormData.passingMarks) || 40,
        eligibility: {
          ...examFormData.eligibility,
          branches: examFormData.eligibility.departments, // Map departments to branches
          semester: examFormData.eligibility.semester.map(sem => parseInt(sem))
        },
        createdBy: "admin-id-here", // This is the main issue - needs a valid ID
        status: "scheduled" // Set a proper initial status
      };
      
      if (editingExam) {
        await updateExam(editingExam._id, formattedData);
      } else {
        await createExam(formattedData);
      }
      
      // Refresh the exam list
      const response = await getAllExams();
      setExams(response.data || []);
      
      // Reset and close form
      setShowAddExamModal(false);
      setExamFormData(initialExamFormState);
      setEditingExam(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process exam');
      console.error('Error with exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteExam(id);
        const response = await getAllExams();
        setExams(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete exam');
      } finally {
        setLoading(false);
      }
    }
  };

  // Announcement Management Handlers
  const handleAnnouncementInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnnouncementFileChange = (e) => {
    setAnnouncementFormData(prev => ({
      ...prev,
      attachments: Array.from(e.target.files)
    }));
  };

  const handleAnnouncementFilter = (filterType, value) => {
    setAnnouncementFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Student Management Handler
  const searchStudents = async (query) => {
    try {
      const response = await searchStudents(query);
      setStudents(response.data || []);
    } catch (err) {
      console.error('Student search failed:', err);
      setStudents([]);
    }
  };

  // Student management handlers
  const handleViewStudent = (id) => {
    // This function will be implemented to view student details
    console.log(`Viewing student with ID: ${id}`);
    // Navigate to student profile view or open modal
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateStudent(editingStudent._id, editingStudent);
      setShowEditStudentModal(false);
      
      // Refresh the student list after update
      const response = await getAllStudents();
      setStudents(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudentInputChange = (e) => {
    const { name, value } = e.target;
    setEditingStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRemoveStudent = async (id) => {
    if (window.confirm('Are you sure you want to remove this student? This action cannot be undone.')) {
      try {
        setLoading(true);
        await removeStudent(id);
        // Refresh the student list
        const response = await getAllStudents();
        setStudents(response.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to remove student');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportStudentData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/students/export', { 
        responseType: 'blob'
      });
      
      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export student data. Please try again.');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicFilterChange = (e) => {
    const { name, value } = e.target;
    setAcademicFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (activeSection === 'manage-students') {
      const applyFilters = async () => {
        try {
          setLoading(true);
          
          // Prepare filter object based on applied filters
          const filters = {
            ...(studentFilter.department && { department: studentFilter.department }),
            ...(studentFilter.semester && { currentSemester: studentFilter.semester }),
            ...(academicFilters.minTenthPercentage && { minTenthPercentage: academicFilters.minTenthPercentage }),
            ...(academicFilters.minTwelfthPercentage && { minTwelfthPercentage: academicFilters.minTwelfthPercentage }),
            ...(academicFilters.minDegreePercentage && { minDegreePercentage: academicFilters.minDegreePercentage }),
            ...(academicFilters.maxBacklogs !== '' && { maxBacklogs: academicFilters.maxBacklogs }),
            ...(searchQuery && { search: searchQuery })
          };
          
          // If no filters, fetch all students
          if (Object.keys(filters).length === 0) {
            const response = await getAllStudents();
            setStudents(response.data || []);
          } else {
            // Use TPO endpoint for filtering students instead of admin endpoint
            const response = await api.post('/tpo/students/filter', filters);
            setStudents(response.data || []);
          }
        } catch (err) {
          console.error('Error applying student filters:', err);
          setError(err.response?.data?.message || 'Failed to filter students');
        } finally {
          setLoading(false);
        }
      };
      
      const delayDebounceFn = setTimeout(() => {
        applyFilters();
      }, 500);
      
      return () => clearTimeout(delayDebounceFn);
    }
  }, [activeSection, studentFilter, academicFilters, searchQuery]);

  return (
    <div className="dashboard-container">
      <Header />
      
      <div className="dashboard-content">
        {/* Admin Profile Icon */}
        <div className="admin-profile">
          <button 
            className="admin-icon"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <i className="fas fa-user-circle"></i>
            <span>Admin</span>
            <i className={`fas fa-chevron-${showProfileDropdown ? 'up' : 'down'}`}></i>
          </button>
          
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <i className="fas fa-user-shield"></i>
                <span>Admin Panel</span>
              </div>
              <div className="dropdown-divider"></div>
              <button onClick={() => navigate('/reset-password')}>
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
              className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleSectionChange('dashboard')}
            >
              <i className="fas fa-chart-line"></i>
              <span>Dashboard</span>
            </Link>
            <Link 
              to="#" 
              className={`nav-item ${activeSection === 'manage-tpos' ? 'active' : ''}`}
              onClick={() => handleSectionChange('manage-tpos')}
            >
              <i className="fas fa-users-cog"></i>
              <span>Manage TPOs</span>
            </Link>
            <Link 
              to="#" 
              className={`nav-item ${activeSection === 'manage-students' ? 'active' : ''}`}
              onClick={() => handleSectionChange('manage-students')}
            >
              <i className="fas fa-user-graduate"></i>
              <span>Manage Students</span>
            </Link>
            <Link 
              to="#" 
              className={`nav-item ${activeSection === 'job-drives' ? 'active' : ''}`}
              onClick={() => handleSectionChange('job-drives')}
            >
              <i className="fas fa-briefcase"></i>
              <span>Job Drives</span>
            </Link>
            <Link 
              to="#" 
              className={`nav-item ${activeSection === 'exams' ? 'active' : ''}`}
              onClick={() => handleSectionChange('exams')}
            >
              <i className="fas fa-file-alt"></i>
              <span>Exams</span>
            </Link>
            {/* <Link 
              to="#" 
              className={`nav-item ${activeSection === 'logs' ? 'active' : ''}`}
              onClick={() => handleSectionChange('logs')}
            >
              <i className="fas fa-history"></i>
              <span>Logs</span>
            </Link> */}
            <Link 
              to="#" 
              className={`nav-item ${activeSection === 'announcements' ? 'active' : ''}`}
              onClick={() => handleSectionChange('announcements')}
            >
              <i className="fas fa-bullhorn"></i>
              <span>Announcements</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {activeSection === 'dashboard' && (
            <div className="stats-container">
              {statsArray.map(stat => (
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

          {activeSection === 'manage-tpos' && (
            <section className="management-section">
                <div className="section-header">
                    <h2>Manage TPOs</h2>
                    <button 
                        className="add-button" 
                        onClick={() => setShowAddTpoForm(!showAddTpoForm)}
                    >
                        {showAddTpoForm ? 'Cancel' : 'Add TPO'}
                    </button>
                </div>

                {/* Add TPO Form */}
                {showAddTpoForm && (
                    <div className="add-tpo-form-container">
                        <form onSubmit={handleSubmit} className="add-tpo-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={newTpo.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={newTpo.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="department">Department</label>
                                    <select
                                        id="department"
                                        name="department"
                                        value={newTpo.department}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="MCA">MCA</option>
                                        <option value="MBA">MBA</option>
                                        <option value="BCA">BCA</option>
                                        <option value="M.Tech">M.Tech</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={newTpo.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter password"
                                        minLength="6"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-button">
                                    {loading ? 'Adding...' : 'Add TPO'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search and Table sections remain the same */}
                <div className="search-container">
                    <div className="search-input">
                        <input 
                            type="text" 
                            placeholder="Search TPOs..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="search-icon">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(searchResults.length ? searchResults : tpos).map((tpo, index) => (
                                <tr key={index}>
                                    <td>{tpo.name}</td>
                                    <td>{tpo.email}</td>
                                    <td>{tpo.department}</td>
                                    <td>
                                        <button className="action-button edit">Edit</button>
                                        <button 
                                            className="action-button delete"
                                            onClick={() => handleRemoveTPO(tpo.id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
          )}

          {activeSection === 'manage-students' && (
            <section className="management-section">
              <div className="section-header">
                <h2>Student Management</h2>
                <div className="header-actions">
                  <button className="export-button" onClick={handleExportStudentData}>
                    <i className="fas fa-download"></i> Export Data
                  </button>
                </div>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input 
                    type="text" 
                    placeholder="Search students by name, USN, or department..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-section">
                  <div className="filter-row">
                    <select 
                      value={studentFilter.department} 
                      onChange={(e) => setStudentFilter(prev => ({...prev, department: e.target.value}))} 
                      className="filter-select"
                    >
                      <option value="">All Departments</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Electrical">Electrical</option>
                      <option value="MCA">MCA</option>
                      <option value="M.Tech">M.Tech</option>
                    </select>
                    <select 
                      value={studentFilter.semester} 
                      onChange={(e) => setStudentFilter(prev => ({...prev, semester: e.target.value}))} 
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
                      placeholder="Min Degree CGPA"
                      name="minDegreePercentage"
                      value={academicFilters.minDegreePercentage}
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
                        <th>Department</th>
                        <th>Semester</th>
                        <th>10th %</th>
                        <th>12th %</th>
                        <th>CGPA</th>
                        <th>Backlogs</th>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td>{student.name}</td>
                          <td>{student.usn}</td>
                          <td>{student.department}</td>
                          <td>{student.currentSemester || student.semester}</td>
                          <td>{student.percentage10 ? `${student.percentage10}%` : student.tenthPercentage ? `${student.tenthPercentage}%` : ''}</td>
                          <td>{student.percentage12 ? `${student.percentage12}%` : student.twelfthPercentage ? `${student.twelfthPercentage}%` : ''}</td>
                          <td>{student.currentSemesterCGPA || student.cgpa || student.percentageDegree || '-'}</td>
                          <td>{student.backlogs || 0}</td>
                          <td>{student.email}</td>
                          <td>
                            <button 
                              className="action-button edit"
                              onClick={() => handleEditStudent(student)}
                            >
                              Edit
                            </button>
                            <button 
                              className="action-button delete"
                              onClick={() => handleRemoveStudent(student._id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === 'job-drives' && (
            <section className="management-section">
              <div className="section-header">
                <h2>Job Drives Management</h2>
                <div className="header-actions">
                  <button className="add-button" onClick={() => setShowAddJobModal(true)}>
                    <i className="fas fa-plus"></i> Post New Job Drive
                  </button>
                  <button className="export-button">
                    <i className="fas fa-download"></i> Export Data
                  </button>
                </div>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input 
                    type="text" 
                    placeholder="Search jobs by company, role, or location..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-options">
                  <select 
                    value={jobFilter.type} 
                    onChange={(e) => handleJobFilter('type', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="">All Job Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                  <select 
                    value={jobFilter.sector} 
                    onChange={(e) => handleJobFilter('sector', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="">All Sectors</option>
                    <option value="IT">IT</option>
                    <option value="Core">Core</option>
                    <option value="Management">Management</option>
                    <option value="Other">Other</option>
                  </select>
                  <select 
                    value={jobFilter.status} 
                    onChange={(e) => handleJobFilter('status', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Type</th>
                      <th>Package (LPA)</th>
                      <th>Location</th>
                      <th>Applications</th>
                      <th>Status</th>
                      <th>Last Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>                    {loading ? (
                      <tr>
                        <td colSpan="9" className="text-center">
                          <div className="loading-spinner-small"></div>
                          <p>Loading jobs...</p>
                        </td>
                      </tr>
                    ) : filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center">
                          No job drives found
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr key={job._id}>
                          <td>
                            <div className="company-info">
                              <span className="company-name">{job.companyName}</span>
                              <span className="company-sector">{job.category}</span>
                            </div>
                          </td>
                          <td>{job.jobRole}</td>
                          <td>{job.type === 'full-time' ? 'Full Time' : 
                               job.type === 'internship' ? 'Internship' : 
                               job.type === 'contract' ? 'Contract' : job.type}</td>
                          <td>{job.package.basePay} {job.package.totalCTC && job.package.totalCTC > job.package.basePay && `- ${job.package.totalCTC}`}</td>
                          <td>{job.location || '-'}</td>
                          <td>
                            <div className="applications-stats">
                              <span className="total-applications">
                                {job.applications ? job.applications.length : 0}
                              </span>
                              {job.selectedStudents && job.selectedStudents.length > 0 && (
                                <span className="selected-count">
                                  {job.selectedStudents.length} selected
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${job.status.toLowerCase()}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            {job.driveDetails.lastDateToApply ? 
                              new Date(job.driveDetails.lastDateToApply).toLocaleDateString() : 
                              '-'}
                          </td>
                          <td>
                            <button 
                              className="action-button edit" 
                              onClick={() => handleEditJob(job)}
                            >
                              Edit
                            </button>
                            <button 
                              className="action-button delete"
                              onClick={() => handleJobDriveDelete(job._id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Add Job Modal */}
          {showAddJobModal && (
            <div className="job-form-modal">
              <div className="job-form-container">
                <h2>Post New Job Drive</h2>
                <form onSubmit={handleJobSubmit} className="job-form">
                  <div className="form-section">
                    <h3>Company Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="companyName" className="required-field">Company Name</label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={jobFormData.companyName}
                          onChange={handleJobInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="category" className="required-field">Sector</label>
                        <select 
                          id="category" 
                          name="category" 
                          value={jobFormData.category} 
                          onChange={handleJobInputChange} 
                          required
                        >
                          <option value="">Select Sector</option>
                          <option value="IT">IT</option>
                          <option value="Core">Core</option>
                          <option value="Management">Management</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="companyWebsite">Company Website</label>
                      <input
                        type="url"
                        id="companyWebsite"
                        name="companyWebsite"
                        value={jobFormData.companyWebsite}
                        onChange={handleJobInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Job Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="jobRole" className="required-field">Job Role</label>
                        <input
                          type="text"
                          id="jobRole"
                          name="jobRole"
                          value={jobFormData.jobRole}
                          onChange={handleJobInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="type" className="required-field">Job Type</label>
                        <select 
                          id="type" 
                          name="type" 
                          value={jobFormData.type} 
                          onChange={handleJobInputChange} 
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="full-time">Full Time</option>
                          <option value="internship">Internship</option>
                          <option value="contract">Contract</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="location">Job Location</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={jobFormData.location}
                          onChange={handleJobInputChange}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="description" className="required-field">Job Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={jobFormData.description}
                        onChange={handleJobInputChange}
                        required
                        rows="4"
                        placeholder="Describe job responsibilities, requirements, and other important details..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Package Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="package.basePay" className="required-field">Base Pay (LPA)</label>
                        <input
                          type="number"
                          id="package.basePay"
                          name="package.basePay"
                          value={jobFormData.package.basePay}
                          onChange={handleJobInputChange}
                          required
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="package.totalCTC">Total CTC (LPA)</label>
                        <input
                          type="number"
                          id="package.totalCTC"
                          name="package.totalCTC"
                          value={jobFormData.package.totalCTC}
                          onChange={handleJobInputChange}
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Eligibility Criteria</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="eligibility.minCGPA">Minimum CGPA</label>
                        <input
                          type="number"
                          id="eligibility.minCGPA"
                          name="eligibility.minCGPA"
                          value={jobFormData.eligibility.minCGPA}
                          onChange={handleJobInputChange}
                          min="0"
                          max="10"
                          step="0.1"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eligibility.maxBacklogs">Maximum Backlogs</label>
                        <input
                          type="number"
                          id="eligibility.maxBacklogs"
                          name="eligibility.maxBacklogs"
                          value={jobFormData.eligibility.maxBacklogs}
                          onChange={handleJobInputChange}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="eligibility.minTenthPercentage">Minimum 10th Percentage</label>
                        <input
                          type="number"
                          id="eligibility.minTenthPercentage"
                          name="eligibility.minTenthPercentage"
                          value={jobFormData.eligibility.minTenthPercentage}
                          onChange={handleJobInputChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eligibility.minTwelfthPercentage">Minimum 12th Percentage</label>
                        <input
                          type="number"
                          id="eligibility.minTwelfthPercentage"
                          name="eligibility.minTwelfthPercentage"
                          value={jobFormData.eligibility.minTwelfthPercentage}
                          onChange={handleJobInputChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="required-field">Eligible Branches</label>
                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            name="eligibility.branches"
                            value="Computer Science"
                            onChange={handleBranchSelection}
                            checked={jobFormData.eligibility.branches.includes("Computer Science")}
                          />
                          Computer Science
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            name="eligibility.branches"
                            value="Electronics"
                            onChange={handleBranchSelection}
                            checked={jobFormData.eligibility.branches.includes("Electronics")}
                          />
                          Electronics
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            name="eligibility.branches"
                            value="Mechanical"
                            onChange={handleBranchSelection}
                            checked={jobFormData.eligibility.branches.includes("Mechanical")}
                          />
                          Mechanical
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            name="eligibility.branches"
                            value="Civil"
                            onChange={handleBranchSelection}
                            checked={jobFormData.eligibility.branches.includes("Civil")}
                          />
                          Civil
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            name="eligibility.branches"
                            value="Electrical"
                            onChange={handleBranchSelection}
                            checked={jobFormData.eligibility.branches.includes("Electrical")}
                          />
                          Electrical
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            name="eligibility.branches"
                            value="MCA"
                            onChange={handleBranchSelection}
                            checked={jobFormData.eligibility.branches.includes("MCA")}
                          />
                          MCA
                        </label>
                      </div>
                      {jobFormData.eligibility.branches.length === 0 && (
                        <span className="validation-error">Please select at least one branch</span>
                      )}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Drive Schedule</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="driveDetails.startDate" className="required-field">Start Date</label>
                        <input
                          type="date"
                          id="driveDetails.startDate"
                          name="driveDetails.startDate"
                          value={jobFormData.driveDetails.startDate}
                          onChange={handleJobInputChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="driveDetails.lastDateToApply" className="required-field">Last Date to Apply</label>
                        <input
                          type="date"
                          id="driveDetails.lastDateToApply"
                          name="driveDetails.lastDateToApply"
                          value={jobFormData.driveDetails.lastDateToApply}
                          onChange={handleJobInputChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => setShowAddJobModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-button"
                    >
                      Post Job Drive
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeSection === 'exams' && (
            <section className="management-section">
              <div className="section-header">
                <h2>Exam Management</h2>
                <div className="header-actions">
                  <button className="export-button">
                    <i className="fas fa-download"></i> Export Results
                  </button>
                </div>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input 
                    type="text" 
                    placeholder="Search exams by title or type..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-options">
                  <select 
                    value={examFilter.type} 
                    onChange={(e) => handleExamFilter('type', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="">All Exam Types</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="programming">Programming</option>
                    <option value="english">English</option>
                  </select>
                  <select 
                    value={examFilter.status} 
                    onChange={(e) => handleExamFilter('status', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Total Marks</th>
                      <th>Status</th>
                      <th>Participants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center">
                          <div className="loading-spinner-small"></div>
                          <p>Loading exams...</p>
                        </td>
                      </tr>
                    ) : exams.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No exams found
                        </td>
                      </tr>
                    ) : (
                      exams.map((exam) => (
                        <tr key={exam._id}>
                          <td>{exam.title}</td>
                          <td>{exam.type ? exam.type.charAt(0).toUpperCase() + exam.type.slice(1) : '-'}</td>
                          <td>{exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString() : '-'}</td>
                          <td>{exam.duration} mins</td>
                          <td>{exam.totalMarks}</td>
                          <td>
                            <span className={`status-badge ${exam.status || 'upcoming'}`}>
                              {exam.status ? exam.status.charAt(0).toUpperCase() + exam.status.slice(1) : 'Upcoming'}
                            </span>
                          </td>
                          <td>
                            <div className="participants-stats">
                              <span className="total-participants">
                                {exam.participants ? exam.participants.length : 0}
                              </span>
                              {exam.results && (
                                <span className="passed-count">
                                  {exam.results.filter(r => r.passed).length} passed
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <button 
                              className="action-button delete"
                              onClick={() => handleDeleteExam(exam._id)}
                            >
                              {exam.status === 'upcoming' ? 'Cancel' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === 'logs' && (
            <section className="management-section">
              <div className="section-header">
                <h2>System Logs</h2>
                <div className="header-actions">
                  <button className="export-button" onClick={handleExportLogs}>
                    <i className="fas fa-download"></i> Export Logs
                  </button>
                </div>
              </div>

              <div className="search-container">
                <div className="search-input">
                  <input 
                    type="text" 
                    placeholder="Search logs by event, user, or details..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search-icon">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="filter-options">
                  <select 
                    value={logFilter?.status || ''}
                    onChange={(e) => setLogFilter(prev => ({...prev, status: e.target.value}))} 
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                  <select 
                    value={logFilter?.type || ''}
                    onChange={(e) => setLogFilter(prev => ({...prev, type: e.target.value}))} 
                    className="filter-select"
                  >
                    <option value="">All Events</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="create">Creation</option>
                    <option value="update">Updates</option>
                    <option value="delete">Deletion</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading logs...</p>
                </div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Event</th>
                          <th>User</th>
                          <th>Details</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length > 0 ? logs
                          .filter(log => {
                            // Apply status filter
                            if (logFilter?.status && log.status !== logFilter.status) return false;
                            
                            // Apply event type filter
                            if (logFilter?.type) {
                              const eventLower = log.event.toLowerCase();
                              if (logFilter.type === 'login' && !eventLower.includes('login')) return false;
                              if (logFilter.type === 'logout' && !eventLower.includes('logout')) return false;
                              if (logFilter.type === 'create' && !eventLower.includes('creat') && !eventLower.includes('add')) return false;
                              if (logFilter.type === 'update' && !eventLower.includes('updat') && !eventLower.includes('edit')) return false;
                              if (logFilter.type === 'delete' && !eventLower.includes('delet') && !eventLower.includes('remov')) return false;
                            }
                            
                            return true;
                          })
                          .map((log) => (
                            <tr key={log._id} className={`log-row ${log.status}`}>
                              <td>{new Date(log.date).toLocaleDateString()}</td>
                              <td>{typeof log.time === 'string' ? log.time : new Date(log.date).toLocaleTimeString()}</td>
                              <td>
                                <span className="log-event">
                                  {log.event}
                                </span>
                              </td>
                              <td>{log.user}</td>
                              <td className="log-details">{log.details}</td>
                              <td>
                                <span className={`status-badge ${log.status}`}>
                                  {log.status?.charAt(0).toUpperCase() + log.status?.slice(1)}
                                </span>
                              </td>
                            </tr>
                          )) : (
                          <tr>
                            <td colSpan="6" className="text-center">No logs found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <i className="fas fa-chevron-left"></i> Previous
                      </button>
                      
                      <div className="pagination-info">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <button
                        className="pagination-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === 'announcements' && (
            <section className="management-section">
              <div className="section-header">
                <h2>Announcements Management</h2>
                <button className="add-button" onClick={() => setShowAddAnnouncementModal(true)}>
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
                    onChange={(e) => handleAnnouncementFilter('type', e.target.value)} 
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
                    onChange={(e) => handleAnnouncementFilter('visibility', e.target.value)} 
                    className="filter-select"
                  >
                    <option value="">All Visibility</option>
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="tpos">TPOs Only</option>
                  </select>
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
                <div className="modal-overlay">
                  <div className="modal">
                    <h2>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h2>
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
                          <label htmlFor="attachments" className="file-upload-label">
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
                          {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Student Details</h2>
            <form onSubmit={handleUpdateStudent} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editingStudent.name || ''}
                    onChange={handleEditStudentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="usn">USN*</label>
                  <input
                    type="text"
                    id="usn"
                    name="usn"
                    value={editingStudent.usn || ''}
                    onChange={handleEditStudentInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department*</label>
                  <select
                    id="department"
                    name="department"
                    value={editingStudent.department || ''}
                    onChange={handleEditStudentInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="MCA">MCA</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="currentSemester">Semester*</label>
                  <select
                    id="currentSemester"
                    name="currentSemester"
                    value={editingStudent.currentSemester || editingStudent.semester || ''}
                    onChange={handleEditStudentInputChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                    <option value="7">7th Semester</option>
                    <option value="8">8th Semester</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editingStudent.email || ''}
                    onChange={handleEditStudentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={editingStudent.phoneNumber || ''}
                    onChange={handleEditStudentInputChange}
                    pattern="[0-9]{10}"
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="percentage10">10th Percentage</label>
                  <input
                    type="number"
                    id="percentage10"
                    name="percentage10"
                    value={editingStudent.percentage10 || editingStudent.tenthPercentage || ''}
                    onChange={handleEditStudentInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="percentage12">12th Percentage</label>
                  <input
                    type="number"
                    id="percentage12"
                    name="percentage12"
                    value={editingStudent.percentage12 || editingStudent.twelfthPercentage || ''}
                    onChange={handleEditStudentInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currentSemesterCGPA">CGPA</label>
                  <input
                    type="number"
                    id="currentSemesterCGPA"
                    name="currentSemesterCGPA"
                    value={editingStudent.currentSemesterCGPA || editingStudent.cgpa || editingStudent.percentageDegree || ''}
                    onChange={handleEditStudentInputChange}
                    min="0"
                    max="10"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="backlogs">Backlogs</label>
                  <input
                    type="number"
                    id="backlogs"
                    name="backlogs"
                    value={editingStudent.backlogs || 0}
                    onChange={handleEditStudentInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="placementStatus">Placement Status</label>
                  <select
                    id="placementStatus"
                    name="placementStatus"
                    value={editingStudent.placementStatus || 'Not Placed'}
                    onChange={handleEditStudentInputChange}
                  >
                    <option value="Not Placed">Not Placed</option>
                    <option value="Placed">Placed</option>
                    <option value="Offered">Offered</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowEditStudentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;