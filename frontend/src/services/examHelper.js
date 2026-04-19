/**
 * Helper functions for exam-related operations
 */

/**
 * Process an exam ID to handle various formats
 * @param {string} rawId - The raw exam ID that might be in ObjectId format
 * @returns {string} - Cleaned ID suitable for API calls
 */
export const cleanExamId = (rawId) => {
  if (!rawId) return '';
  
  let processedId = rawId;
  
  // Handle ObjectId("hex") format with various quote styles
  const objectIdMatch = /ObjectId\(['"]?([0-9a-fA-F]+)['"]?\)/i.exec(rawId);
  if (objectIdMatch && objectIdMatch[1]) {
    processedId = objectIdMatch[1];
    console.log(`Extracted ID ${processedId} from ObjectId format`);
  }
  
  // Remove quotes and whitespace
  processedId = processedId.toString().replace(/['"]/g, '').trim();
  
  return processedId;
};

/**
 * Check if a string is a valid MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} - Whether the ID is a valid MongoDB ObjectId
 */
export const isValidMongoObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Determine if an exam is currently active based on its dates or status
 * @param {object} exam - The exam object to check
 * @returns {boolean} - Whether the exam is active
 */
export const isExamActive = (exam) => {
  if (!exam) return false;
  
  const now = new Date();
  
  // Check based on dates first (preferred method)
  if (exam.startDate && exam.endDate) {
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);
    return now >= startDate && now <= endDate;
  }
  
  // Fall back to status field
  if (exam.status) {
    const status = exam.status.toLowerCase();
    return status === 'active' || status === 'ongoing' || status === 'published';
  }
  
  return false;
};

/**
 * Get a user-friendly status label for an exam
 * @param {object} exam - The exam object
 * @returns {string} - Status label ('Active', 'Scheduled', 'Expired', etc.)
 */
export const getExamStatus = (exam) => {
  if (!exam) return 'Unknown';
  
  const now = new Date();
  
  // Prioritize date-based status
  if (exam.startDate && exam.endDate) {
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);
    
    if (now < startDate) {
      return 'Scheduled';
    } else if (now > endDate) {
      return 'Expired';
    } else {
      return 'Active';
    }
  }
  
  // Fall back to the stored status if dates aren't available
  return exam.status || 'Unknown';
};

/**
 * Format an API error into a standardized error object with helpful messages
 * @param {Error} error - The original error object from the API call
 * @param {string} defaultMessage - Default message to use if no specific error is found
 * @param {string} context - Additional context for logging (e.g., "fetching exam")
 * @returns {object} - Standardized error information with user-friendly message
 */
export const formatApiError = (error, defaultMessage = 'Operation failed', context = '') => {
  console.error(`API Error ${context ? 'while ' + context : ''}:`, error);
  
  // Extract most useful error message
  let message = defaultMessage;
  let statusCode = error.response?.status || 0;
  let redirectNeeded = false;
  
  // Try to extract the most specific error message
  if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.message) {
    message = error.message;
  }
  
  // Customize message based on status code
  if (statusCode === 400) {
    if (message.toLowerCase().includes('id')) {
      message = 'Invalid ID format or missing parameter';
      redirectNeeded = true;
    }
  } else if (statusCode === 401) {
    message = 'Your session has expired. Please login again.';
    redirectNeeded = true;
  } else if (statusCode === 403) {
    message = 'You do not have permission to access this resource';
    redirectNeeded = true;
  } else if (statusCode === 404) {
    message = 'The requested resource could not be found';
    redirectNeeded = true;
  } else if (statusCode >= 500) {
    message = 'Server error. Please try again later';
  }
  
  return {
    message,
    statusCode,
    redirectNeeded,
    originalError: error
  };
};
