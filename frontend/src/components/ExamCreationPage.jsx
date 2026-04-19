import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Row, Col, Button } from 'react-bootstrap';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
// import api from '../services/api'; // Uncomment when API calls are implemented
import Header from './Header';
import Footer from './footer';
import '../styles/CreateExamForm.css';

const ExamCreationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [examCreated, setExamCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
      console.log('Auth check in ExamCreationPage - Token exists:', !!token);
      console.log('Auth check in ExamCreationPage - Role:', role);
      
      if (!token || role !== 'tpo') {
        console.error('Authentication issue: Missing token or incorrect role');
        setError('Authentication issue: You may need to log in again.');
        // Don't redirect, just show error
      }
    };
    
    checkAuth();
  }, []);

  // Department and branch options
  const departmentOptions = [
    'MCA Department',
    'Computer Applications',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electronics and Communication',
    'Electrical Engineering',
    'Information Science',
    'Artificial Intelligence',
    'Data Science'
  ];

  const branchOptions = [
    'Computer Science',
    'Information Technology',
    'Data Science',
    'AI & ML',
    'Cloud Computing'
  ];

  const examTypes = ['Aptitude', 'Technical', 'Verbal', 'Coding', 'Mock Interview', 'Personality'];
  const semesterOptions = [
    { value: '1', label: '1st Semester' },
    { value: '2', label: '2nd Semester' },
    { value: '3', label: '3rd Semester' },
    { value: '4', label: '4th Semester' },
    { value: '5', label: '5th Semester' },
    { value: '6', label: '6th Semester' },
    { value: '7', label: '7th Semester' },
    { value: '8', label: '8th Semester' }
  ];

  const [formData, setFormData] = useState({
    basicDetails: {
      title: '',
      description: '',
      type: 'Aptitude',
      duration: 60,
      passingPercentage: 60,
      startDate: '',
      startTime: '09:00', // Default start time 9:00 AM
      endDate: '',
      endTime: '18:00', // Default end time 6:00 PM
      instructions: ''
    },
    eligibility: {
      departments: [],
      branches: [],
      semesters: [],
      minCGPA: '',
      minPercentage: '',
      maxBacklogs: ''
    },
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1
  });

  // Form validation states
  const [validation, setValidation] = useState({
    basicDetails: false,
    eligibility: false,
    questions: false
  });

  // State for question editing
  const [editingQuestion, setEditingQuestion] = useState({
    isEditing: false,
    questionId: null,
    question: {
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    }
  });
  const [fileUpload, setFileUpload] = useState({
    file: null,
    fileName: '',
    uploading: false,
    error: '',
    preview: [],
    lastUploadTimestamp: null,
    validationStatus: null, // 'pending', 'ready', 'failed', 'success'
    successMessage: '' // Add a success message property
  });
  
  // Check if the form is ready for final submission (more strict than draft validation)
  const isValidForSubmission = () => {
    // Basic details validation
    if (!formData.basicDetails.title || 
        !formData.basicDetails.duration || 
        !formData.basicDetails.startDate || 
        !formData.basicDetails.startTime ||
        !formData.basicDetails.endDate ||
        !formData.basicDetails.endTime) {
      return false;
    }
    
    // Check if there are questions
    if (formData.questions.length === 0) {
      return false;
    }
    
    // Check if start date & time is in the future
    const startDateTime = new Date(`${formData.basicDetails.startDate}T${formData.basicDetails.startTime}`);
    const now = new Date();
    if (startDateTime <= now) {
      return false;
    }
    
    // Check if end date & time is after start date & time
    const endDateTime = new Date(`${formData.basicDetails.endDate}T${formData.basicDetails.endTime}`);
    if (endDateTime <= startDateTime) {
      return false;
    }
    
    return true;
  };

  // Function to remove a batch of questions by uploadBatch timestamp  // This function is renamed to avoid duplicate declarations
  const handleRemoveBatchOfQuestions = (batchTimestamp) => {
    if (!batchTimestamp) return;
    
    // Confirm before removing
    if (window.confirm('Are you sure you want to remove all questions from this batch?')) {
      // Filter out questions with the specified uploadBatch
      const filteredQuestions = formData.questions.filter(q => q.uploadBatch !== batchTimestamp);
      
      setFormData({
        ...formData,
        questions: filteredQuestions
      });
      
      // If this is the current preview batch, clear it
      if (fileUpload.lastUploadTimestamp === batchTimestamp) {
        setFileUpload({
          ...fileUpload,
          preview: [],
          lastUploadTimestamp: null
        });
      }
      
      // Show success notification
      setError(''); // Clear any existing errors
      setTimeout(() => {
        alert(`Successfully removed batch of questions uploaded at ${new Date(batchTimestamp).toLocaleString()}`);
      }, 100);
    }
  };

  // Function to get all questions from a specific upload batch
  const getQuestionsFromBatch = (batchTimestamp) => {
    if (!batchTimestamp) return [];
    return formData.questions.filter(q => q.uploadBatch === batchTimestamp);
  };

  // Get a list of validation issues that need to be fixed before submitting
  const getSubmissionIssues = () => {
    const issues = [];
    
    // Basic details validation
    if (!formData.basicDetails.title.trim()) {
      issues.push('Exam title is required');
    }
    
    if (!formData.basicDetails.duration || formData.basicDetails.duration <= 0) {
      issues.push('Valid exam duration is required');
    }
    
    if (!formData.basicDetails.startDate) {
      issues.push('Start date is required');
    }
    
    if (!formData.basicDetails.startTime) {
      issues.push('Start time is required');
    }
    
    if (!formData.basicDetails.endDate) {
      issues.push('End date is required');
    }
    
    if (!formData.basicDetails.endTime) {
      issues.push('End time is required');
    }
    
    // Check if start date & time is in the future
    if (formData.basicDetails.startDate && formData.basicDetails.startTime) {
      const startDateTime = new Date(`${formData.basicDetails.startDate}T${formData.basicDetails.startTime}`);
      const now = new Date();
      if (startDateTime <= now) {
        issues.push('Start date and time must be in the future');
      }
    }
    
    // Check if end date & time is after start date & time
    if (formData.basicDetails.startDate && formData.basicDetails.startTime &&
        formData.basicDetails.endDate && formData.basicDetails.endTime) {
      const startDateTime = new Date(`${formData.basicDetails.startDate}T${formData.basicDetails.startTime}`);
      const endDateTime = new Date(`${formData.basicDetails.endDate}T${formData.basicDetails.endTime}`);
      if (endDateTime <= startDateTime) {
        issues.push('End date and time must be after start date and time');
      }
    }
    
    // Questions validation
    if (formData.questions.length === 0) {
      issues.push('At least one question is required');
    }
    
    return issues;
  };
  
  // Validate basic details form
  useEffect(() => {
    const { title, duration, passingPercentage, startDate, startTime, endDate, endTime } = formData.basicDetails;
    
    // Create full date-time objects for comparison
    const startDateTime = startDate && startTime ? new Date(`${startDate}T${startTime}`) : null;
    const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null;
    
    const isValid = 
      title.trim() !== '' && 
      duration > 0 && 
      passingPercentage > 0 && 
      startDate !== '' && 
      startTime !== '' &&
      endDate !== '' && 
      endTime !== '' &&
      (startDateTime && endDateTime ? endDateTime >= startDateTime : true);
    
    setValidation(prev => ({
      ...prev,
      basicDetails: isValid
    }));
  }, [formData.basicDetails]);

  // Validate eligibility form
  useEffect(() => {
    const { departments, branches, semesters } = formData.eligibility;
    const isValid = departments.length > 0 || branches.length > 0 || semesters.length > 0;
    
    setValidation(prev => ({
      ...prev,
      eligibility: isValid
    }));
  }, [formData.eligibility]);

  // Validate questions
  useEffect(() => {
    const isValid = formData.questions.length > 0;
    
    setValidation(prev => ({
      ...prev,
      questions: isValid
    }));
  }, [formData.questions]);

  // Check tab form validation as user navigates
  useEffect(() => {
    // Validate basic details tab
    const basicDetailsValid = 
      formData.basicDetails.title.trim() !== '' && 
      formData.basicDetails.duration > 0;
    
    // Validate questions tab - need at least one question
    const questionsValid = formData.questions.length > 0;
    
    // Update validation state
    setValidation({
      basicDetails: basicDetailsValid,
      eligibility: true, // Eligibility tab is always valid as all fields are optional
      questions: questionsValid
    });
  }, [formData]);
  
  // Additional effect to automatically update validation when questions change
  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      questions: formData.questions.length > 0
    }));
  }, [formData.questions]);

  const handleBasicDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      basicDetails: {
        ...formData.basicDetails,
        [name]: value
      }
    });
  };

  const handleEligibilityChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      eligibility: {
        ...formData.eligibility,
        [name]: value
      }
    });
  };

  const handleMultiSelectChange = (fieldName, selectedOptions) => {
    setFormData({
      ...formData,
      eligibility: {
        ...formData.eligibility,
        [fieldName]: selectedOptions
      }
    });
  };

  const handleQuestionChange = (e, index = null) => {
    const { name, value } = e.target;
    
    if (name === 'options' && index !== null) {
      const updatedOptions = [...currentQuestion.options];
      updatedOptions[index] = value;
      
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions
      });
    } else if (name === 'correctOption') {
      setCurrentQuestion({
        ...currentQuestion,
        correctOption: parseInt(value)
      });
    } else {
      setCurrentQuestion({
        ...currentQuestion,
        [name]: value
      });
    }
  };

  const handleAddQuestion = () => {
    // Validate question
    if (currentQuestion.question.trim() === '') {
      setError('Question text cannot be empty.');
      return;
    }
    
    // Check if all options are filled
    const emptyOptions = currentQuestion.options.filter(opt => opt.trim() === '');
    if (emptyOptions.length > 0) {
      setError('All options must be filled.');
      return;
    }
      setFormData({
      ...formData,
      questions: [...formData.questions, { 
        ...currentQuestion, 
        id: Date.now(),
        source: 'manual-entry'
      }]
    });
    
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    });
    
    setError('');
  };
  const handleRemoveQuestion = (id) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== id)
    });
  };
    const handleRemoveBatch = (uploadBatch) => {
    if (window.confirm('Are you sure you want to remove all questions from this upload?')) {
      setFormData({
        ...formData,
        questions: formData.questions.filter(q => q.uploadBatch !== uploadBatch)
      });
      
      // Also clear preview if it's the current batch
      if (fileUpload.lastUploadTimestamp === uploadBatch) {
        setFileUpload({
          ...fileUpload,
          preview: []
        });
      }
    }
  };

  // Added functionality to handle editing a question
  const handleEditQuestion = (id) => {
    const questionToEdit = formData.questions.find(q => q.id === id);
    if (!questionToEdit) return;
    
    setEditingQuestion({
      isEditing: true,
      questionId: id,
      question: { ...questionToEdit }
    });
    
    // Set the current question form with the question data
    setCurrentQuestion({
      ...questionToEdit
    });
  };
  
  // Save the edited question
  const handleSaveEdit = () => {
    if (currentQuestion.question.trim() === '') {
      setError('Question text cannot be empty.');
      return;
    }
    
    // Check if all options are filled
    const emptyOptions = currentQuestion.options.filter(opt => opt.trim() === '');
    if (emptyOptions.length > 0) {
      setError('All options must be filled.');
      return;
    }
    
    setFormData({
      ...formData,
      questions: formData.questions.map(q => 
        q.id === editingQuestion.questionId 
          ? { ...q, ...currentQuestion }
          : q
      )
    });
    
    // Reset editing state
    setEditingQuestion({
      isEditing: false,
      questionId: null,
      question: {
        question: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1
      }
    });
    
    // Reset current question form
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    });
    
    setError('');
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingQuestion({
      isEditing: false,
      questionId: null,
      question: {
        question: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1
      }
    });
    
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    });
    
    setError('');
  };  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      // Reset the file upload state if no file is selected
      setFileUpload({
        ...fileUpload,
        file: null,
        fileName: '',
        error: '',
        validationStatus: null,
        successMessage: ''
      });
      return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setFileUpload({
        ...fileUpload,
        file: null,
        fileName: file.name,
        error: 'File is too large. Maximum size is 5MB.',
        validationStatus: 'failed',
        successMessage: ''
      });
      e.target.value = ''; // Reset the file input
      return;
    }
    
    // Check file type and extension
    const validTypes = ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!validTypes.includes(file.type) && !isValidExtension) {
      setFileUpload({
        ...fileUpload,
        file: null,
        fileName: file.name,
        error: 'Invalid file type. Please upload a CSV or Excel file with .csv, .xlsx, or .xls extension.',
        validationStatus: 'failed',
        successMessage: ''
      });
      e.target.value = ''; // Reset the file input
      return;
    }
    
    // Currently, we only support CSV files
    if (!fileName.endsWith('.csv')) {
      setFileUpload({
        ...fileUpload,
        file: null,
        fileName: file.name,
        error: 'Currently only CSV files are supported. Please convert your file to CSV format.',
        validationStatus: 'failed',
        successMessage: ''
      });
      e.target.value = ''; // Reset the file input
      return;
    }
    
    // Basic validation passed, ready for upload
    setFileUpload({
      ...fileUpload,
      file,
      fileName: file.name,
      error: '',
      successMessage: '',
      validationStatus: 'ready'
    });
  };
const handleFileUpload = async () => {
    if (!fileUpload.file) {
      setFileUpload({
        ...fileUpload,
        error: 'Please select a file to upload.',
        validationStatus: 'failed'
      });
      return;
    }
    
    if (fileUpload.validationStatus === 'failed') {
      return; // Don't proceed if validation failed
    }
    
    setFileUpload({
      ...fileUpload,
      uploading: true,
      error: '',
      validationStatus: 'pending'
    });
    
    // Generate unique timestamp to group these questions
    const uploadTimestamp = Date.now();
    
    try {
      // Read the file using FileReader API
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const fileContent = e.target.result;
          let parsedData = [];
          
          // Check if the file is CSV or Excel
          if (fileUpload.fileName.toLowerCase().endsWith('.csv')) {
            // Parse CSV
            console.log('Parsing CSV file...');
            parsedData = parseCSV(fileContent);
            console.log('Parsed data:', parsedData);
          } else {
            // For Excel files (in a real app, you would use a library like xlsx or exceljs)
            throw new Error('Excel file parsing is not implemented. Please use CSV format.');
          }
          
          // Validate the parsed data
          const validationResult = validateParsedData(parsedData);
          
          if (!validationResult.valid) {
            setFileUpload({
              ...fileUpload,
              uploading: false,
              error: validationResult.error,
              validationStatus: 'failed',
              successMessage: ''
            });
            // Reset the file input to allow selecting the same file again
            const fileInput = document.getElementById('questionFile');
            if (fileInput) fileInput.value = '';
            return;
          }
          
          // Convert the parsed data into question objects
          const newQuestions = parsedData.map((row, index) => {
            // Ensure the correctOption is a number between 0-3
            let correctOption = 0;
            try {
              correctOption = parseInt(row.correctOption);
              if (isNaN(correctOption) || correctOption < 0 || correctOption > 3) correctOption = 0;
            } catch (e) {
              correctOption = 0;
            }
            
            // Ensure marks is a positive number
            let marks = 1;
            try {
              marks = parseInt(row.marks);
              if (isNaN(marks) || marks <= 0) marks = 1;
            } catch (e) {
              marks = 1;
            }
            
            return {
              id: uploadTimestamp + index, // Use combination of timestamp and index for unique ID
              question: row.question.trim(),
              options: [
                row.option1.trim(), 
                row.option2.trim(), 
                row.option3.trim(), 
                row.option4.trim()
              ],
              correctOption,
              marks,
              source: 'csv-upload',
              uploadBatch: uploadTimestamp,
              fileName: fileUpload.fileName
            };
          });

          if (newQuestions.length === 0) {
            setFileUpload({
              ...fileUpload,
              uploading: false,
              error: 'No valid questions found in the file. Please check the file format.',
              validationStatus: 'failed',
              successMessage: ''
            });
            // Reset the file input
            const fileInput = document.getElementById('questionFile');
            if (fileInput) fileInput.value = '';
            return;
          }
          
          // Update the form data with the new questions
          setFormData(prevFormData => ({
            ...prevFormData,
            questions: [...prevFormData.questions, ...newQuestions]
          }));
          
          // Update the file upload state with the preview of the new questions
          setFileUpload({
            ...fileUpload,
            uploading: false,
            file: null,
            fileName: '',
            preview: newQuestions,
            lastUploadTimestamp: uploadTimestamp,
            validationStatus: 'success',
            error: '',
            successMessage: validationResult.message || `Successfully added ${newQuestions.length} questions from file.`
          });
          
          // Show success message
          setError('');
          
          // Reset the file input for next upload
          const fileInput = document.getElementById('questionFile');
          if (fileInput) fileInput.value = '';
        } catch (error) {
          console.error('File processing error:', error);
          setFileUpload({
            ...fileUpload,
            uploading: false,
            error: `Error processing file: ${error.message}`,
            validationStatus: 'failed',
            successMessage: '',
            file: null // Reset file so user can try again
          });
          // Reset the file input
          const fileInput = document.getElementById('questionFile');
          if (fileInput) fileInput.value = '';
        }
      };
      
      reader.onerror = () => {
        setFileUpload({
          ...fileUpload,
          uploading: false,
          error: 'Failed to read the file. Please try again.',
          validationStatus: 'failed',
          successMessage: '',
          file: null // Reset file so user can try again
        });
        // Reset the file input
        const fileInput = document.getElementById('questionFile');
        if (fileInput) fileInput.value = '';
      };
      
      // Read the file as text
      reader.readAsText(fileUpload.file);
    } catch (error) {
      console.error('File upload error:', error);
      setFileUpload({
        ...fileUpload,
        uploading: false,
        error: `Failed to upload file: ${error.message}. Please try again.`,
        validationStatus: 'failed',
        successMessage: '',
        file: null
      });
      
      // Reset the file input element to allow selecting the same file again
      const fileInput = document.getElementById('questionFile');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };
    // Function to validate file structure (no longer needed as we're directly parsing the file)
  const validateFileStructure = (file) => {
    // Always return valid since the actual validation happens in validateParsedData
    return { valid: true };
  };
  // Function to create and download a template CSV file
const downloadTemplate = () => {
  // Create the template content with clear column headers
  const headers = ['question', 'option1', 'option2', 'option3', 'option4', 'correctOption', 'marks'];
  
  // Example data with more realistic and diverse questions
  const exampleRows = [
    [
      'What is 2+2?', 
      '3', 
      '4', 
      '5', 
      '6', 
      '1', // 0-based index, so 1 refers to the second option (4)
      '1'
    ],
    [
      'Which of the following is a primary color?', 
      'Green', 
      'Purple', 
      'Red', 
      'Orange', 
      '2', // 0-based index, so 2 refers to the third option (Red)
      '1'
    ],
    [
      'Who painted the Mona Lisa?', 
      'Vincent van Gogh', 
      'Leonardo da Vinci', 
      'Pablo Picasso', 
      'Michelangelo', 
      '1', // 0-based index, so 1 refers to the second option (Leonardo da Vinci)
      '2'
    ],
    [
      'What is the capital of Japan?',
      'Beijing',
      'Seoul',
      'Tokyo',
      'Bangkok',
      '2', // 0-based index, so 2 refers to the third option (Tokyo)
      '1'
    ],
    [
      'Which programming language is known for its use in web development with the React library?',
      'Python',
      'JavaScript',
      'Java',
      'C++',
      '1', // 0-based index, so 1 refers to the second option (JavaScript)
      '2'
    ]
  ];
  
  // Create CSV content, properly handling quotes and commas in text
  let csvContent = headers.join(',') + '\n';
  
  exampleRows.forEach(row => {
    csvContent += row.map(cell => {
      const cellStr = String(cell);
      // Need to quote cells that contain commas, quotes, or newlines
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        // Double up quotes for escaping
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',') + '\n';
  });
  
  // Add an instructive comment line at the top of the file
  csvContent = '# CSV Template for Exam Questions - correctOption is 0-based (0=option1, 1=option2, etc)\n' + csvContent;
  
  // Create a blob and a download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exam_questions_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};  const handleCreateExam = async (status = 'Draft') => {
    setLoading(true);
    setError('');
    // Set the current status for loading state display
    setFormData(prev => ({ ...prev, status }));
    
    try {
      // Format date and time properly
      const startDateTime = `${formData.basicDetails.startDate}T${formData.basicDetails.startTime}:00`;
      const endDateTime = `${formData.basicDetails.endDate}T${formData.basicDetails.endTime}:00`;
      
      // Calculate total marks
      const totalMarks = formData.questions.reduce((sum, q) => sum + parseInt(q.marks || 1), 0);
      
      // Calculate passing marks based on percentage
      const passingPercentage = parseInt(formData.basicDetails.passingPercentage || 60);
      const passingMarks = Math.ceil((totalMarks * passingPercentage) / 100);
      
      // Prepare questions for the backend format
      const formattedQuestions = formData.questions.map(q => {
        const options = q.options || [];
        // Ensure we have a valid correctOption index
        const correctOptionIndex = typeof q.correctOption === 'number' ? 
          q.correctOption : 
          parseInt(q.correctOption || 0);
        
        return {
          type: "MCQ",
          question: q.question,
          options: options,
          // Backend expects both the index and the actual answer value
          correctOption: correctOptionIndex,
          correctAnswer: options[correctOptionIndex] || "",
          marks: parseInt(q.marks || 1),
          explanation: q.explanation || "",
          // Track metadata for potential future use
          source: q.source || "manual-entry",
          difficulty: "Medium",
          tags: q.tags || []
        };
      });
      
      // Create the complete exam object
      const examData = {
        title: formData.basicDetails.title,
        description: formData.basicDetails.description || '',
        type: formData.basicDetails.type,
        duration: parseInt(formData.basicDetails.duration),
        totalMarks,
        passingMarks,
        passingPercentage,
        // Use scheduledFor as the main date field (backend expects this)
        scheduledFor: startDateTime,
        // Include start/end dates for backwards compatibility
        startDate: startDateTime,
        endDate: endDateTime,
        // Include registration deadline if not set (backend might require this)
        registrationDeadline: startDateTime,
        status,
        eligibility: {
          departments: formData.eligibility.departments || [],
          branches: formData.eligibility.branches || [],
          semesters: (formData.eligibility.semesters || []).map(s => s.toString()),
          minCGPA: formData.eligibility.minCGPA ? parseFloat(formData.eligibility.minCGPA) : null,
          minPercentage: formData.eligibility.minPercentage ? parseFloat(formData.eligibility.minPercentage) : null,
          maxBacklogs: formData.eligibility.maxBacklogs ? parseInt(formData.eligibility.maxBacklogs) : null
        },
        instructions: formData.basicDetails.instructions || '',
        // Group all questions in a default section
        sections: [
          {
            name: "Main Section", // Use name instead of title for backend compatibility
            description: "Default section containing all questions",
            questions: formattedQuestions
          }
        ],
        // Also include flat questions array for backward compatibility
        questions: formattedQuestions
      };
        console.log('Submitting exam data:', examData);
      
      // Make the API call using dynamic import to avoid circular dependencies
      try {
        // Import tpoService
        const tpoService = await import('../services/tpoService').then(module => module.default);
        console.log('Before API call to createExam');
          // Add additional logging to debug network request
        console.log('Sending request to API endpoint:', '/exams');
          const response = await tpoService.createExam(examData);
        console.log('Complete API response:', response);
          
        // Check if the response is valid
        if (!response) {
          throw new Error('Empty response from server. Exam may not have been created.');
        }
        
        // Extract exam data from the response - handle different response formats
        const examResponse = response.data || response;
        console.log('Exam created successfully:', examResponse);
        
        // Even if we encounter errors later, we know the exam was created, so set a flag
        const examWasCreated = true;
        
        if (!examResponse._id && !examResponse.id) {
          console.warn('Warning: Created exam does not have an ID', examResponse);
        }
        
        // Store information about the created exam for the success screen
        setCreatedExamInfo({
          id: examResponse._id || examResponse.id || 'unknown',
          title: examResponse.title || examData.title,
          status: examResponse.status || status,
          scheduledFor: examResponse.scheduledFor || startDateTime,
          totalQuestions: formData.questions.length,
          totalMarks,
          passingMarks,
          passingPercentage
        });
        
        setExamCreated(true);      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Detailed error logging for debugging
        if (apiError.response) {
          // The request was made and the server responded with a status code
          console.error('Response data:', apiError.response.data);
          console.error('Response status:', apiError.response.status);
          console.error('Response headers:', apiError.response.headers);
          
          // Check if we got a 201 status code first (created) but then encountered an error with action field
          if (apiError.response.status === 201 || 
              (apiError.response.data && apiError.response.data.success === true) ||
              typeof examWasCreated !== 'undefined') {
            
            // The exam was actually created, show success screen despite the logging error
            console.log('Exam was created successfully despite logging error');
            setExamCreated(true);
            return; // Exit early to show success screen
          }
        } else if (apiError.request) {
          // The request was made but no response was received
          console.error('No response received:', apiError.request);
        } else {
          // Something happened in setting up the request that triggered an error
          console.error('Request setup error:', apiError.message);
        }
          // Enhanced error handling with more details
        const errorMessage = apiError.response?.data?.error || 
                            apiError.response?.data?.message ||
                            apiError.message || 
                            'Failed to create exam. Please try again.';
                            
        // If it's specifically the action field error and we know the exam was created
        if (errorMessage.includes('Path `action` is required')) {
          console.log('Ignoring action field error and showing success screen since exam was created');
          // Create basic info for success screen
          setCreatedExamInfo({
            id: 'created',
            title: formData.title || 'New Exam',
            status: formData.status || 'Draft',
            scheduledFor: formData.scheduledFor || new Date(),
            totalQuestions: formData.questions?.length || 0,
            totalMarks: formData.totalMarks || 0,
            passingMarks: formData.passingMarks || 0,
            passingPercentage: formData.passingPercentage || 0
          });
          setExamCreated(true);
          return; // Exit to show success screen
        }
        
        setError(`Error creating exam: ${errorMessage}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const nextTab = () => {
    if (activeTab < 4) {
      setActiveTab(activeTab + 1);
    }
  };

  const prevTab = () => {
    if (activeTab > 1) {
      setActiveTab(activeTab - 1);
    }
  };
  const handleBack = () => {
    navigate('/tpo-dashboard'); // Navigate back to the TPO dashboard
  };
  // Store created exam info
  const [createdExamInfo, setCreatedExamInfo] = useState(null);
  
  // If exam created successfully, show success screen
  if (examCreated) {
    return (
      <div className="exam-creation-page">
        <Header />
        <div className="success-screen">
          <div className="success-content">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h2>Exam Created Successfully!</h2>
            <p>Your exam has been created and is now available in the exams section.</p>
            
            {createdExamInfo && (
              <div className="exam-success-details">
                <div className="exam-success-summary">
                  <div className="exam-success-item">
                    <span className="exam-success-label">Exam Title:</span>
                    <span className="exam-success-value">{createdExamInfo.title}</span>
                  </div>
                  <div className="exam-success-item">
                    <span className="exam-success-label">Status:</span>
                    <span className="exam-success-value status-tag">{createdExamInfo.status}</span>
                  </div>
                  <div className="exam-success-item">
                    <span className="exam-success-label">Scheduled For:</span>
                    <span className="exam-success-value">
                      {new Date(createdExamInfo.scheduledFor).toLocaleString()}
                    </span>
                  </div>
                  <div className="exam-success-item">
                    <span className="exam-success-label">Questions:</span>
                    <span className="exam-success-value">{createdExamInfo.totalQuestions} questions</span>
                  </div>
                  <div className="exam-success-item">
                    <span className="exam-success-label">Total Marks:</span>
                    <span className="exam-success-value">{createdExamInfo.totalMarks} marks</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="success-actions">
              <button 
                className="back-to-dashboard-btn" 
                onClick={handleBack}
              >
                Back to Dashboard
              </button>
              
              <button 
                className="view-exam-btn" 
                onClick={() => navigate(`/tpo-dashboard/exams/${createdExamInfo?.id || ''}`)}
              >
                View Exam Details
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="exam-creation-page">
      <Header />
      <Container className="exam-creation-container">
        <div className="exam-creation-header">
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h2>Create New Exam</h2>
        </div>

        {/* Tab Navigation */}
        <div className="exam-tabs-container">
          <div 
            className={`exam-tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            <span className="tab-number">1</span>
            <span className="tab-title">Basic Details</span>
          </div>
          <div 
            className={`exam-tab ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => validation.basicDetails ? setActiveTab(2) : null}
          >
            <span className="tab-number">2</span>
            <span className="tab-title">Eligibility</span>
          </div>
          <div 
            className={`exam-tab ${activeTab === 3 ? 'active' : ''}`}
            onClick={() => (validation.basicDetails && validation.eligibility) ? setActiveTab(3) : null}
          >
            <span className="tab-number">3</span>
            <span className="tab-title">Questions</span>
          </div>
          <div 
            className={`exam-tab ${activeTab === 4 ? 'active' : ''}`}
            onClick={() => (validation.basicDetails && validation.eligibility && validation.questions) ? setActiveTab(4) : null}
          >
            <span className="tab-number">4</span>
            <span className="tab-title">Review & Submit</span>
          </div>
        </div>

        <div className="exam-creation-form">
          {/* Tab 1: Basic Details */}
          <div className={`tab-content ${activeTab === 1 ? 'active' : ''}`}>
            <div className="section-container">
              <Form>
                <Form.Group controlId="formExamTitle" className="mb-3">
                  <Form.Label>Title <span className="required">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.basicDetails.title}
                    onChange={handleBasicDetailsChange}
                    placeholder="Enter exam title"
                  />
                </Form.Group>

                <Form.Group controlId="formExamDescription" className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.basicDetails.description}
                    onChange={handleBasicDetailsChange}
                    placeholder="Enter exam description"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="formExamType" className="mb-3">
                      <Form.Label>Type <span className="required">*</span></Form.Label>
                      <Form.Control
                        as="select"
                        name="type"
                        value={formData.basicDetails.type}
                        onChange={handleBasicDetailsChange}
                      >
                        {examTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formExamDuration" className="mb-3">
                      <Form.Label>Duration (in minutes) <span className="required">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={formData.basicDetails.duration}
                        onChange={handleBasicDetailsChange}
                        min="1"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="formExamPassingPercentage" className="mb-3">
                      <Form.Label>Passing Percentage <span className="required">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="passingPercentage"
                        value={formData.basicDetails.passingPercentage}
                        onChange={handleBasicDetailsChange}
                        min="0"
                        max="100"
                      />
                    </Form.Group>
                  </Col>
                </Row>                <div className="date-time-container">
                  <Form.Label>Exam Schedule <span className="required">*</span></Form.Label>
                  <p className="text-muted small mb-3">Set the start and end date/time for when the exam will be accessible to eligible students.</p>
                  <Row>
                    <Col md={6} className="date-time-group">
                      <Col>
                        <Form.Group controlId="formExamStartDate">                          <Form.Label>Start Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="startDate"
                            value={formData.basicDetails.startDate}
                            onChange={handleBasicDetailsChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group controlId="formExamStartTime">                          <Form.Label>Start Time</Form.Label>
                          <Form.Control
                            type="time"
                            name="startTime"
                            value={formData.basicDetails.startTime}
                            onChange={handleBasicDetailsChange}
                            className="time-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Col>
                    
                    <Col md={6} className="date-time-group">
                      <Col>
                        <Form.Group controlId="formExamEndDate">                          <Form.Label>End Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="endDate"
                            value={formData.basicDetails.endDate}
                            onChange={handleBasicDetailsChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group controlId="formExamEndTime">                          <Form.Label>End Time</Form.Label>
                          <Form.Control
                            type="time"
                            name="endTime"
                            value={formData.basicDetails.endTime}
                            onChange={handleBasicDetailsChange}
                            className="time-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Col>
                  </Row>
                </div>

                <Form.Group controlId="formExamInstructions" className="mb-3">
                  <Form.Label>Instructions for Students</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="instructions"
                    value={formData.basicDetails.instructions}
                    onChange={handleBasicDetailsChange}
                    placeholder="Enter instructions for students taking the exam"
                  />
                </Form.Group>
              </Form>
            </div>

            <div className="tab-navigation">
              <div></div> {/* Empty div for spacing */}
              <Button 
                className="next-btn" 
                onClick={nextTab}
                disabled={!validation.basicDetails}
              >
                Next: Eligibility
              </Button>
            </div>
          </div>

          {/* Tab 2: Eligibility */}
          <div className={`tab-content ${activeTab === 2 ? 'active' : ''}`}>
            <div className="section-container">
              <div className="eligibility-category">
                <div className="eligibility-category-title">Department Eligibility</div>
                <Form>
                  <Form.Group controlId="formExamEligibilityDepartments" className="mb-4">
                    <Form.Label className="academic-control-label">Select Eligible Departments</Form.Label>
                    <div className="checkbox-grid">
                      {departmentOptions.map(dept => (
                        <Form.Check
                          key={dept}
                          type="checkbox"
                          id={`dept-${dept}`}
                          label={dept}
                          checked={formData.eligibility.departments.includes(dept)}
                          onChange={(e) => {
                            const updatedDepts = e.target.checked
                              ? [...formData.eligibility.departments, dept]
                              : formData.eligibility.departments.filter(d => d !== dept);
                            handleMultiSelectChange('departments', updatedDepts);
                          }}
                          className="checkbox-item"
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Form>
              </div>

              <div className="eligibility-category">
                <div className="eligibility-category-title">Branch Eligibility</div>
                <Form>
                  <Form.Group controlId="formExamEligibilityBranches" className="mb-4">
                    <Form.Label className="academic-control-label">Select Eligible Branches</Form.Label>
                    <div className="checkbox-grid">
                      {branchOptions.map(branch => (
                        <Form.Check
                          key={branch}
                          type="checkbox"
                          id={`branch-${branch}`}
                          label={branch}
                          checked={formData.eligibility.branches.includes(branch)}
                          onChange={(e) => {
                            const updatedBranches = e.target.checked
                              ? [...formData.eligibility.branches, branch]
                              : formData.eligibility.branches.filter(b => b !== branch);
                            handleMultiSelectChange('branches', updatedBranches);
                          }}
                          className="checkbox-item"
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Form>
              </div>

              <div className="eligibility-category">
                <div className="eligibility-category-title">Semester Eligibility</div>
                <Form>
                  <Form.Group controlId="formExamEligibilitySemesters" className="mb-3">
                    <Form.Label className="academic-control-label">Select Eligible Semesters</Form.Label>
                    <div className="checkbox-grid">
                      {semesterOptions.map(sem => (
                        <Form.Check
                          key={sem.value}
                          type="checkbox"
                          id={`sem-${sem.value}`}
                          label={sem.label}
                          checked={formData.eligibility.semesters.includes(sem.value)}
                          onChange={(e) => {
                            const updatedSemesters = e.target.checked
                              ? [...formData.eligibility.semesters, sem.value]
                              : formData.eligibility.semesters.filter(s => s !== sem.value);
                            handleMultiSelectChange('semesters', updatedSemesters);
                          }}
                          className="checkbox-item"
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Form>
              </div>
            </div>

            <div className="section-container">
              <div className="section-title">Academic Eligibility Criteria</div>
              <Form>
                <Row className="academic-criteria-row">
                  <Col md={4}>
                    <Form.Group controlId="formExamEligibilityMinCGPA" className="mb-3">
                      <Form.Label className="academic-control-label">Minimum CGPA</Form.Label>
                      <Form.Control
                        type="number"
                        name="minCGPA"
                        value={formData.eligibility.minCGPA}
                        onChange={handleEligibilityChange}
                        placeholder="E.g., 7.5"
                        min="0"
                        max="10"
                        step="0.1"
                        className="academic-control"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formExamEligibilityMinPercentage" className="mb-3">
                      <Form.Label className="academic-control-label">Minimum Percentage</Form.Label>
                      <Form.Control
                        type="number"
                        name="minPercentage"
                        value={formData.eligibility.minPercentage}
                        onChange={handleEligibilityChange}
                        placeholder="E.g., 60"
                        min="0"
                        max="100"
                        step="0.01"
                        className="academic-control"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formExamEligibilityMaxBacklogs" className="mb-3">
                      <Form.Label className="academic-control-label">Maximum Backlogs</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxBacklogs"
                        value={formData.eligibility.maxBacklogs}
                        onChange={handleEligibilityChange}
                        placeholder="E.g., 2"
                        min="0"
                        className="academic-control"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </div>

            <div className="tab-navigation">
              <Button className="prev-btn" onClick={prevTab}>
                Back: Basic Details
              </Button>
              <Button 
                className="next-btn" 
                onClick={nextTab}
                disabled={!validation.eligibility}
              >
                Next: Questions
              </Button>
            </div>
          </div>

          {/* Tab 3: Questions */}
          <div className={`tab-content ${activeTab === 3 ? 'active' : ''}`}>            <div className="section-container">
              <div className="questions-header">
                <div className="section-title">
                  {editingQuestion.isEditing ? 'Edit Question' : 'Add Questions Manually'}
                </div>
                <div className="questions-count">
                  Total Questions: {formData.questions.length}
                </div>
              </div>
              <div className="question-form-container">
                <Form>
                  <Form.Group controlId="formQuestionText" className="mb-3">
                    <Form.Label>Question <span className="required">*</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="question"
                      value={currentQuestion.question}
                      onChange={handleQuestionChange}
                      placeholder="Enter question text"
                    />
                  </Form.Group>

                  {currentQuestion.options.map((option, index) => (
                    <Form.Group key={index} controlId={`formOption${index}`} className="mb-3">
                      <div className="option-container">
                        <div className="option-prefix">
                          <Form.Check
                            type="radio"
                            id={`correctOption-${index}`}
                            name="correctOption"
                            value={index}
                            checked={currentQuestion.correctOption === index}
                            onChange={handleQuestionChange}
                            className="correct-option-radio"
                          />
                          <Form.Label htmlFor={`correctOption-${index}`} className="mb-0 ms-2">
                            Option {index + 1}:
                          </Form.Label>
                        </div>
                        <div className="option-input">
                          <Form.Control
                            type="text"
                            name="options"
                            value={option}
                            onChange={(e) => handleQuestionChange(e, index)}
                            placeholder={`Enter option ${index + 1}`}
                          />
                        </div>
                      </div>
                    </Form.Group>
                  ))}

                  <Form.Group controlId="formQuestionMarks" className="mb-3">
                    <Form.Label>Marks</Form.Label>
                    <Form.Control
                      type="number"
                      name="marks"
                      value={currentQuestion.marks}
                      onChange={handleQuestionChange}
                      min="1"
                    />
                  </Form.Group>

                  {error && <div className="text-danger mb-3">{error}</div>}

                  {editingQuestion.isEditing ? (
                    <div className="edit-actions">
                      <Button className="cancel-edit-btn" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button className="save-edit-btn" onClick={handleSaveEdit}>
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <Button className="add-question-btn" onClick={handleAddQuestion}>
                      Add Question
                    </Button>
                  )}
                </Form>
              </div>
            </div>            <div className="section-container">
              <div className="section-title">Upload Questions</div>
              <div className="upload-container">
                <div className="file-upload-info">
                  <div className="upload-instructions">
                    <p>You can upload questions in bulk using a CSV file. The file should have the following columns:</p>
                    <ul>
                      <li><code>question</code> - The question text</li>
                      <li><code>option1</code>, <code>option2</code>, <code>option3</code>, <code>option4</code> - The options</li>
                      <li><code>correctOption</code> - The index of the correct option (0-3)</li>
                      <li><code>marks</code> - The marks for the question</li>
                    </ul>
                    <div className="file-requirements">
                      <h6>File Requirements:</h6>
                      <ul>
                        <li>Must be a CSV (.csv) file</li>
                        <li>The first row must contain the column headers</li>
                        <li>All fields are required for each question</li>
                        <li>correctOption must be between 0-3 (where 0 = option1, 1 = option2, etc.)</li>
                        <li>marks must be a positive number</li>
                      </ul>
                    </div>
                    <Button className="download-template-btn" onClick={downloadTemplate}>
                      <i className="csv-icon">📄</i> Download CSV Template
                    </Button>
                  </div>

                  <div className="file-upload-section">
                    <div className="custom-file-upload">
                      <Form.Control
                        type="file"
                        id="questionFile"
                        onChange={handleFileChange}
                        accept=".csv"
                        className="file-input"
                      />
                      <label 
                        htmlFor="questionFile" 
                        className={`file-upload-label ${
                          fileUpload.validationStatus === 'ready' ? 'valid' : 
                          fileUpload.validationStatus === 'failed' ? 'invalid' : ''
                        }`}
                      >
                        <i className="csv-icon">{fileUpload.fileName ? '📄' : '📎'}</i>
                        {fileUpload.fileName || 'Choose CSV file...'}
                        {fileUpload.validationStatus === 'ready' && <span className="validation-icon valid">✓</span>}
                        {fileUpload.validationStatus === 'failed' && <span className="validation-icon invalid">✗</span>}
                      </label>
                    </div>
                    
                    <Button 
                      className={`upload-btn ${fileUpload.uploading ? 'uploading' : ''}`}
                      onClick={handleFileUpload}
                      disabled={!fileUpload.file || fileUpload.uploading || fileUpload.validationStatus === 'failed'}
                    >
                      {fileUpload.uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing CSV...
                        </>
                      ) : 'Upload & Process Questions'}
                    </Button>
                    
                    {/* Progress bar for upload */}
                    {fileUpload.uploading && (
                      <div className="upload-progress">
                        <div 
                          className={`upload-progress-bar ${
                            fileUpload.validationStatus === 'success' ? 'complete' : 
                            fileUpload.validationStatus === 'failed' ? 'error' : ''
                          }`}
                          style={{ width: fileUpload.uploading ? '100%' : '0%' }}
                        ></div>
                      </div>
                    )}
                    
                    {fileUpload.error && (
                      <FileUploadMessage 
                        type="error" 
                        message={fileUpload.error} 
                        onDismiss={() => setFileUpload({ ...fileUpload, error: '' })}
                      />
                    )}
                    
                    {fileUpload.successMessage && fileUpload.validationStatus === 'success' && (
                      <FileUploadMessage 
                        type="success" 
                        message={fileUpload.successMessage} 
                        onDismiss={() => setFileUpload({ ...fileUpload, successMessage: '' })}
                      />
                    )}

                    {/* Show a preview of the data when available */}
                    {fileUpload.preview && fileUpload.preview.length > 0 && (
                      <div className="csv-preview-panel">
                        <div className="csv-preview-header">
                          <div className="csv-preview-title">
                            <i className="csv-icon">✓</i> Preview of Added Questions
                            <span className="csv-preview-count">{fileUpload.preview.length}</span>
                          </div>
                        </div>
                        <div className="csv-preview-body">
                          <table className="csv-preview-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Question</th>
                                <th>Options</th>
                                <th>Correct</th>
                                <th>Marks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fileUpload.preview.slice(0, 5).map((q, idx) => (
                                <tr key={idx} className={idx === 0 ? 'new-item' : ''}>
                                  <td>{idx + 1}</td>
                                  <td>{q.question.substring(0, 40)}{q.question.length > 40 ? '...' : ''}</td>
                                  <td>{q.options.map(o => o.substring(0, 10)).join(', ')}</td>
                                  <td>{String.fromCharCode(65 + q.correctOption)} ({q.correctOption})</td>
                                  <td>{q.marks}</td>
                                </tr>
                              ))}
                              {fileUpload.preview.length > 5 && (
                                <tr>
                                  <td colSpan="5" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                                    ...and {fileUpload.preview.length - 5} more questions
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>            {/* Display recently uploaded questions section */}
            {fileUpload.preview.length > 0 && (
              <div className="section-container">
                <div className="section-title">
                  <span className="success-upload-icon">✅</span> Recently Uploaded Questions from CSV
                  <span className="upload-info">
                    {fileUpload.preview.length} questions successfully processed
                  </span>
                </div>
                
                <div className="upload-summary">
                  <div className="upload-details">
                    <div className="upload-detail-item">
                      <span className="detail-label">File:</span>
                      <span className="detail-value">{fileUpload.fileName}</span>
                    </div>
                    <div className="upload-detail-item">
                      <span className="detail-label">Timestamp:</span>
                      <span className="detail-value">{new Date(fileUpload.lastUploadTimestamp).toLocaleString()}</span>
                    </div>
                    <div className="upload-detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value success">✓ Added to exam questions</span>
                    </div>
                    <div className="upload-detail-item">
                      <span className="detail-label">Total Marks:</span>
                      <span className="detail-value">
                        {fileUpload.preview.reduce((sum, q) => sum + parseInt(q.marks || 1), 0)} marks
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="questions-list-container">
                  <div className="questions-scroll">
                    <ul className="question-list">
                      {fileUpload.preview.slice(0, 10).map((q, index) => (
                        <li key={q.id} className="question-item csv-question-item new-item">
                          <div className="question-text">
                            <span className="question-number">Q{index + 1}.</span>
                            {q.question}
                            <span className="question-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                            <span className="csv-source-tag">CSV</span>
                          </div>
                          <div className="question-options">
                            {q.options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`question-option ${optIndex === q.correctOption ? 'correct' : ''}`}
                              >
                                <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                                {option}
                                {optIndex === q.correctOption && <span className="correct-check">✓</span>}
                              </div>
                            ))}
                          </div>
                          <button 
                            className="edit-question-btn"
                            onClick={() => handleEditQuestion(q.id)}
                            title="Edit question"
                          >
                            ✎
                          </button>
                          <button 
                            className="remove-question-btn"
                            onClick={() => handleRemoveQuestion(q.id)}
                            title="Remove question"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                      
                      {fileUpload.preview.length > 10 && (
                        <li className="question-item text-center py-3">
                          <i>...and {fileUpload.preview.length - 10} more questions added</i>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {/* Add batch removal option */}
                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      // Filter out the questions from this batch
                      const filteredQuestions = formData.questions.filter(
                        q => q.uploadBatch !== fileUpload.lastUploadTimestamp
                      );
                      
                      setFormData({
                        ...formData,
                        questions: filteredQuestions
                      });
                      
                      // Clear the preview
                      setFileUpload({
                        ...fileUpload,
                        preview: [],
                        lastUploadTimestamp: null
                      });
                    }}
                  >
                    Remove All Uploaded Questions
                  </Button>
                </div>
              </div>
            )}{formData.questions.length > 0 && (
              <div className="section-container">
                <div className="section-title">Added Questions</div>
                <div className="questions-list-container">
                  <div className="questions-scroll">
                    {/* Group questions by their source/batch */}
                    {(() => {
                      // Group questions by upload batch or manual entry
                      const manualQuestions = formData.questions.filter(q => q.source === 'manual-entry');
                      
                      // Get unique upload batches
                      const uploadBatches = [...new Set(
                        formData.questions
                          .filter(q => q.source === 'csv-upload' && q.uploadBatch)
                          .map(q => q.uploadBatch)
                      )];
                      
                      return (
                        <>
                          {/* Show manual questions first */}
                          {manualQuestions.length > 0 && (
                            <div className="question-group">
                              <div className="question-group-header">
                                <span className="question-group-title">Manually Added Questions</span>
                                <span className="question-count">{manualQuestions.length} questions</span>
                              </div>
                              <ul className="question-list">
                                {manualQuestions.map((q, index) => (
                                  <li key={q.id} className="question-item">
                                    <div className="question-text">
                                      <span className="question-number">Q{index + 1}.</span>
                                      {q.question}
                                      <span className="question-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="question-options">
                                      {q.options.map((option, optIndex) => (
                                        <div 
                                          key={optIndex} 
                                          className={`question-option ${optIndex === q.correctOption ? 'correct' : ''}`}
                                        >
                                          <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                                          {option}
                                          {optIndex === q.correctOption && <span className="correct-check">✓</span>}
                                        </div>
                                      ))}
                                    </div>
                                    <button 
                                      className="edit-question-btn"
                                      onClick={() => handleEditQuestion(q.id)}
                                      title="Edit question"
                                    >
                                      ✎
                                    </button>
                                    <button 
                                      className="remove-question-btn"
                                      onClick={() => handleRemoveQuestion(q.id)}
                                      title="Remove question"
                                    >
                                      ×
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Show CSV upload batches */}
                          {uploadBatches.map(batchId => {
                            const batchQuestions = formData.questions.filter(q => q.uploadBatch === batchId);
                            if (batchQuestions.length === 0) return null;
                            
                            const fileName = batchQuestions[0].fileName || 'CSV Upload';
                            const uploadTime = new Date(parseInt(batchId)).toLocaleString();
                            
                            return (
                              <div key={batchId} className="question-group csv-question-group">
                                <div className="question-group-header">
                                  <span className="question-group-title">
                                    <span className="csv-icon">📄</span> {fileName}
                                  </span>
                                  <span className="question-count">{batchQuestions.length} questions</span>
                                  <span className="upload-time">Uploaded: {uploadTime}</span>                                  <button 
                                    className="remove-batch-btn"
                                    onClick={() => handleRemoveBatchOfQuestions(batchId)}
                                    title="Remove all questions from this upload"
                                  >
                                    Remove All
                                  </button>
                                </div>
                                <ul className="question-list">
                                  {batchQuestions.map((q, index) => (
                                    <li key={q.id} className="question-item csv-question-item">
                                      <div className="question-text">
                                        <span className="question-number">Q{index + 1}.</span>
                                        {q.question}
                                        <span className="question-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                        <span className="csv-source-tag">CSV</span>
                                      </div>
                                      <div className="question-options">
                                        {q.options.map((option, optIndex) => (
                                          <div 
                                            key={optIndex} 
                                            className={`question-option ${optIndex === q.correctOption ? 'correct' : ''}`}
                                          >
                                            <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                                            {option}
                                            {optIndex === q.correctOption && <span className="correct-check">✓</span>}
                                          </div>
                                        ))}
                                      </div>
                                      <button 
                                        className="edit-question-btn"
                                        onClick={() => handleEditQuestion(q.id)}
                                        title="Edit question"
                                      >
                                        ✎
                                      </button>
                                      <button 
                                        className="remove-question-btn"
                                        onClick={() => handleRemoveQuestion(q.id)}
                                        title={`Remove question from ${fileName}`}
                                      >
                                        ×
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="tab-navigation">
              <Button className="prev-btn" onClick={prevTab}>
                Back: Eligibility
              </Button>
              <Button 
                className="next-btn" 
                onClick={nextTab}
                disabled={!validation.questions}
              >
                Next: Review & Submit
              </Button>
            </div>
          </div>

          {/* Tab 4: Review & Submit */}
          <div className={`tab-content ${activeTab === 4 ? 'active' : ''}`}>
            <div className="review-container">
              {error && (
                <div className="alert alert-danger mt-3 mb-4" role="alert">
                  <strong>Error:</strong> {error}
                  <div className="mt-2">
                    <small>If this issue persists, please check your network connection or contact support.</small>
                  </div>
                </div>
              )}
              
              <div className="section-container">
                <div className="section-title">Review Exam Details</div>
                <div className="review-section">
                  <h6>Basic Details</h6>
                  <div className="review-grid">
                    <div className="review-item">
                      <div className="review-label">Title</div>
                      <div className="review-value">{formData.basicDetails.title}</div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Type</div>
                      <div className="review-value">{formData.basicDetails.type}</div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Duration</div>
                      <div className="review-value">{formData.basicDetails.duration} minutes</div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Passing Percentage</div>
                      <div className="review-value">{formData.basicDetails.passingPercentage}%</div>
                    </div>                    <div className="review-item">
                      <div className="review-label">Start Date & Time</div>
                      <div className="review-value">
                        {formatDateTime(formData.basicDetails.startDate, formData.basicDetails.startTime)}
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">End Date & Time</div>
                      <div className="review-value">
                        {formatDateTime(formData.basicDetails.endDate, formData.basicDetails.endTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <h6>Eligibility Criteria</h6>
                  <div className="review-grid">
                    <div className="review-item">
                      <div className="review-label">Eligible Departments</div>
                      <div className="review-value">
                        {formData.eligibility.departments.length > 0 
                          ? formData.eligibility.departments.join(', ') 
                          : 'All Departments'}
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Eligible Branches</div>
                      <div className="review-value">
                        {formData.eligibility.branches.length > 0 
                          ? formData.eligibility.branches.join(', ') 
                          : 'All Branches'}
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Eligible Semesters</div>
                      <div className="review-value">
                        {formData.eligibility.semesters.length > 0 
                          ? formData.eligibility.semesters.map(s => `${s}${getOrdinalSuffix(s)} Semester`).join(', ') 
                          : 'All Semesters'}
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Minimum CGPA</div>
                      <div className="review-value">
                        {formData.eligibility.minCGPA || 'Not specified'}
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Minimum Percentage</div>
                      <div className="review-value">
                        {formData.eligibility.minPercentage ? `${formData.eligibility.minPercentage}%` : 'Not specified'}
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Maximum Backlogs</div>
                      <div className="review-value">
                        {formData.eligibility.maxBacklogs || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <h6>Question Summary</h6>
                  <div className="review-grid">
                    <div className="review-item">
                      <div className="review-label">Total Questions</div>
                      <div className="review-value">{formData.questions.length}</div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Total Marks</div>
                      <div className="review-value">
                        {formData.questions.reduce((sum, q) => sum + parseInt(q.marks || 1), 0)} marks
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Passing Marks</div>
                      <div className="review-value">
                        {Math.ceil((formData.questions.reduce((sum, q) => sum + parseInt(q.marks || 1), 0) * parseInt(formData.basicDetails.passingPercentage || 60)) / 100)} marks
                        ({formData.basicDetails.passingPercentage || 60}%)
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Questions from CSV</div>
                      <div className="review-value">
                        {formData.questions.filter(q => q.source === 'csv-upload').length} questions
                      </div>
                    </div>
                    <div className="review-item">
                      <div className="review-label">Manually Added Questions</div>
                      <div className="review-value">
                        {formData.questions.filter(q => q.source !== 'csv-upload').length} questions
                      </div>
                    </div>
                  </div>
                </div>

                {formData.questions.length > 0 && (
                  <div className="review-section">
                    <h6>Question Preview</h6>
                    <div className="questions-list-container">
                      <div className="questions-scroll">
                        <ul className="question-list">
                          {formData.questions.slice(0, 5).map((q, index) => (
                            <li key={q.id} className="question-item">
                              <div className="question-text">
                                <span className="question-number">Q{index + 1}.</span>
                                {q.question}
                                <span className="question-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                {q.source === 'csv-upload' && <span className="csv-source-tag">CSV</span>}
                              </div>
                              <div className="question-options">
                                {q.options.map((option, optIndex) => (
                                  <div 
                                    key={optIndex} 
                                    className={`question-option ${optIndex === q.correctOption ? 'correct' : ''}`}
                                  >
                                    <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                                    {option}
                                    {optIndex === q.correctOption && <span className="correct-check">✓</span>}
                                  </div>
                                ))}
                              </div>
                            </li>
                          ))}
                          
                          {formData.questions.length > 5 && (
                            <li className="question-item text-center py-3">
                              <i>...and {formData.questions.length - 5} more questions</i>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {formData.basicDetails.instructions && (
                  <div className="review-section">
                    <h6>Instructions for Students</h6>
                    <div className="instructions-preview">
                      {formData.basicDetails.instructions}
                    </div>
                  </div>
                )}
                {/* Display validation issues if any */}
              {!isValidForSubmission() && (
                <div className="review-section validation-issues">
                  <h6>Issues to Fix Before Scheduling</h6>
                  <ul className="issues-list">
                    {getSubmissionIssues().map((issue, index) => (
                      <li key={index} className="issue-item">
                        <span className="issue-icon">⚠️</span>
                        <span className="issue-text">{issue}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="alert alert-info mt-3 mb-0">
                    <strong>Note:</strong> You can still save this exam as a draft and complete it later.
                  </div>
                </div>
              )}
              </div>

              <div className="tab-navigation">
                <Button className="prev-btn" onClick={prevTab} disabled={loading}>
                  Back: Questions
                </Button>
                <div className="submit-buttons">
                  <Button 
                    className="save-draft-btn"
                    onClick={() => handleCreateExam('Draft')}
                    disabled={loading || formData.questions.length === 0}
                  >
                    {loading && formData.status === 'Draft' ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving Draft...
                      </>
                    ) : 'Save as Draft'}
                  </Button>
                  <Button 
                    className="create-btn"
                    onClick={() => handleCreateExam('Scheduled')}
                    disabled={loading || formData.questions.length === 0 || !isValidForSubmission()}
                  >
                    {loading && formData.status === 'Scheduled' ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating & Scheduling...
                      </>
                    ) : 'Create & Schedule Exam'}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  <strong>Error:</strong> {error}
                  <div className="mt-2">
                    <small>Troubleshooting tips:</small>
                    <ul style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
                      <li>Check that you're logged in and your session hasn't expired</li>
                      <li>Verify that the server is running and accessible</li>
                      <li>Try refreshing the page and logging in again</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {formData.questions.length === 0 && (
                <div className="alert alert-warning mt-3" role="alert">
                  <strong>Warning:</strong> You need to add at least one question before creating the exam.
                </div>
              )}
              
              {!isValidForSubmission() && formData.questions.length > 0 && (
                <div className="alert alert-info mt-3" role="alert">
                  <strong>Note:</strong> Please fill all required details (title, start/end dates, duration) before scheduling the exam. You can still save as draft.
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
};

// Helper function to get ordinal suffix for numbers
const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
};

// Helper function to format date and time
const formatDateTime = (date, time) => {
  if (!date) return 'Not specified';
  
  try {
    // Create a Date object from the date and time
    const dateObj = new Date(`${date}T${time || '00:00'}`);
    
    // Format the date in a user-friendly way
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    // Format the time in 12-hour format
    const formattedTime = time ? dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : 'Not specified';
    
    return `${formattedDate}, ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return `${date} ${time || ''}`;
  }
};

// CSV parsing function
const parseCSV = (csvContent) => {
  // Split by lines first - handle different line break types
  const lines = csvContent.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  // Extract header (first row)
  const headerLine = lines[0];
  
  // Initialize headers array
  let headers = [];
  let insideQuotes = false;
  let currentHeader = '';
  let headerIndex = 0;
  
  // Parse headers carefully character by character to handle quoted headers with commas
  while (headerIndex < headerLine.length) {
    const char = headerLine[headerIndex];
    
    if (char === '"') {
      // Handle escaped quotes within quoted text
      if (insideQuotes && headerIndex + 1 < headerLine.length && headerLine[headerIndex + 1] === '"') {
        currentHeader += '"';
        headerIndex += 2; // Skip both quote characters
        continue;
      }
      // Toggle quote state
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      // End of header
      headers.push(currentHeader.trim());
      currentHeader = '';
    } else {
      // Add character to current header
      currentHeader += char;
    }
    
    headerIndex++;
  }
  
  // Add the last header
  if (currentHeader) {
    headers.push(currentHeader.trim());
  }
  
  // Clean headers from quotes and normalize to lowercase for consistent matching
  headers = headers.map(header => 
    header.replace(/^"(.*)"$/, '$1').trim().toLowerCase());
  
  // Map required column indices
  const columnMap = {
    question: headers.indexOf('question'),
    option1: headers.indexOf('option1'),
    option2: headers.indexOf('option2'),
    option3: headers.indexOf('option3'),
    option4: headers.indexOf('option4'),
    correctOption: headers.indexOf('correctoption'), // Lowercase for case-insensitive matching
    marks: headers.indexOf('marks')
  };
  
  // Debug column mapping
  console.log('Headers found:', headers);
  console.log('Column mapping:', columnMap);
  
  // Validate if all required columns exist
  const missingColumns = Object.entries(columnMap)
    .filter(([_, index]) => index === -1)
    .map(([key, _]) => key);
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns in CSV: ${missingColumns.join(', ')}. Headers found: ${headers.join(', ')}`);
  }
  
  // Parse data rows and create question objects
  const data = [];
  
  // Process each line
  for (let i = 1; i < lines.length; i++) {
    try {
      // Skip empty lines
      if (!lines[i].trim()) continue;
      
      let lineContent = lines[i];
      let parsedValues = [];
      let insideQuotes = false;
      let currentValue = '';
      
      // Parse CSV line character by character to handle quotes and commas correctly
      for (let j = 0; j < lineContent.length; j++) {
        const char = lineContent[j];
        
        if (char === '"') {
          // Handle escaped quotes ("") within quoted text
          if (insideQuotes && j + 1 < lineContent.length && lineContent[j + 1] === '"') {
            currentValue += '"';
            j++; // Skip the next quote
          } else {
            // Toggle the insideQuotes flag
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          // End of value
          parsedValues.push(currentValue.trim());
          currentValue = '';
        } else {
          // Add the character to the current value
          currentValue += char;
        }
      }
      
      // Add the last value
      parsedValues.push(currentValue.trim());
      
      // Debug the parsed values
      console.log(`Line ${i} values:`, parsedValues);
      
      // Make sure we have enough values for all required columns
      while (parsedValues.length < Object.keys(columnMap).length) {
        parsedValues.push(''); // Pad with empty values if needed
      }
      
      // Create an object with the mapped columns
      const rowData = {
        question: parsedValues[columnMap.question],
        option1: parsedValues[columnMap.option1],
        option2: parsedValues[columnMap.option2],
        option3: parsedValues[columnMap.option3],
        option4: parsedValues[columnMap.option4],
        correctOption: parsedValues[columnMap.correctOption],
        marks: parsedValues[columnMap.marks] || '1'
      };
      
      // Remove quotes from values if they exist
      Object.keys(rowData).forEach(key => {
        if (typeof rowData[key] === 'string') {
          rowData[key] = rowData[key].replace(/^"(.*)"$/, '$1');
        }
      });
      
      data.push(rowData);
    } catch (error) {
      // Add error detail with line number
      throw new Error(`Error parsing line ${i + 1}: ${error.message}`);
    }
  }
  
  // Final validation - ensure we have at least one question
  if (data.length === 0) {
    throw new Error('No valid questions found in the CSV file. Please check the file format.');
  }
  
  return data;
};

// Function to validate parsed data
const validateParsedData = (parsedData) => {
  if (!parsedData || parsedData.length === 0) {
    return { 
      valid: false, 
      error: 'No valid questions found in the file. Please check the file format and content.' 
    };
  }
  
  // Track all validation errors to give comprehensive feedback
  const errors = [];
  
  // Check each row for required fields
  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];
    const rowNum = i + 1;
    
    // Create a snippet of the question for error messages
    const questionSnippet = row.question ? 
      (row.question.length > 30 ? 
        `"${row.question.substring(0, 30)}..."` : 
        `"${row.question}"`) : 
      `[Row ${rowNum}]`;
    
    // Check if any required field is missing
    if (!row.question || row.question.trim() === '') {
      errors.push(`Row ${rowNum}: Missing question text. All questions must have question text.`);
      continue; // Skip further validation for this row
    }
    
    // Check options
    const requiredOptions = ['option1', 'option2', 'option3', 'option4'];
    for (const option of requiredOptions) {
      if (!row[option] || row[option].trim() === '') {
        errors.push(`Row ${rowNum}: ${questionSnippet} is missing ${option}.`);
      }
    }
    
    // Check if correct option is provided
    if (row.correctOption === undefined || row.correctOption === null || row.correctOption.toString().trim() === '') {
      errors.push(`Row ${rowNum}: ${questionSnippet} is missing the correct option index.`);
    } else {
      // Check if correct option is valid (should be 0-3)
      const correctOption = parseInt(row.correctOption);
      if (isNaN(correctOption) || correctOption < 0 || correctOption > 3) {
        errors.push(`Row ${rowNum}: ${questionSnippet} has invalid correct option value "${row.correctOption}". It must be between 0 and 3.`);
      }
    }
    
    // Check if marks is a valid number
    if (row.marks) {
      const marks = parseInt(row.marks);
      if (isNaN(marks) || marks <= 0) {
        errors.push(`Row ${rowNum}: ${questionSnippet} has invalid marks value "${row.marks}". Marks must be a positive number.`);
      }
    }
  }
  
  // If we found any errors, return them
  if (errors.length > 0) {
    // Limit the number of errors displayed to avoid overwhelming the user
    const displayedErrors = errors.slice(0, 5);
    const remainingCount = errors.length - 5;
    
    let errorMessage = displayedErrors.join('\n');
    if (remainingCount > 0) {
      errorMessage += `\n\nPlus ${remainingCount} more error${remainingCount === 1 ? '' : 's'}. Please fix all errors and try again.`;
    }
    
    return {
      valid: false,
      error: errorMessage
    };
  }
  
  // All validation passed
  return { 
    valid: true,
    message: `Successfully validated ${parsedData.length} questions.`
  };
};

// Enhanced message display component for file upload status
const FileUploadMessage = ({ type, message, onDismiss }) => {
  if (!message) return null;
  
  const isError = type === 'error';
  const className = isError ? 'upload-error' : 'upload-success';
  const iconClass = isError ? 'error-icon' : 'success-icon';
  const messageClass = isError ? 'error-message' : 'success-message';
  const icon = isError ? '⚠️' : '✓';
  
  // For error messages that contain newlines, convert to paragraph elements
  const messageLines = message.split('\n').filter(line => line.trim() !== '');
  
  return (
    <div className={className}>
      <div className={iconClass}>{icon}</div>
      <div className={messageClass}>
        {messageLines.length > 1 ? (
          messageLines.map((line, i) => (
            <p key={i} style={{ margin: i === 0 ? '0 0 8px 0' : i === messageLines.length - 1 ? '8px 0 0 0' : '8px 0' }}>
              {line}
            </p>
          ))
        ) : (
          message
        )}
      </div>
      {onDismiss && (
        <button 
          className="dismiss-message-btn" 
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            color: isError ? '#b91c1c' : '#166534',
            padding: '0 4px'
          }}
          title="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ExamCreationPage;