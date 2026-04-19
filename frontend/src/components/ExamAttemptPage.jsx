import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './Header';
import Footer from './footer';
import ExamInstructions from './ExamInstructions';
import ExamInterface from './ExamInterface';
import studentService from '../services/studentService';
import { verifyExamId, validateUrlParam } from '../services/examUtils';
import { formatApiError } from '../services/examHelper';
import '../styles/ExamAttempt.css';

const ExamAttemptPage = () => {
  // Extract and validate the exam ID from URL parameters
  const params = useParams();
  const navigate = useNavigate();
  
  // Debug URL parameters
  console.log('ROUTER PARAMS:', params);
  console.log('CURRENT URL:', window.location.href);
  
  // First, validate that the URL has an examId parameter
  const { isValid, value: examId, error: paramError } = validateUrlParam(params, 'examId');
  
  if (!isValid) {
    console.error('URL parameter validation failed:', paramError);
  } else {
    console.log('Found examId in URL parameters:', examId);
  }
  
  // Then verify that the exam ID is valid
  const { isValid: isValidId, cleanId, error: idError } = verifyExamId(examId);
  
  // Now we have a clean ID if validation passed
  const finalExamId = isValidId ? cleanId : null;
  console.log('Final processed exam ID:', finalExamId);
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [examStarting, setExamStarting] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  
  // Timer reference for cleanup
  const timerRef = useRef(null);
  
  // Debug URL parameters
  console.log('URL parameters:', params);
  console.log('Extracted examId:', examId);  // If the initial validation failed, set an error state immediately
  useEffect(() => {
    if (!isValid || !isValidId) {
      setError(paramError || idError || 'Invalid exam ID. Please return to the dashboard.');
      setLoading(false);
      console.error('Early validation failure:', paramError || idError);
    }
  }, [isValid, isValidId, paramError, idError]);
  
  // Main effect to fetch exam data
  useEffect(() => {
    // Function to fetch exam data using the exam ID from URL
    const fetchExamData = async () => {
      try {
        // Reset state for new attempt
        setLoading(true);
        setError(null);
        
        // Debug URL and exam ID
        console.log(`URL: ${window.location.href}`);
        console.log(`Using exam ID for fetch: ${finalExamId}`);
        
        // Validate we have a valid exam ID
        if (!finalExamId) {
          console.error('CRITICAL ERROR: No valid exam ID available');
          throw new Error('Exam ID is missing or invalid. Please return to the dashboard and try again.');
        }
          // Make the API call to get exam data with proper error handling
        console.log(`Fetching exam data with ID: ${finalExamId}`);
        const response = await studentService.getExamById(finalExamId);
        
        // Check if response exists and has data property
        if (!response || !response.data) {
          throw new Error('No exam data returned from server');
        }
        
        // Check if we have success and data properties (API format)
        if (response.data.success === false) {
          throw new Error(response.data.error || 'Failed to load exam data');
        }
        
        // Handle nested data structure from the API
        const examData = response.data.data || response.data;
        
        console.log('Retrieved exam data:', examData.title);
        setExamData(examData);
        
        // Use the helper method to determine if exam is active
        const isActive = studentService.isExamActive(examData);
        console.log(`Exam status determined by helper method: ${isActive ? 'Active' : 'Not Active'}`);
        
        if (isActive) {
          // Allow access if the exam is active based on dates
          setLoading(false);
        } else if (examData.status && examData.status.toLowerCase() === 'scheduled') {
          // For scheduled exams, show appropriate message
          setError(`This exam is scheduled to start on ${new Date(examData.startDate || examData.scheduledDate).toLocaleString()}`);
          setLoading(false);
        } else {
          // For any other status
          setError(`This exam is not currently available for attempt (Status: ${examData.status})`);
          setLoading(false);
        }    } catch (error) {
      // Use our standardized error formatter
      const { message, redirectNeeded, statusCode } = formatApiError(
        error, 
        'Failed to load exam details. Please try again later.',
        `fetching exam with ID ${finalExamId}`
      );
      
      // Initialize with a formatted error message
      let errorMessage = message;
      let redirectToDashboard = redirectNeeded;
        // Special handling for common errors
      if (!finalExamId || errorMessage.includes('missing') || errorMessage.includes('URL')) {
        // URL parameter errors
        errorMessage = 'Exam ID is missing from the URL. Please return to the dashboard and try again.';
        redirectToDashboard = true;
        console.error('Missing exam ID error, will redirect to dashboard');
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('not found')) {
        // Invalid ID format or not found errors
        errorMessage = `Invalid exam ID: "${finalExamId}". Please return to the dashboard and try again.`;
        redirectToDashboard = true;
        console.error(`Invalid exam ID: ${finalExamId}`);
      } else if (error.response?.status === 401) {
        // Authentication errors
        errorMessage = 'Your session has expired. Please login again.';
        redirectToDashboard = true;
        // Remove auth tokens
        localStorage.removeItem('token');
        console.error('Authentication error, will redirect to login');
      }
      
      // Update state with the error
      setError(errorMessage);
      setLoading(false);
      
      // Optionally redirect to dashboard after a delay for critical errors
      if (redirectToDashboard) {
        setTimeout(() => {
          console.log('Redirecting to dashboard due to critical error');
          navigate('/student-dashboard');
        }, 4000); // Give user time to read the error
      }
    }
    };
      // Only try to fetch if we have a valid ID
    if (finalExamId) {
      fetchExamData();
    }
  }, [finalExamId, navigate]);
  
  // Start timer function
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  // Format time from seconds to MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  // Handle starting the exam
  const handleStartExam = async () => {
    try {
      setExamStarting(true);
      setError(null); // Clear any previous errors
      
      if (!examData || !examData._id) {
        throw new Error('Invalid exam data. Please reload the page.');
      }
      
      console.log('Starting exam:', examData._id);
      
      try {
        // Notify backend that exam is being started
        const startResponse = await studentService.startExam(examData._id);
        console.log('Start exam response:', startResponse);
      } catch (startError) {
        console.warn('Warning - issue with exam start notification:', startError);
        // We'll continue to fetch questions even if the start endpoint has issues
      }
      
      // Fetch questions
      console.log('Fetching exam questions');
      const questionsResponse = await studentService.getExamQuestions(examData._id);
      
      console.log('Questions response:', questionsResponse);
      
      // Handle cases where response structure might vary
      let questionsList = [];
      
      if (!questionsResponse) {
        throw new Error('No response received from server');
      }
      
      // Check if response has data property
      if (!questionsResponse.data) {
        throw new Error('Invalid response format: missing data property');
      }
      
      // Extract questions based on response format
      if (Array.isArray(questionsResponse.data)) {
        // Direct array structure
        questionsList = questionsResponse.data;
        console.log('Using direct array of questions from response');
      } else if (questionsResponse.data.data && Array.isArray(questionsResponse.data.data)) {
        // Nested data structure with success flag
        questionsList = questionsResponse.data.data;
        console.log('Using nested data.data array of questions');
      } else {
        console.error('Unexpected question response format:', questionsResponse);
        throw new Error('Failed to load exam questions (invalid format). Please try again.');
      }
      
      // Validate we have questions
      if (questionsList.length === 0) {
        throw new Error('No questions available for this exam. Please contact your administrator.');
      }
      
      console.log(`Questions received: ${questionsList.length}`);
      
      // Initialize exam state
      setQuestions(questionsList);
      setRemainingTime(examData.duration * 60);
      setExamStarted(true);
      setShowInstructions(false);
        // Initialize answers object
      const initialAnswers = {};
      questionsList.forEach(q => {
        // Check if using id or _id
        const questionId = q.id || q._id;
        if (!questionId) {
          console.warn('Question is missing an ID:', q);
        }
        initialAnswers[questionId] = null;
      });
      setUserAnswers(initialAnswers);
      
      // Start the timer
      startTimer();
    } catch (error) {
      console.error('Error starting exam:', error);
      setError(error.message || 'Failed to start the exam. Please try again.');
      // Redirect back to dashboard after error
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 5000);
    } finally {
      setExamStarting(false);
    }
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };
  
  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };
  
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  // Handle exam submission
  const handleSubmitExam = async () => {
    try {
      setExamSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers = Object.entries(userAnswers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));
      
      console.log('Preparing to submit exam answers:', formattedAnswers);
      
      // Send answers to backend
      const result = await studentService.submitExam(examData._id, formattedAnswers);
      
      console.log('Exam submission response:', result);
      
      if (!result || !result.data) {
        throw new Error('No response data received from server');
      }
      
      let resultData = result.data;
      
      // Handle responses with success flag and nested data
      if (result.data.success === false) {
        throw new Error(result.data.error || 'Server reported an error during submission');
      }
      
      if (result.data.success === true && result.data.result) {
        resultData = result.data.result;
      }
        console.log('Processed exam result data:', resultData);
        // Process result - Add passed property based on percentage and passing criteria
      const percentageScore = parseFloat(resultData.percentage) || 0;
      
      // Debug - log the full objects to see available properties
      console.log('Full exam data object:', examData);
      console.log('Full result data object:', resultData);
      
      // Get passing percentage from multiple possible sources
      // Priority: 1. Exam response data, 2. Original exam data, 3. Default to 0
      const passingPercentage = resultData.passingPercentage || 
                               resultData.exam?.passingPercentage || 
                               examData.passingPercentage || 
                               0;
      
      // Add passed property to result data based on exam passing criteria
      resultData.passed = percentageScore >= passingPercentage;
      resultData.totalMarks = resultData.maxScore; // Ensure totalMarks is available for display
      console.log(`Exam passing criteria: ${percentageScore}% >= ${passingPercentage}%, Passed: ${resultData.passed}`);
      
      setExamResult(resultData);
      setExamCompleted(true);
      clearInterval(timerRef.current);
      
      // Show success message
      setSuccess("Exam submitted successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/student-dashboard', { 
          state: { examCompleted: true, examResult: resultData } 
        });
      }, 5000);
    } catch (error) {
      console.error('Error in handleSubmitExam:', error);
      setError(error.response?.data?.error || error.response?.data?.message || error.message || "Failed to submit exam. Please try again.");
    } finally {
      setExamSubmitting(false);
    }
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  return (
    <div className="exam-attempt-container">
      <Header />
      <Container className="exam-attempt-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <div className="loading-text">Loading exam data...</div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle"></i>
              <strong>Error: </strong>{error}
            </div>
            <button 
              className="btn btn-primary mt-3" 
              onClick={() => navigate('/student-dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        ) : !examData ? (
          <div className="error-container">
            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle"></i>
              <strong>No exam data found. </strong>
              Please try accessing the exam from the dashboard.
            </div>
            <button 
              className="btn btn-primary mt-3" 
              onClick={() => navigate('/student-dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        ) : examCompleted ? (
          <div className="exam-result-container">            <div className="exam-result-header">
              <h2>Exam Completed</h2>
              <div className={`result-badge ${examResult?.passed ? 'passed' : 'failed'}`}>
                {examResult?.passed ? 'Passed' : 'Failed'}
              </div>
            </div>
            <div className="result-details">
              <div className="result-item">
                <span className="result-label">Score:</span>
                <span className="result-value">{examResult?.score} / {examResult?.maxScore || examResult?.totalMarks}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Percentage:</span>
                <span className="result-value">{examResult?.percentage}%</span>
              </div>
              <div className="result-item">
                <span className="result-label">Passing Criteria:</span>
                <span className="result-value">{examResult?.exam?.passingPercentage || 0}%</span>
              </div>
            </div>
            <div className="result-message">
              {examResult?.passed 
                ? 'Congratulations! You have passed the exam.' 
                : 'You did not meet the passing criteria. Better luck next time.'}
            </div>
            <div className="redirect-message">
              Redirecting to dashboard in 5 seconds...
            </div>
          </div>
        ) : showInstructions && !examStarted ? (
          <>
            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle mr-2"></i>
                {success}
              </div>
            )}
            <ExamInstructions 
              examData={{
                title: examData.title || 'Exam',
                duration: examData.duration || 60,
                type: examData.type || 'Unknown',
                totalQuestions: (examData.sections && examData.sections.reduce((total, section) => 
                  total + (section.questions ? section.questions.length : 0), 0)) || 'Unknown',
                passingPercentage: examData.passingPercentage || 50,
                instructions: examData.instructions || null
              }}
              onStartExam={handleStartExam}
              isStarting={examStarting}
            />
            {examStarting && (
              <div className="text-center mt-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Starting exam...</span>
                </div>
                <p className="mt-2">Preparing your exam. Please wait...</p>
              </div>
            )}
          </>
        ) : (
          <>
            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle mr-2"></i>
                {success}
              </div>
            )}
            <ExamInterface
              examData={examData}
              remainingTime={formatTime(remainingTime)}
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onAnswerSelect={handleAnswerSelect}
              onNext={goToNextQuestion}
              onPrevious={goToPreviousQuestion}
              onGoToQuestion={goToQuestion}
              onSubmit={handleSubmitExam}
              submitting={examSubmitting}
            />
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default ExamAttemptPage;
