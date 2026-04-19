import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { 
  FaArrowLeft, FaBriefcase, FaBuilding, FaGlobe, FaTags, FaUserTie, FaClock,
  FaRupeeSign, FaChartLine, FaMapMarkerAlt, FaFileAlt, FaUserGraduate,
  FaCodeBranch, FaGraduationCap, FaExclamationCircle, FaPercentage, 
  FaCalendarAlt, FaCalendarDay, FaHourglassEnd, FaTasks, FaClipboardList,
  FaInfoCircle, FaTimesCircle, FaPaperPlane, FaPlus, FaTrashAlt, FaCheck,
  FaCheckCircle, FaExclamationTriangle, FaIndustry, FaSave
} from 'react-icons/fa';
import Header from './Header';
import Footer from './footer';
import api from '../services/api';
import '../styles/AddJobDrivePage.css';

const createEmptyJobForm = () => ({
    companyName: '',
    companyWebsite: '',
    category: 'IT',
    jobRole: '',
    type: 'full-time',
    package: {
        basePay: '',
        totalCTC: ''
    },
    location: '',
    description: '',
    eligibility: {
        branches: [],
        minCGPA: '',
        maxBacklogs: '',
        minTenthPercentage: '',
        minTwelfthPercentage: ''
    },
    driveDetails: {
        startDate: '',
        lastDateToApply: '',
        rounds: []
    },
    status: 'published'
});

const formatDateForInput = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value?.split?.('T')?.[0] || '';
    }

    return date.toISOString().split('T')[0];
};

const mapJobResponseToForm = (job) => {
    const emptyForm = createEmptyJobForm();

    if (!job) {
        return emptyForm;
    }

    return {
        ...emptyForm,
        companyName: job.companyName || emptyForm.companyName,
        companyWebsite: job.companyWebsite || emptyForm.companyWebsite,
        category: job.category || emptyForm.category,
        jobRole: job.jobRole || emptyForm.jobRole,
        type: job.type || emptyForm.type,
        package: {
            basePay: job.package?.basePay ?? emptyForm.package.basePay,
            totalCTC: job.package?.totalCTC ?? emptyForm.package.totalCTC
        },
        location: job.location || emptyForm.location,
        description: job.description || emptyForm.description,
        eligibility: {
            branches: Array.isArray(job.eligibility?.branches) ? job.eligibility.branches : emptyForm.eligibility.branches,
            minCGPA: job.eligibility?.minCGPA ?? emptyForm.eligibility.minCGPA,
            maxBacklogs: job.eligibility?.maxBacklogs ?? emptyForm.eligibility.maxBacklogs,
            minTenthPercentage: job.eligibility?.minTenthPercentage ?? emptyForm.eligibility.minTenthPercentage,
            minTwelfthPercentage: job.eligibility?.minTwelfthPercentage ?? emptyForm.eligibility.minTwelfthPercentage
        },
        driveDetails: {
            startDate: formatDateForInput(job.driveDetails?.startDate) || emptyForm.driveDetails.startDate,
            lastDateToApply: formatDateForInput(job.driveDetails?.lastDateToApply) || emptyForm.driveDetails.lastDateToApply,
            rounds: Array.isArray(job.driveDetails?.rounds)
                ? job.driveDetails.rounds.map((round, index) => ({
                    roundNumber: round.roundNumber || index + 1,
                    type: round.type || '',
                    date: formatDateForInput(round.date),
                    description: round.description || '',
                    venue: round.venue || ''
                }))
                : emptyForm.driveDetails.rounds
        },
        status: job.status || emptyForm.status
    };
};

const AddJobDrivePage = ({ mode = 'create', jobId = null }) => {
    const navigate = useNavigate();
    const isEditMode = mode === 'edit';
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [pageError, setPageError] = useState('');
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [currentStep, setCurrentStep] = useState(1);
    const [progressPercent, setProgressPercent] = useState(25);
    const [validationErrors, setValidationErrors] = useState({});
    const [jobFormData, setJobFormData] = useState(createEmptyJobForm);
    
    const pageTitle = isEditMode ? 'Edit Job Drive' : 'Post New Job Drive';
    const pageSubtitle = isEditMode 
        ? 'Update the details of this job opportunity'
        : 'Add a new job opportunity for students';
    const successMessage = isEditMode
        ? 'Job drive updated successfully! Redirecting to dashboard...'
        : 'Job drive created successfully! Redirecting to dashboard...';
    const submitButtonLabel = isEditMode ? 'Save Changes' : 'Post Job Drive';
    const submittingLabel = isEditMode ? 'Saving...' : 'Posting...';
    
    const loadJobDetails = useCallback(async () => {
        if (!isEditMode) {
            return;
        }

        if (!jobId) {
            setPageError('Job reference is missing. Please return to the dashboard.');
            setPageLoading(false);
            return;
        }

        setPageLoading(true);
        setPageError('');
        try {
            const response = await api.get(`/tpo/jobs/${jobId}`);
            setJobFormData(mapJobResponseToForm(response.data));
            setValidationErrors({});
            setSuccess(false);
            setSubmitError('');
        } catch (error) {
            console.error('Error fetching job drive:', error);
            setPageError(error.response?.data?.message || 'Failed to load job drive details. Please try again.');
        } finally {
            setPageLoading(false);
        }
    }, [isEditMode, jobId]);
    
    useEffect(() => {
        loadJobDetails();
    }, [loadJobDetails]);
    
    // Effect to update progress when form changes
    useEffect(() => {
        if(jobFormData) {
            calculateProgress();
        }
    }, [jobFormData]);

    // Calculate form completion progress
    const calculateProgress = () => {
        let totalFields = 10; // Base required fields
        let filledFields = 0;
        
        // Company details
        if (jobFormData.companyName) filledFields++;
        
        // Job details
        if (jobFormData.jobRole) filledFields++;
        if (jobFormData.location) filledFields++;
        if (jobFormData.description) filledFields++;
        if (jobFormData.package.basePay) filledFields++;
        
        // Eligibility
        if (jobFormData.eligibility.branches.length > 0) filledFields++;
        
        // Drive schedule
        if (jobFormData.driveDetails.startDate) filledFields++;
        if (jobFormData.driveDetails.lastDateToApply) filledFields++;
        
        // Add points for rounds
        if (jobFormData.driveDetails.rounds.length > 0) {
            filledFields++;
            // Check if rounds are filled out
            const filledRounds = jobFormData.driveDetails.rounds.filter(r => r.type && r.date);
            if (filledRounds.length === jobFormData.driveDetails.rounds.length && filledRounds.length > 0) {
                filledFields++;
            }
        }
        
        const progress = Math.min(Math.round((filledFields / totalFields) * 100), 100);
        setProgressPercent(progress);
        
        // Update step
        if (progress < 33) setCurrentStep(1);
        else if (progress < 66) setCurrentStep(2);
        else if (progress < 100) setCurrentStep(3);
        else setCurrentStep(4);
    };
      // Validate form before submission
    const validateForm = () => {
        const errors = {};
        
        if (!jobFormData.companyName.trim()) 
            errors.companyName = 'Company name is required';
            
        if (!jobFormData.jobRole.trim())
            errors.jobRole = 'Job role is required';
            
        if (!jobFormData.location.trim())
            errors.location = 'Location is required';
            
        if (!jobFormData.description.trim())
            errors.description = 'Job description is required';
            
        if (!jobFormData.package.basePay)
            errors.basePay = 'Base pay is required';
            
        if (jobFormData.eligibility.branches.length === 0)
            errors.branches = 'At least one branch must be selected';
            
        // Add validation for minCGPA which is required in the backend
        if (!jobFormData.eligibility.minCGPA)
            errors.minCGPA = 'Minimum CGPA is required';
            
        if (!jobFormData.driveDetails.startDate)
            errors.startDate = 'Drive start date is required';
            
        if (!jobFormData.driveDetails.lastDateToApply)
            errors.lastDateToApply = 'Last date to apply is required';
            
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
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

        // Update progress based on form section
        updateFormProgress(name);
    };

    const updateFormProgress = (fieldName) => {
        // Update current step and progress percentage based on field name
        if (fieldName.includes('companyName') || fieldName.includes('companyWebsite') || fieldName === 'category') {
            if (currentStep < 2) {
                setCurrentStep(1);
                setProgressPercent(25);
            }
        } else if (fieldName.includes('jobRole') || fieldName.includes('type') || 
                  fieldName.includes('package') || fieldName.includes('location') || 
                  fieldName === 'description') {
            if (currentStep < 3 && jobFormData.companyName) {
                setCurrentStep(2);
                setProgressPercent(50);
            }
        } else if (fieldName.includes('eligibility')) {
            if (currentStep < 4 && jobFormData.companyName && jobFormData.jobRole) {
                setCurrentStep(3);
                setProgressPercent(75);
            }
        } else if (fieldName.includes('driveDetails')) {
            if (jobFormData.companyName && jobFormData.jobRole && jobFormData.eligibility.branches.length > 0) {
                setCurrentStep(4);
                setProgressPercent(100);
            }
        }
    };    const handleBranchSelection = (e) => {
        const { value, checked } = e.target;
        setJobFormData(prev => {
            const updatedFormData = {
                ...prev,
                eligibility: {
                    ...prev.eligibility,
                    branches: checked 
                        ? [...prev.eligibility.branches, value]
                        : prev.eligibility.branches.filter(branch => branch !== value)
                }
            };
            
            // Update progress when branches are selected
            if (updatedFormData.eligibility.branches.length > 0 && 
                updatedFormData.companyName && 
                updatedFormData.jobRole) {
                if (currentStep < 3) {
                    setCurrentStep(3);
                    setProgressPercent(75);
                }
            }
            
            return updatedFormData;
        });
    };    const handleAddRound = () => {
        const newRound = {
            roundNumber: jobFormData.driveDetails.rounds.length + 1,
            type: '',
            date: '',
            description: '',
            venue: ''
        };
        
        setJobFormData(prev => {
            const updatedFormData = {
                ...prev,
                driveDetails: {
                    ...prev.driveDetails,
                    rounds: [...prev.driveDetails.rounds, newRound]
                }
            };
            
            // Update progress if we're adding rounds and other sections are complete
            if (updatedFormData.companyName && 
                updatedFormData.jobRole && 
                updatedFormData.eligibility.branches.length > 0) {
                setCurrentStep(4);
                setProgressPercent(100);
            }
            
            return updatedFormData;
        });
    };

    const handleRoundChange = (index, field, value) => {
        setJobFormData(prev => ({
            ...prev,
            driveDetails: {
                ...prev.driveDetails,
                rounds: prev.driveDetails.rounds.map((round, i) => 
                    i === index ? { ...round, [field]: value } : round
                )
            }
        }));
    };

    const handleRemoveRound = (index) => {
        setJobFormData(prev => ({
            ...prev,
            driveDetails: {
                ...prev.driveDetails,
                rounds: prev.driveDetails.rounds.filter((_, i) => i !== index)
                    .map((round, i) => ({ ...round, roundNumber: i + 1 }))
            }
        }));
    };

    const handleSubmitJobDrive = async (e) => {
        e.preventDefault();

        if (pageLoading) {
            return;
        }

        setLoading(true);
        setSubmitError('');
        
        // Validate form data
        if (!validateForm()) {
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        try {
            if (isEditMode) {
                if (!jobId) {
                    throw new Error('Missing job identifier');
                }
                await api.put(`/tpo/jobs/${jobId}`, jobFormData);
            } else {
                await api.post('/tpo/jobs', jobFormData);
            }
            setSuccess(true);
            setProgressPercent(100);
            setCurrentStep(4);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                navigate('/tpo-dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error saving job drive:', error);
            const message = error.response?.data?.message || (
                isEditMode
                    ? 'Failed to update job drive. Please try again.'
                    : 'Failed to create job drive. Please try again.'
            );
            setSubmitError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-job-drive-page">
            <Header />
            
            <div className="top-navigation-bar">
                <Container fluid>
                    <Button 
                        variant="outline-light" 
                        onClick={() => navigate('/tpo-dashboard')}
                        className="back-btn"
                    >
                        <FaArrowLeft className="me-2" />
                        Back to Dashboard
                    </Button>
                    <div className="job-drive-header text-center">
                        <div className="job-title-container">
                            <h2 className="page-title mb-0">{pageTitle}</h2>
                            <p className="page-subtitle">{pageSubtitle}</p>
                        </div>
                    </div>
                </Container>
            </div>
            
            <div className="page-content">
                <Container fluid className="py-4">
                    {!pageLoading && !pageError && success && (
                        <Alert variant="success" className="mb-4 success-alert">
                            <FaCheckCircle className="me-2" />
                            {successMessage}
                        </Alert>
                    )}
                    {!pageLoading && !pageError && submitError && (
                        <Alert variant="danger" className="mb-4 error-alert">
                            <FaExclamationTriangle className="me-2" />
                            {submitError}
                        </Alert>
                    )}
                    
                    {/* Validation Errors Summary */}
                    {!pageLoading && !pageError && Object.keys(validationErrors).length > 0 && (
                        <Alert variant="warning" className="mb-4 validation-alert">
                            <h5 className="alert-heading">
                                <FaExclamationCircle className="me-2" />
                                Please correct the following issues:
                            </h5>
                            <ul className="validation-error-list mb-0">
                                {Object.values(validationErrors).map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </Alert>
                    )}
                    <Card className="job-form-card">
                        <Card.Body className="p-4">
                            {pageLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status" variant="primary">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                    <p className="mt-3 text-muted">Loading job drive details...</p>
                                </div>
                            ) : pageError ? (
                                <div className="text-center">
                                    <Alert variant="danger" className="mb-4 error-alert">
                                        <FaExclamationTriangle className="me-2" />
                                        {pageError}
                                    </Alert>
                                    {isEditMode && (
                                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                                            <Button variant="primary" onClick={loadJobDetails}>
                                                Retry Loading
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => navigate('/tpo-dashboard')}
                                            >
                                                Back to Dashboard
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                            <Form onSubmit={handleSubmitJobDrive} className="job-form">
                                <div className={`form-section ${currentStep === 1 ? 'active-section' : ''}`}>
                                    <div className="section-header">
                                        <div className="section-icon">
                                            <FaBuilding />
                                        </div>
                                        <h5 className="section-title">
                                            Company Details
                                            {currentStep > 1 && <FaCheck className="section-complete-icon" />}
                                        </h5>
                                    </div>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Company Name *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-industry input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="text"
                                                        name="companyName"
                                                        value={jobFormData.companyName}
                                                        onChange={handleJobInputChange}
                                                        required
                                                        disabled={loading}
                                                        placeholder="Enter company name"
                                                        className="ps-4"
                                                    />
                                                </div>
                                                {validationErrors.companyName && (
                                                    <div className="text-danger mt-2">
                                                        <i className="fas fa-exclamation-circle me-1"></i>
                                                        {validationErrors.companyName}
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Company Website</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-globe input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="url"
                                                        name="companyWebsite"
                                                        value={jobFormData.companyWebsite}
                                                        onChange={handleJobInputChange}
                                                        placeholder="https://example.com"
                                                        disabled={loading}
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Category *</Form.Label>
                                        <div className="input-icon-wrapper">
                                            <i className="fas fa-tags input-icon-prefix"></i>
                                            <Form.Control
                                                as="select"
                                                name="category"
                                                value={jobFormData.category}
                                                onChange={handleJobInputChange}
                                                required
                                                disabled={loading}
                                                className="ps-4"
                                            >
                                                <option value="IT">IT</option>
                                                <option value="Core">Core</option>
                                                <option value="Management">Management</option>
                                            </Form.Control>
                                        </div>
                                    </Form.Group>
                                </div>                                <div className={`form-section ${currentStep === 2 ? 'active-section' : ''}`}>
                                    <div className="section-header">
                                        <div className="section-icon">
                                            <FaBriefcase />
                                        </div>
                                        <h5 className="section-title">
                                            Job Details
                                            {currentStep > 2 && <FaCheck className="section-complete-icon" />}
                                        </h5>
                                    </div>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Job Role *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-user-tie input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="text"
                                                        name="jobRole"
                                                        value={jobFormData.jobRole}
                                                        onChange={handleJobInputChange}
                                                        required
                                                        disabled={loading}
                                                        placeholder="e.g. Software Engineer"
                                                        className="ps-4"
                                                    />
                                                </div>
                                                {validationErrors.jobRole && (
                                                    <div className="text-danger mt-2">
                                                        <i className="fas fa-exclamation-circle me-1"></i>
                                                        {validationErrors.jobRole}
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Job Type *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-clock input-icon-prefix"></i>
                                                    <Form.Control
                                                        as="select"
                                                        name="type"
                                                        value={jobFormData.type}
                                                        onChange={handleJobInputChange}
                                                        required
                                                        disabled={loading}
                                                        className="ps-4"
                                                    >
                                                        <option value="full-time">Full Time</option>
                                                        <option value="internship">Internship</option>
                                                        <option value="contract">Contract</option>
                                                    </Form.Control>
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Base Pay (LPA) *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-rupee-sign input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="number"
                                                        name="package.basePay"
                                                        value={jobFormData.package.basePay}
                                                        onChange={handleJobInputChange}
                                                        required
                                                        min="0"
                                                        step="0.1"
                                                        disabled={loading}
                                                        placeholder="e.g. 8.5"
                                                        className="ps-4"
                                                    />
                                                </div>
                                                {validationErrors.basePay && (
                                                    <div className="text-danger mt-2">
                                                        <i className="fas fa-exclamation-circle me-1"></i>
                                                        {validationErrors.basePay}
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Total CTC (LPA)</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-chart-line input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="number"
                                                        name="package.totalCTC"
                                                        value={jobFormData.package.totalCTC}
                                                        onChange={handleJobInputChange}
                                                        min="0"
                                                        step="0.1"
                                                        disabled={loading}
                                                        placeholder="e.g. 12.0"
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>                                    <Form.Group className="mb-3">
                                        <Form.Label>Location *</Form.Label>
                                        <div className="input-icon-wrapper">
                                            <i className="fas fa-map-marker-alt input-icon-prefix"></i>
                                            <Form.Control
                                                type="text"
                                                name="location"
                                                value={jobFormData.location}
                                                onChange={handleJobInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="e.g. Bangalore, Hyderabad, Remote"
                                                className="ps-4"
                                            />
                                        </div>
                                        {validationErrors.location && (
                                            <div className="text-danger mt-2">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {validationErrors.location}
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Job Description *</Form.Label>
                                        <div className="input-icon-wrapper">
                                            <i className="fas fa-file-alt input-icon-prefix" style={{top: '15px'}}></i>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                name="description"
                                                value={jobFormData.description}
                                                onChange={handleJobInputChange}
                                                required
                                                disabled={loading}
                                                placeholder="Enter detailed job description, responsibilities, and expectations"
                                                className="ps-4"
                                            />
                                        </div>
                                        {validationErrors.description && (
                                            <div className="text-danger mt-2">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {validationErrors.description}
                                            </div>
                                        )}
                                    </Form.Group>
                                </div>                                <div className={`form-section ${currentStep === 3 ? 'active-section' : ''}`}>
                                    <div className="section-header">
                                        <div className="section-icon">
                                            <FaUserGraduate />
                                        </div>
                                        <h5 className="section-title">
                                            Eligibility Criteria
                                            {currentStep > 3 && <FaCheck className="section-complete-icon" />}
                                        </h5>
                                    </div>
                                    <div className="checkbox-group mb-3">                                        <div className="d-flex align-items-center mb-2">
                                            <FaCodeBranch className="me-2" style={{ color: '#667eea' }} />
                                            <Form.Label className="mb-0">Eligible Branches *</Form.Label>
                                        </div>
                                        <div className="branches-grid">
                                            {['Computer Science', 'Information Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'MCA'].map(branch => (
                                                <Form.Check
                                                    key={branch}
                                                    type="checkbox"
                                                    label={branch}
                                                    name="eligibility.branches"
                                                    value={branch}
                                                    checked={jobFormData.eligibility.branches.includes(branch)}
                                                    onChange={handleBranchSelection}
                                                    disabled={loading}
                                                    className="branch-checkbox"
                                                    id={`branch-${branch.replace(/\s+/g, '-').toLowerCase()}`}
                                                />
                                            ))}
                                        </div>
                                        {jobFormData.eligibility.branches.length === 0 && (
                                            <div className="text-danger mt-2">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                Please select at least one branch
                                            </div>
                                        )}
                                    </div>                                    <Row>
                                        <Col md={6}>                                            <Form.Group className="mb-3">
                                                <Form.Label>Minimum CGPA *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-graduation-cap input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="number"
                                                        name="eligibility.minCGPA"
                                                        value={jobFormData.eligibility.minCGPA}
                                                        onChange={handleJobInputChange}
                                                        min="0"
                                                        max="10"
                                                        step="0.01"
                                                        required
                                                        disabled={loading}
                                                        placeholder="e.g. 7.5"
                                                        className="ps-4"
                                                    />
                                                </div>
                                                {validationErrors.minCGPA && (
                                                    <div className="text-danger mt-2">
                                                        <i className="fas fa-exclamation-circle me-1"></i>
                                                        {validationErrors.minCGPA}
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Maximum Backlogs</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-exclamation-circle input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="number"
                                                        name="eligibility.maxBacklogs"
                                                        value={jobFormData.eligibility.maxBacklogs}
                                                        onChange={handleJobInputChange}
                                                        min="0"
                                                        disabled={loading}
                                                        placeholder="e.g. 0"
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Minimum 10th Percentage</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-percentage input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="number"
                                                        name="eligibility.minTenthPercentage"
                                                        value={jobFormData.eligibility.minTenthPercentage}
                                                        onChange={handleJobInputChange}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        disabled={loading}
                                                        placeholder="e.g. 70"
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Minimum 12th Percentage</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-percentage input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="number"
                                                        name="eligibility.minTwelfthPercentage"
                                                        value={jobFormData.eligibility.minTwelfthPercentage}
                                                        onChange={handleJobInputChange}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        disabled={loading}
                                                        placeholder="e.g. 70"
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>                                <div className={`form-section ${currentStep === 4 ? 'active-section' : ''}`}>
                                    <div className="section-header">                                        <div className="section-icon">
                                            <FaCalendarAlt />
                                        </div>
                                        <h5 className="section-title">
                                            Drive Schedule
                                            {currentStep > 4 && <FaCheck className="section-complete-icon" />}
                                        </h5>
                                    </div>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Drive Start Date *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-calendar-day input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="date"
                                                        name="driveDetails.startDate"
                                                        value={jobFormData.driveDetails.startDate}
                                                        onChange={handleJobInputChange}
                                                        required
                                                        disabled={loading}
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Last Date to Apply *</Form.Label>
                                                <div className="input-icon-wrapper">
                                                    <i className="fas fa-hourglass-end input-icon-prefix"></i>
                                                    <Form.Control
                                                        type="date"
                                                        name="driveDetails.lastDateToApply"
                                                        value={jobFormData.driveDetails.lastDateToApply}
                                                        onChange={handleJobInputChange}
                                                        required
                                                        disabled={loading}
                                                        className="ps-4"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="rounds-section mt-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">                                            <div className="d-flex align-items-center">
                                                <FaTasks className="me-2" style={{ color: '#667eea' }} />
                                                <h6 className="rounds-title mb-0">Selection Rounds</h6>
                                            </div>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={handleAddRound}
                                                disabled={loading}
                                                className="add-round-btn"
                                            >
                                                <FaPlus className="me-1" /> Add Round
                                            </Button>
                                        </div>
                                          {jobFormData.driveDetails.rounds.map((round, index) => (
                                            <div key={index} className="round-item mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h6 className="round-title">Round {round.roundNumber}</h6>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleRemoveRound(index)}
                                                        disabled={loading}
                                                        className="remove-round-btn"
                                                        title="Remove round"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </Button>
                                                </div>                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Round Type</Form.Label>
                                                            <div className="input-icon-wrapper">
                                                                <i className="fas fa-clipboard-list input-icon-prefix"></i>
                                                                <Form.Control
                                                                    as="select"
                                                                    value={round.type}
                                                                    onChange={(e) => handleRoundChange(index, 'type', e.target.value)}
                                                                    disabled={loading}
                                                                    className="ps-4"
                                                                >
                                                                    <option value="">Select Type</option>
                                                                    <option value="aptitude">Aptitude Test</option>
                                                                    <option value="technical">Technical Round</option>
                                                                    <option value="coding">Coding Round</option>
                                                                    <option value="interview">Interview</option>
                                                                    <option value="hr">HR Round</option>
                                                                </Form.Control>
                                                            </div>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Date</Form.Label>
                                                            <div className="input-icon-wrapper">
                                                                <i className="fas fa-calendar-day input-icon-prefix"></i>
                                                                <Form.Control
                                                                    type="date"
                                                                    value={round.date}
                                                                    onChange={(e) => handleRoundChange(index, 'date', e.target.value)}
                                                                    disabled={loading}
                                                                    className="ps-4"
                                                                />
                                                            </div>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>                                                <Form.Group className="mb-3">
                                                    <Form.Label>Round Description</Form.Label>
                                                    <div className="input-icon-wrapper">
                                                        <i className="fas fa-info-circle input-icon-prefix"></i>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            value={round.description}
                                                            onChange={(e) => handleRoundChange(index, 'description', e.target.value)}
                                                            disabled={loading}
                                                            placeholder="Describe the round details"
                                                            className="ps-4"
                                                        />
                                                    </div>
                                                </Form.Group>
                                                <Form.Group className="mb-0">
                                                    <Form.Label>Venue</Form.Label>
                                                    <div className="input-icon-wrapper">
                                                        <i className="fas fa-map-marker-alt input-icon-prefix"></i>
                                                        <Form.Control
                                                            type="text"
                                                            value={round.venue}
                                                            onChange={(e) => handleRoundChange(index, 'venue', e.target.value)}
                                                            disabled={loading}
                                                            placeholder="Enter round venue"
                                                            className="ps-4"
                                                        />
                                                    </div>
                                                </Form.Group>
                                            </div>
                                        ))}
                                    </div>
                                </div>                                <div className="form-actions mt-5">
                                    <div className="form-actions-container">
                                        <div className="action-buttons-row">
                                            <Button 
                                                variant="light" 
                                                onClick={() => navigate('/tpo-dashboard')}
                                                disabled={loading}
                                                className="action-btn cancel-btn"
                                            >
                                                <FaTimesCircle className="me-2" />
                                                Cancel
                                            </Button>
                                            
                                            <div className="d-flex align-items-center">
                                                {!loading && (
                                                    <div className="completion-indicator me-3">
                                                        <FaInfoCircle className="me-2 text-primary" />
                                                        <span className="completion-text">Form Completion: {progressPercent}%</span>
                                                    </div>
                                                )}
                                                
                                                <Button 
                                                    variant="primary" 
                                                    type="submit"
                                                    disabled={loading || jobFormData.eligibility.branches.length === 0}
                                                    className="action-btn submit-btn"
                                                    title={jobFormData.eligibility.branches.length === 0 ? "Please select at least one eligible branch" : ""}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            {submittingLabel}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {isEditMode ? (
                                                                <FaSave className="me-2" />
                                                            ) : (
                                                                <FaPaperPlane className="me-2" />
                                                            )}
                                                            {submitButtonLabel}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {!loading && (
                                            <div className="text-center mt-3">
                                                <small className="d-block text-muted">
                                                    <FaInfoCircle className="me-1" />
                                                    {isEditMode 
                                                        ? 'Changes will be saved immediately after submission'
                                                        : 'Job drive will be published immediately after submission'}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Form>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            </div>
            
            <Footer />
        </div>
    );
};

export default AddJobDrivePage;
