import  { useState } from 'react';
import {  Button } from 'react-bootstrap';
import '../styles/ExamInterface.css';

const ExamInterface = ({
  examData,
  remainingTime,
  questions,
  currentQuestionIndex,
  userAnswers,
  onAnswerSelect,
  onNext,
  onPrevious,
  onGoToQuestion,
  onSubmit,
  submitting
}) => {  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const currentQuestion = questions[currentQuestionIndex];
    
  // Calculate progress
  const totalQuestions = questions.length;
  // Filter answers to ensure we only count valid question IDs
  const validQuestionIds = questions.map(q => q.id || q._id);
  const validAnswers = Object.entries(userAnswers)
    .filter(([key, value]) => validQuestionIds.includes(key) && value !== undefined && value !== null);
  const attemptedQuestions = validAnswers.length;
  // Ensure progress never exceeds 100%
  const progress = Math.min(100, Math.round((attemptedQuestions / totalQuestions) * 100));
  
  return (
    <div className="exam-interface-container">
      <div className="exam-header">
        <div className="exam-title">
          <h2>{examData.title}</h2>
        </div>
        <div className="exam-timer">
          <div className="timer-icon"><i className="fas fa-clock"></i></div>
          <div className="timer-display">{remainingTime}</div>
        </div>
      </div>
      
      <div className="exam-content-wrapper">
        {/* Left sidebar - Combined question info, progress and navigator */}
        <div className="exam-left-sidebar">
          {/* Question info section */}          <div className="question-info-panel">
            <div className="question-number-display">
              <div className="question-label">Question</div>
              <div className="current-question">
                <strong>{currentQuestionIndex +1}</strong>
                <span className="total-questions">of {totalQuestions}</span>
              </div>
            </div>
            
            <div className="marks-badge-container">
              <div className="marks-badge">{currentQuestion?.marks || 1} mark{currentQuestion?.marks > 1 ? 's' : ''}</div>
            </div>
          </div>
          
          {/* Progress section */}
          <div className="your-progress-panel">
            <h5 className="progress-title">Your Progress</h5>
            <div className="progress-details">              <div className="questions-answered">
                <span className="progress-count">{attemptedQuestions}</span>
                <span className="total-questions">/{totalQuestions}</span>
                <span className="questions-answered-text">questions answered</span>
              </div>
              
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              
              <div className="progress-percent">{progress}% completed</div>
            </div>
          </div>
          
          {/* Question Navigator section */}          <div className="navigator-container">
            <h5 className="navigator-title">Question Navigator</h5>
            <div className="questions-grid">
              {questions.map((q, index) => {
                let buttonClass = "question-button";
                const questionId = q.id || q._id;
                if (index === currentQuestionIndex) buttonClass += " current";
                else if (userAnswers[questionId] !== undefined && userAnswers[questionId] !== null) buttonClass += " answered";
                
                return (
                  <button
                    key={index}
                    className={buttonClass}
                    onClick={() => onGoToQuestion(index)}
                    disabled={submitting}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="status-legend">
              <div className="legend-item">
                <div className="legend-color unanswered"></div>
                <span>Unanswered</span>
              </div>
              <div className="legend-item">
                <div className="legend-color answered"></div>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <div className="legend-color current"></div>
                <span>Current</span>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <Button 
            variant="success"
            size="lg"
            className="submit-exam-button"
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </div>

        {/* Main content - Question and options */}
        <div className="exam-main-content">
          <div className="question-header">
            <h3>Question {currentQuestionIndex + 1}</h3>
          </div>
          <div className="question-content">
            <div className="question-text">
              {currentQuestion?.question}
            </div>            <div className="options-container">
              {currentQuestion?.options.map((option, index) => {
                const questionId = currentQuestion.id || currentQuestion._id;
                const isSelected = userAnswers[questionId] === index;
                
                return (
                  <div 
                    key={index} 
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onAnswerSelect(questionId, index)}
                  >
                    <div className="custom-radio-container">
                      <div className={`custom-radio ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="custom-radio-dot"></div>}
                      </div>
                      <div className="option-text">{option}</div>
                    </div>
                  </div>
                );
              })}
              {/* Reset option */}
              <div className="reset-option" onClick={() => {
                const questionId = currentQuestion.id || currentQuestion._id;
                onAnswerSelect(questionId, null);
              }}>
                Reset selection
              </div>
            </div>
          </div>
          <div className="navigation-buttons">
            <Button 
              variant="outline-secondary" 
              onClick={onPrevious}
              disabled={currentQuestionIndex === 0 || submitting}
              className="prev-button"
            >
              <i className="fas fa-chevron-left me-2"></i>Previous
            </Button>
            
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button 
                variant="outline-primary" 
                onClick={onNext}
                disabled={submitting}
                className="next-button"
              >
                Next<i className="fas fa-chevron-right ms-2"></i>
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="next-button"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            )}
          </div>
        </div>
      </div>      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirm-modal-backdrop">
          <div className="confirm-modal shadow">
            <div className="confirm-modal-header">
              <h3>Submit Exam?</h3>
              <button 
                className="close-button"
                onClick={() => setShowConfirmModal(false)}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>            <div className="confirm-modal-body">
              <p>You've answered <strong>{attemptedQuestions}</strong> out of <strong>{totalQuestions}</strong> questions.</p>
              {attemptedQuestions < totalQuestions && (                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>You still have {totalQuestions - attemptedQuestions} unanswered questions.</span>
                </div>
              )}
              <p className="mb-0">Are you sure you want to submit your exam?</p>
            </div>
            <div className="confirm-modal-footer">              <Button 
                className="modal-cancel-btn"
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                className="modal-submit-btn"
                variant="success"
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  'Yes, Submit Exam'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterface;
