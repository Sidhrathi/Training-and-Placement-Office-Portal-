import api from './api';

// Authentication
export const login = (credentials) => api.post('/admin/login', credentials);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  delete api.defaults.headers.common['Authorization'];
};

export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'admin';
};

// Dashboard Stats
export const getDashboardStats = () => api.get('/admin/stats');

// TPO Management
export const getAllTPOs = () => api.get('/admin/tpos');
export const createTPO = (data) => api.post('/admin/tpos', data);
export const updateTPO = (id, data) => api.put(`/admin/tpos/${id}`, data);
export const removeTPO = (id) => api.delete(`/admin/tpos/${id}`);
export const searchTPOs = (query) => api.get(`/admin/tpos/search?q=${query}`);

// Student Management
export const getAllStudents = () => api.get('/admin/students');
export const getStudentById = (id) => api.get(`/admin/students/${id}`);
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data);
export const removeStudent = (id) => api.delete(`/admin/students/${id}`);
export const searchStudents = (query) => api.get(`/admin/search/students?query=${query}`);

// Job Drives
export const getAllJobDrives = () => api.get('/admin/job-drives');
export const getJobDriveById = (id) => api.get(`/admin/job-drives/${id}`);
export const createJobDrive = (data) => api.post('/admin/job-drives', data);
export const updateJobDrive = (id, data) => api.put(`/admin/job-drives/${id}`, data);
export const deleteJobDrive = (id) => api.delete(`/admin/job-drives/${id}`);
export const searchJobDrives = (query) => api.get(`/admin/job-drives/search?q=${query}`);
export const getJobDriveStats = (id) => api.get(`/admin/job-drives/${id}/stats`);
export const exportJobDrives = () => api.get('/admin/job-drives/export', { responseType: 'blob' });

// Exams
export const getAllExams = () => api.get('/admin/exams');
export const getExamById = (id) => api.get(`/admin/exams/${id}`);
export const createExam = (data) => api.post('/admin/exams', data);
export const updateExam = (id, data) => api.put(`/admin/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/admin/exams/${id}`);
export const searchExams = (query) => api.get(`/admin/exams/search?q=${query}`);
export const getExamResults = (examId) => api.get(`/admin/exams/${examId}/results`);
export const exportExamResults = (examId) => api.get(`/admin/exams/${examId}/results/export`, { responseType: 'blob' });

// Logs
export const getLogs = (page = 1, limit = 20) => api.get(`/admin/logs?page=${page}&limit=${limit}`);
export const searchLogs = (query) => api.get(`/admin/logs/search?q=${query}`);
export const exportLogs = () => api.get('/admin/logs/export', { responseType: 'blob' });

// Announcements
export const getAllAnnouncements = () => api.get('/tpo/announcements');
export const getAnnouncementById = (id) => api.get(`/admin/announcements/${id}`);
export const createAnnouncement = (data) => api.post('/admin/announcements', data);
export const updateAnnouncement = (id, data) => api.put(`/admin/announcements/${id}`, data);
export const deleteAnnouncement = (id) => api.delete(`/admin/announcements/${id}`);
export const searchAnnouncements = (query) => api.get(`/admin/announcements/search?q=${query}`);