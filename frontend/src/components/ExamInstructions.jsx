import React, { useState } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import '../styles/ExamInstructions.css';

const ExamInstructions = ({ examData, onStartExam, isStarting = false }) => {
  const [confirmingStart, setConfirmingStart] = useState(false);
  
  // Validate exam data
  if (!examData) {
    return (
      <div className="exam-instructions-container">
        <Card className="instructions-card error-card">
          <Card.Header as="h2">
            <div className="exam-title">Exam Data Error</div>
          </Card.Header>
          <Card.Body>
            <p className="text-danger">Could not load exam details. Please return to the dashboard and try again.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }
    const handleStartClick = () => {
    setConfirmingStart(true);
    onStartExam();
  };
    return (
    <div className="exam-instructions-container">
      <Card className="instructions-card mx-auto">
        <Card.Header as="h2">
          <div className="exam-title">{examData.title}</div>
        </Card.Header>
        
        <Card.Body>
          <div className="exam-info">
            <div className="info-item">
              <span className="info-label">Duration:</span> 
              <span className="info-value">{examData.duration} minutes</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type:</span> 
              <span className="info-value">{examData.type}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Questions:</span> 
              <span className="info-value">{examData.totalQuestions || "Will be displayed once exam starts"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Passing Percentage:</span> 
              <span className="info-value">{examData.passingPercentage}%</span>
            </div>
          </div>
            <div className="instructions-section">
            <h3>Instructions</h3>
            <div className="instructions-content">
              {examData.instructions ? (
                <p>{examData.instructions}</p>
              ) : (
                <ul>
                  <li>The timer will start as soon as you click the "Start Exam" button.</li>
                  <li>Once started, the exam must be completed within the time limit.</li>
                  <li>You can navigate between questions using the Next and Previous buttons.</li>
                  <li>You can also jump to any question using the question navigator panel.</li>
                  <li>Questions that have been answered will be marked in green.</li>
                  <li>Unanswered questions will remain grey.</li>
                  <li>You can review your answers before final submission.</li>
                  <li>The exam will be auto-submitted when the time expires.</li>
                  <li>Do not refresh the page during the exam.</li>
                  <li>If you encounter any technical issues, please contact the administrator.</li>
                </ul>
              )}
            </div>
          </div>
          
          <div className="start-exam-section">
            <p className="start-notice">Click the button below when you're ready to begin the exam</p>
            {isStarting || confirmingStart ? (
              <div className="text-center">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="start-exam-button"
                  disabled
                >
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ml-2">Starting Exam...</span>
                </Button>
                <p className="text-muted mt-2">Please wait while we prepare your exam...</p>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="lg" 
                className="start-exam-button"
                onClick={handleStartClick}
              >
                Start Exam
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ExamInstructions;
