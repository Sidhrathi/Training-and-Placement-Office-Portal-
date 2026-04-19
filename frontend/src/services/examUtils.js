/**
 * Utility functions for exam handling
 */

/**
 * Clean and process an exam ID to handle various formats
 * @param {string} examId - The raw exam ID
 * @returns {string} - A cleaned version of the exam ID
 */
export const processExamId = (examId) => {
  if (!examId) return '';
  
  let cleanId = examId;
  
  // Check if ID is in ObjectId("hex") format and extract the hex
  const objectIdMatch = /ObjectId\(['"]?([0-9a-fA-F]+)['"]?\)/i.exec(examId);
  if (objectIdMatch && objectIdMatch[1]) {
    cleanId = objectIdMatch[1];
    console.log(`Extracted hex ID ${cleanId} from ObjectId format`);
  }
  
  // Remove any quotes or whitespace
  cleanId = cleanId.toString().replace(/['"]/g, '').trim();
  
  return cleanId;
};

/**
 * Validate a URL parameter
 * @param {object} params - The params object from useParams()
 * @param {string} paramName - The name of the parameter to validate
 * @returns {object} - { isValid, value, error }
 */
export const validateUrlParam = (params, paramName) => {
  // Check if the parameter exists
  if (!params || !params[paramName]) {
    return { 
      isValid: false, 
      value: null, 
      error: `Parameter ${paramName} is missing from URL` 
    };
  }
  
  const value = params[paramName];
  
  // Check if the parameter has a value
  if (!value || value.trim() === '') {
    return { 
      isValid: false, 
      value: null, 
      error: `Parameter ${paramName} is empty` 
    };
  }
  
  return { isValid: true, value, error: null };
};

/**
 * Verify that an exam ID is valid
 * @param {string} examId - The exam ID to validate
 * @returns {object} - { isValid, cleanId, error }
 */
export const verifyExamId = (examId) => {
  // First check if we have an exam ID
  if (!examId) {
    return { 
      isValid: false, 
      cleanId: null, 
      error: 'Exam ID is missing' 
    };
  }
  
  // Process the ID to handle various formats
  const cleanId = processExamId(examId);
  
  // Check if the ID is valid
  if (!cleanId) {
    return { 
      isValid: false, 
      cleanId: null, 
      error: 'Failed to extract a valid exam ID' 
    };
  }
  
  return { isValid: true, cleanId, error: null };
};
