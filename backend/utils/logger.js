const ActivityLog = require('../models/ActivityLog');

/**
 * Utility function to log system activities
 * @param {Object} options - Log options
 * @param {String} options.action - The action being performed
 * @param {String} options.details - Detailed description of the activity
 * @param {String|ObjectId} [options.user] - User ID if available
 * @param {String} [options.userType] - Type of user (Admin, TPO, Student)
 * @param {String} [options.userName] - Name of the user for easier reference
 * @param {String} [options.resource] - Resource being affected (e.g. 'Job', 'Exam')
 * @param {String|ObjectId} [options.resourceId] - ID of the resource
 * @param {String} [options.status] - Status of the action (success, error, warning, info)
 * @param {String} [options.ip] - IP address of the request
 * @returns {Promise<Object>} - The created log entry
 */
const logger = async (options) => {
  try {
    // Create log entry with provided options
    const log = await ActivityLog.create({
      action: options.action,
      details: options.details,
      user: options.user || null,
      userType: options.userType || 'System',
      userName: options.userName || 'System',
      resource: options.resource || null,
      resourceId: options.resourceId || null,
      status: options.status || 'info',
      ip: options.ip || null
    });

    // Return the created log entry
    return log;
  } catch (error) {
    // Log error to console but don't throw - we don't want logger failures to break app flow
    console.error('Error creating activity log:', error);
    
    // Try to create an error log
    try {
      // If available, use the ErrorLog model to log this error
      const ErrorLog = require('../models/ErrorLog');
      await ErrorLog.create({
        errorMessage: `Failed to create activity log: ${error.message}`,
        errorStack: error.stack,
        path: 'logger utility'
      });
    } catch (nestedError) {
      console.error('Failed to log error in logger utility:', nestedError);
    }
    
    // Return null since log creation failed
    return null;
  }
};

module.exports = logger;