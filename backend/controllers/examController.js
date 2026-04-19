const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ErrorResponse = require('../utils/ErrorResponse');
const ActivityLog = require('../models/ActivityLog');
const ErrorLog = require('../models/ErrorLog');
const ExamLog = require('../models/ExamLog');
const ExamResult = require('../models/ExamResult');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv-parser');

/**
 * @desc    Create a new exam with sections and questions
 * @route   POST /api/exams
 * @access  Private (TPO only)
 */
exports.createExam = async (req, res, next) => {
  try {
    // Log the incoming request body for debugging
    console.log('Creating exam with data - title:', req.body.title);
    console.log('Creating exam with type:', req.body.type);
    console.log('Received sections:', req.body.sections ? req.body.sections.length : 0);
    if (req.body.sections && req.body.sections.length > 0) {
      console.log('First section questions:', req.body.sections[0].questions ? req.body.sections[0].questions.length : 0);
    }
    
    const {
      title,
      description,
      type,
      duration,
      totalMarks,
      passingMarks,
      passingPercentage,
      scheduledFor,
      registrationDeadline,
      startDate,
      endDate,
      timePerQuestion,
      showResults,
      allowReattempt,
      randomizeQuestions,
      eligibility,
      instructions,
      sections,      questions, // For backward compatibility
      userId, // Accept userId directly for easier testing
      // Remove the status parameter from destructuring as we'll calculate it
    } = req.body;

    // Validation
    if (!title || !type || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, type and duration'
      });
    }

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Please provide the scheduled date'
      });
    }

    if (!registrationDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Please provide registration deadline'
      });
    }

    // Validate dates are properly formatted
    try {
      new Date(scheduledFor);
      new Date(registrationDeadline);
      if (startDate) new Date(startDate);
      if (endDate) new Date(endDate);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Ensure sections array exists
    let finalSections = sections || [];
    
    // If no sections are provided but questions are, create a default section
    if ((!finalSections || finalSections.length === 0) && questions && questions.length > 0) {
      finalSections = [{
        name: 'Default Section',
        description: 'Auto-generated section containing all questions',
        questions: questions
      }];
    }

    // Ensure sections have questions
    if (!finalSections || finalSections.length === 0 || 
        finalSections.some(section => !section.questions || section.questions.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one question in a section'
      });
    }

    // Create the exam with all fields
    const examData = {
      title,
      description,
      type,
      duration: parseInt(duration),
      totalMarks: parseFloat(totalMarks),
      passingMarks: parseFloat(passingMarks),
      passingPercentage: parseFloat(passingPercentage),
      scheduledFor: new Date(scheduledFor),
      registrationDeadline: new Date(registrationDeadline),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      timePerQuestion: parseInt(timePerQuestion || 60),
      showResults: showResults !== undefined ? showResults : true,
      allowReattempt: allowReattempt !== undefined ? allowReattempt : false,
      randomizeQuestions: randomizeQuestions !== undefined ? randomizeQuestions : true,
      eligibility: {
        departments: eligibility?.departments || [],
        branches: eligibility?.branches || [],
        semesters: eligibility?.semesters || [],
        minCGPA: eligibility?.minCGPA ? parseFloat(eligibility.minCGPA) : undefined,
        minPercentage: eligibility?.minPercentage ? parseFloat(eligibility.minPercentage) : undefined,
        maxBacklogs: eligibility?.maxBacklogs ? parseInt(eligibility.maxBacklogs) : undefined,
        batch: eligibility?.batch || ''
      },      instructions: instructions || '',
      // Calculate status based on dates if provided
      // No need to set an explicit status as we'll use dates to determine it dynamically
      sections: finalSections.map(section => ({
        name: section.name,
        description: section.description || '',
        duration: section.duration ? parseInt(section.duration) : undefined,
        questions: section.questions.map(question => ({
          type: question.type || 'MCQ',
          question: question.question,
          code: question.code || '',
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || '',
          marks: parseFloat(question.marks || 1),
          negativeMarks: parseFloat(question.negativeMarks || 0),
          difficulty: question.difficulty || 'Medium',
          tags: question.tags || []        }))      })),
      questions: questions || [], // For backward compatibility
      // Calculate status based on dates
      createdBy: userId || (req.user ? req.user.id : null)
    };
      // If no creator ID was provided or found, log a warning but continue
    if (!examData.createdBy) {
      console.warn('Warning: Creating exam without createdBy field');
      // Check if we have a user in the request
      if (req.user && req.user.id) {
        examData.createdBy = req.user.id;
      } else {
        // Set a placeholder ID if needed
        examData.createdBy = new mongoose.Types.ObjectId('6457b8f000b91e0014c4399a');
      }
    }// Create exam in database
    const exam = await Exam.create(examData);    // First send back the successful response
    res.status(201).json({
      success: true,
      data: exam
    });
    
    // Then try to log activity, but don't let it affect the response
    try {
      if (req.user) {
        await ActivityLog.create({
          user: req.user.id,
          userType: 'TPO',
          activity: `Created a new exam: ${title}`,
          details: `Exam Type: ${type}, Status: ${status}`,
          action: 'create' // Add the required action field
        });
      }
    } catch (logError) {
      // Just log the error but don't let it affect the API response
      console.error('Error logging activity:', logError);
    }
  } catch (error) {
    console.error('Error creating exam:', error);
      // Check for validation errors from mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
      
    // Send error response first
    const errorResponse = {
      success: false,
      error: error.message || 'Failed to create exam'
    };
    
    // Try to log the error, but don't let it block the response
    try {
      await ErrorLog.create({
        message: 'Failed to create exam',
        stack: error.stack,
        user: req.user ? req.user.id : null,
        userType: 'TPO',
        endpoint: '/api/exams',
        action: 'create_error' // Add the required action field
      });
    } catch (logError) {
      console.error('Error logging to ErrorLog:', logError);
    }

    next(error);
  }
};

/**
 * @desc    Process uploaded questions file without an existing exam
 * @route   POST /api/exam/questions/upload
 * @access  Private (TPO only)
 */
exports.processQuestionsFile = async (req, res, next) => {
  try {
    if (!req.files || !req.files.questionsFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const file = req.files.questionsFile;
    
    // Log information about the uploaded file
    console.log('File upload details:', {
      name: file.name,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding
    });
    
    // Check file type
    if (
      !file.mimetype.includes('csv') && 
      !file.mimetype.includes('excel') && 
      !file.mimetype.includes('spreadsheetml')
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a CSV or Excel file'
      });
    }

    // Process file (parse CSV/Excel)
    let questions = [];
    
    if (file.mimetype.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
      // For CSV files - Using a more robust parsing approach
      const fileData = file.data.toString('utf8');
      console.log('CSV file content preview:', fileData.substring(0, 200) + '...');
      
      try {
        // Split by lines, handling various newline formats
        const rows = fileData.split(/\r?\n/);
        console.log(`CSV file has ${rows.length} rows`);
        
        if (rows.length <= 1) {
          return res.status(400).json({
            success: false,
            error: 'The CSV file appears to be empty or improperly formatted'
          });
        }
        
        // Get headers from first row, normalizing for case-insensitivity
        const headerRow = rows[0];
        console.log('Header row:', headerRow);
        
        // Enhanced CSV parsing for headers
        const headers = parseCSVLine(headerRow).map(h => h.toLowerCase().trim());
        console.log('Parsed headers:', headers);
        
        // Find required column indices
        const questionIndex = headers.indexOf('question');
        const option1Index = headers.indexOf('option1');
        const option2Index = headers.indexOf('option2');
        const option3Index = headers.indexOf('option3');
        const option4Index = headers.indexOf('option4');
        const correctOptionIndex = headers.indexOf('correctoption');
        const marksIndex = headers.indexOf('marks');
        
        if (questionIndex === -1) {
          return res.status(400).json({
            success: false,
            error: 'CSV file must contain a "question" column'
          });
        }
        
        if (option1Index === -1) {
          return res.status(400).json({
            success: false,
            error: 'CSV file must contain an "option1" column'
          });
        }
        
        if (correctOptionIndex === -1) {
          return res.status(400).json({
            success: false,
            error: 'CSV file must contain a "correctOption" column'
          });
        }
        
        // Process each data row
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const rowData = parseCSVLine(rows[i]);
          console.log(`Row ${i} data:`, rowData);
          
          if (rowData.length < Math.max(questionIndex, option1Index, correctOptionIndex) + 1) {
            console.warn(`Row ${i} has insufficient columns, skipping`);
            continue;
          }
          
          const questionText = rowData[questionIndex].trim();
          if (!questionText) {
            console.warn(`Row ${i} has empty question, skipping`);
            continue;
          }
          
          // Extract options, making sure we don't access beyond array bounds
          const options = [];
          for (const optionIdx of [option1Index, option2Index, option3Index, option4Index]) {
            if (optionIdx !== -1 && optionIdx < rowData.length) {
              const optionText = rowData[optionIdx].trim();
              if (optionText) {
                options.push(optionText);
              }
            }
          }
          
          if (options.length < 2) {
            console.warn(`Row ${i} has less than 2 options, skipping`);
            continue;
          }
          
          // Parse correct option (1-based in CSV)
          let correctOption;
          if (correctOptionIndex < rowData.length) {
            correctOption = parseInt(rowData[correctOptionIndex]) - 1;
            if (isNaN(correctOption) || correctOption < 0 || correctOption >= options.length) {
              console.warn(`Row ${i} has invalid correctOption, defaulting to first option`);
              correctOption = 0;
            }
          } else {
            console.warn(`Row ${i} missing correctOption, defaulting to first option`);
            correctOption = 0;
          }
          
          // Parse marks if available
          let marks = 1;
          if (marksIndex !== -1 && marksIndex < rowData.length) {
            const parsedMarks = parseFloat(rowData[marksIndex]);
            if (!isNaN(parsedMarks) && parsedMarks > 0) {
              marks = parsedMarks;
            }
          }
          
          questions.push({
            question: questionText,
            options: options,
            correctOption: correctOption,
            marks: marks
          });
        }
      } catch (err) {
        console.error('Error parsing CSV:', err);
        return res.status(400).json({
          success: false,
          error: 'Error parsing CSV file. Please check the format and try again.'
        });
      }
    } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      // Excel file processing with enhanced error handling
      try {
        console.log('Processing Excel file');
        const workbook = xlsx.read(file.data);
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Excel file or no sheets found'
          });
        }
        
        const sheetName = workbook.SheetNames[0];
        console.log('Reading from sheet:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          return res.status(400).json({
            success: false,
            error: 'Empty worksheet in Excel file'
          });
        }
        
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        console.log(`Excel data has ${jsonData.length} rows`);
        
        if (jsonData.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No data found in Excel file'
          });
        }
        
        // Check header existence in first row
        const firstRow = jsonData[0];
        const rowKeys = Object.keys(firstRow).map(k => k.toLowerCase());
        
        if (!rowKeys.some(k => k.includes('question'))) {
          return res.status(400).json({
            success: false,
            error: 'Excel file must contain a "question" column'
          });
        }
        
        if (!rowKeys.some(k => k.includes('option') && k.includes('1'))) {
          return res.status(400).json({
            success: false,
            error: 'Excel file must contain at least one option column (e.g., "option1")'
          });
        }
        
        if (!rowKeys.some(k => k.includes('correct'))) {
          return res.status(400).json({
            success: false,
            error: 'Excel file must contain a "correctOption" column'
          });
        }
        
        // Process each row
        questions = jsonData.map((row, index) => {
          // Find column names regardless of case
          const rowKeys = Object.keys(row);
          const questionKey = rowKeys.find(k => k.toLowerCase().includes('question'));
          const option1Key = rowKeys.find(k => /^option[_\s]?1$|^option1$/i.test(k));
          const option2Key = rowKeys.find(k => /^option[_\s]?2$|^option2$/i.test(k));
          const option3Key = rowKeys.find(k => /^option[_\s]?3$|^option3$/i.test(k));
          const option4Key = rowKeys.find(k => /^option[_\s]?4$|^option4$/i.test(k));
          const correctOptionKey = rowKeys.find(k => /^correct[_\s]?option$|^correctoption$/i.test(k));
          const marksKey = rowKeys.find(k => k.toLowerCase().includes('mark'));
          
          if (!questionKey || !row[questionKey] || !option1Key || !correctOptionKey) {
            console.warn(`Row ${index + 1} missing required fields, skipping`);
            return null;
          }
          
          // Extract values
          const questionText = String(row[questionKey]).trim();
          
          // Extract options, ensuring they're all valid strings
          const options = [];
          for (const key of [option1Key, option2Key, option3Key, option4Key]) {
            if (key && row[key]) {
              options.push(String(row[key]).trim());
            }
          }
          
          if (options.length < 2) {
            console.warn(`Row ${index + 1} has less than 2 options, skipping`);
            return null;
          }
          
          // Handle correctOption (1-based in Excel)
          let correctOption;
          if (correctOptionKey && row[correctOptionKey] !== undefined) {
            correctOption = parseInt(row[correctOptionKey]) - 1;
            if (isNaN(correctOption) || correctOption < 0 || correctOption >= options.length) {
              correctOption = 0;
            }
          } else {
            correctOption = 0;
          }
          
          // Handle marks
          let marks = 1;
          if (marksKey && row[marksKey] !== undefined) {
            const parsedMarks = parseFloat(row[marksKey]);
            if (!isNaN(parsedMarks) && parsedMarks > 0) {
              marks = parsedMarks;
            }
          }
          
          return {
            question: questionText,
            options: options,
            correctOption: correctOption,
            marks: marks
          };
        }).filter(Boolean); // Remove null entries
      } catch (err) {
        console.error('Error parsing Excel:', err);
        return res.status(400).json({
          success: false,
          error: `Error parsing Excel file: ${err.message}`
        });
      }
    }

    console.log(`Total valid questions processed: ${questions.length}`);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid questions could be extracted from the file. Please check the format.'
      });
    }

    // Log first few questions for debugging
    console.log('Sample questions:', questions.slice(0, 3));

    // Log activity
    await ActivityLog.create({user: req.user ? req.user.id : 'anonymous',
      userType: req.user ? req.user.role : 'Anonymous',
      activity: `Processed ${questions.length} questions from uploaded file`,
      details: `File: ${file.name}`,
      action: 'processed'});

    res.status(200).json({
      success: true,
      questions: questions,
      message: `Successfully processed ${questions.length} questions`
    });
  } catch (error) {
    console.error('Error processing questions file:', error);
    
    // Log the error
    await ErrorLog.create({message: 'Failed to process questions file',
      stack: error.stack,
      user: req.user ? req.user.id : null,
      userType: req.user ? req.user.role : 'Unknown',
      endpoint: `/api/exam/questions/upload`,
      action: 'error'});

    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing the file. Please try again or use a different file format.'
    });
  }
};

/**
 * Helper function to parse CSV lines with proper handling of quotes and commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // If we see a quote immediately after another quote and we're in quotes, it's an escaped quote
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Otherwise, toggle the inQuotes flag
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // If we see a comma and we're not in quotes, end the current field
      result.push(current);
      current = '';
    } else {
      // Otherwise, add the character to the current field
      current += char;
    }
  }
  
  // Don't forget to add the last field
  result.push(current);
  
  return result;
}

/**
 * @desc    Upload questions file for an exam
 * @route   POST /api/exams/:id/questions-file
 * @access  Private (TPO only)
 */
exports.uploadQuestionsFile = async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const file = req.files.file;
    const examId = req.params.id;
    
    // Check if the exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Make sure the directory exists
    const uploadDir = path.join(__dirname, '../Uploads/exams');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a unique filename
    const fileName = `exam_${examId}_${Date.now()}${path.extname(file.name)}`;
    const filePath = path.join(uploadDir, fileName);

    // Move the file
    file.mv(filePath, async (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({
          success: false,
          error: 'Problem with file upload'
        });
      }

      // Update the exam with the file info
      exam.questionsFile = {
        originalName: file.name,
        filePath: `Uploads/exams/${fileName}`,
        uploadedAt: new Date()
      };

      await exam.save();

      res.status(200).json({
        success: true,
        data: exam.questionsFile,
        message: 'Questions file uploaded successfully'
      });
    });
  } catch (error) {
    console.error('Error uploading questions file:', error);
    
    // Log the error
    await ErrorLog.create({message: 'Failed to upload questions file',
      stack: error.stack,
      user: req.user ? req.user.id : null,
      userType: 'TPO',
      endpoint: `/api/exams/${req.params.id}/questions-file`,
      action: 'error'});

    next(error);
  }
};

/**
 * @desc    Add CSV/Excel questions to an existing exam
 * @route   POST /api/exams/:id/questions/upload
 * @access  Private (TPO only)
 */
exports.uploadExamQuestions = async (req, res, next) => {
  try {
    if (!req.files || !req.files.questionsFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const file = req.files.questionsFile;
    const examId = req.params.id;
    const sectionName = req.body.sectionName || 'Default Section';
    
    // Check file type
    if (
      !file.mimetype.includes('csv') && 
      !file.mimetype.includes('excel') && 
      !file.mimetype.includes('spreadsheetml')
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a CSV or Excel file'
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Process the uploaded file - CSV or Excel
    let questions = [];
    
    if (file.mimetype.includes('csv')) {
      // For CSV files - Similar to processQuestionsFile but adapted to section schema
      const fileData = file.data.toString('utf8');
      const rows = fileData.split('\n');
      
      // Get headers
      const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
      const typeIndex = headers.indexOf('type');
      const questionIndex = headers.indexOf('question');
      const optionsIndex = headers.indexOf('options');
      const correctAnswerIndex = headers.indexOf('correctanswer');
      const marksIndex = headers.indexOf('marks');
      const negativeMarksIndex = headers.indexOf('negativemarks');
      const difficultyIndex = headers.indexOf('difficulty');
      const explanationIndex = headers.indexOf('explanation');
      
      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const columns = rows[i].split(',').map(col => col.trim());
        
        if (columns.length >= 3) { // Minimum: question, options, correctAnswer
          const type = typeIndex >= 0 ? columns[typeIndex] || 'MCQ' : 'MCQ';
          const question = columns[questionIndex];
          
          // Handle options - either as separate columns or as a pipe-separated string
          let options = [];
          if (optionsIndex >= 0 && columns[optionsIndex]) {
            options = columns[optionsIndex].split('|').map(opt => opt.trim());
          } else {
            // Look for option1, option2, etc.
            for (let j = 0; j < 10; j++) {
              const optionColIndex = headers.indexOf(`option${j+1}`);
              if (optionColIndex >= 0 && columns[optionColIndex]) {
                options.push(columns[optionColIndex]);
              }
            }
          }
          
          const correctAnswer = columns[correctAnswerIndex];
          const marks = marksIndex >= 0 ? parseFloat(columns[marksIndex]) || 1 : 1;
          const negativeMarks = negativeMarksIndex >= 0 ? parseFloat(columns[negativeMarksIndex]) || 0 : 0;
          const difficulty = difficultyIndex >= 0 ? columns[difficultyIndex] || 'Medium' : 'Medium';
          const explanation = explanationIndex >= 0 ? columns[explanationIndex] || '' : '';
          
          questions.push({
            type,
            question,
            options,
            correctAnswer,
            marks,
            negativeMarks,
            difficulty,
            explanation
          });
        }
      }
    } else {
      // For Excel files
      const workbook = xlsx.read(file.data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      questions = jsonData.map(row => {
        // Find column names regardless of case
        const rowKeys = Object.keys(row);
        const typeKey = rowKeys.find(k => k.toLowerCase() === 'type');
        const questionKey = rowKeys.find(k => k.toLowerCase() === 'question');
        const optionsKey = rowKeys.find(k => k.toLowerCase() === 'options');
        const correctAnswerKey = rowKeys.find(k => k.toLowerCase() === 'correctanswer');
        const marksKey = rowKeys.find(k => k.toLowerCase() === 'marks');
        const negativeMarksKey = rowKeys.find(k => k.toLowerCase() === 'negativemarks');
        const difficultyKey = rowKeys.find(k => k.toLowerCase() === 'difficulty');
        const explanationKey = rowKeys.find(k => k.toLowerCase() === 'explanation');
        
        // Get option columns (option1, option2, etc.)
        const optionKeys = [];
        for (let i = 1; i <= 10; i++) {
          const key = rowKeys.find(k => k.toLowerCase() === `option${i}`);
          if (key) optionKeys.push(key);
        }
        
        // Extract options from either the options column or individual option columns
        let options = [];
        if (optionsKey && row[optionsKey]) {
          options = row[optionsKey].split('|').map(opt => opt.trim());
        } else if (optionKeys.length > 0) {
          options = optionKeys.map(key => row[key]).filter(Boolean);
        }
        
        return {
          type: typeKey ? (row[typeKey] || 'MCQ') : 'MCQ',
          question: questionKey ? row[questionKey] : '',
          options: options,
          correctAnswer: correctAnswerKey ? row[correctAnswerKey] : '',
          marks: marksKey ? parseFloat(row[marksKey]) || 1 : 1,
          negativeMarks: negativeMarksKey ? parseFloat(row[negativeMarksKey]) || 0 : 0,
          difficulty: difficultyKey ? (row[difficultyKey] || 'Medium') : 'Medium',
          explanation: explanationKey ? (row[explanationKey] || '') : ''
        };
      });
    }

    // Filter out invalid questions
    questions = questions.filter(q => q.question && q.options.length > 0 && q.correctAnswer);
    
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid questions found in the file'
      });
    }

    // Find the section or create a new one
    let section = exam.sections.find(s => s.name === sectionName);
    if (!section) {
      exam.sections.push({
        name: sectionName,
        description: `Questions uploaded from ${file.name}`,
        questions: []
      });
      section = exam.sections[exam.sections.length - 1];
    }

    // Add questions to the section
    section.questions.push(...questions);

    // Update total marks if not already set
    if (!exam.totalMarks || exam.totalMarks === 0) {
      exam.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    } else {
      exam.totalMarks += questions.reduce((sum, q) => sum + q.marks, 0);
    }
    
    // Set passing marks based on percentage if not already set
    if (!exam.passingMarks || exam.passingMarks === 0) {
      exam.passingMarks = Math.round((exam.passingPercentage / 100) * exam.totalMarks);
    }

    // Save the exam
    await exam.save();

    // Log activity
    await ActivityLog.create({user: req.user.id,
      userType: 'TPO',
      activity: `Uploaded ${questions.length} questions for exam: ${exam.title}`,
      details: `Section: ${sectionName}, File: ${file.name}`,
      action: 'uploaded___questions'});

    res.status(200).json({
      success: true,
      data: {
        questionsAdded: questions.length,
        section: sectionName,
        totalQuestions: section.questions.length,
        totalMarks: exam.totalMarks
      }
    });
  } catch (error) {
    console.error('Error uploading questions:', error);
    
    // Log the error
    await ErrorLog.create({message: 'Failed to upload questions file',
      stack: error.stack,
      user: req.user ? req.user.id : null,
      userType: 'TPO',
      endpoint: `/api/exams/${req.params.id}/questions/upload`,
      action: 'error'});

    next(error);
  }
};

/**
 * @desc    Add a section to an exam
 * @route   POST /api/exams/:id/sections
 * @access  Private (TPO only)
 */
exports.addExamSection = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const { name, description, duration } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a section name'
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Check if section with the same name already exists
    if (exam.sections.some(s => s.name === name)) {
      return res.status(400).json({
        success: false,
        error: 'A section with this name already exists'
      });
    }

    // Add the section
    exam.sections.push({
      name,
      description: description || '',
      duration: duration ? parseInt(duration) : undefined,
      questions: []
    });

    await exam.save();

    // Log activity
    await ActivityLog.create({user: req.user.id,
      userType: 'TPO',
      activity: `Added section "${name}" to exam: ${exam.title}`,
      details: `Section duration: ${duration || 'Not specified'}`,
      action: 'added_section____nam'});

    res.status(201).json({
      success: true,
      data: exam.sections[exam.sections.length - 1]
    });
  } catch (error) {
    console.error('Error adding section:', error);
    
    // Log the error
    await ErrorLog.create({message: 'Failed to add section to exam',
      stack: error.stack,
      user: req.user ? req.user.id : null,
      userType: 'TPO',
      endpoint: `/api/exams/${req.params.id}/sections`,
      action: 'error'});

    next(error);
  }
};

/**
 * @desc    Add a question to an exam section
 * @route   POST /api/exams/:id/sections/:sectionId/questions
 * @access  Private (TPO only)
 */
exports.addQuestionToSection = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const sectionId = req.params.sectionId;
    const {
      type = 'MCQ',
      question,
      code,
      options,
      correctAnswer,
      explanation,
      marks = 1,
      negativeMarks = 0,
      difficulty = 'Medium',
      tags = []
    } = req.body;

    // Validate required fields
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Please provide question text'
      });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least two options'
      });
    }

    if (!correctAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Please provide the correct answer'
      });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Find the section
    const section = exam.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    // Add the question to the section
    const newQuestion = {
      type,
      question,
      code: code || '',
      options,
      correctAnswer,
      explanation: explanation || '',
      marks: parseFloat(marks),
      negativeMarks: parseFloat(negativeMarks),
      difficulty,
      tags: Array.isArray(tags) ? tags : []
    };
    
    section.questions.push(newQuestion);

    // Update total marks
    exam.totalMarks = (exam.totalMarks || 0) + parseFloat(marks);
    
    // Update passing marks based on percentage
    if (exam.passingPercentage) {
      exam.passingMarks = Math.round((exam.passingPercentage / 100) * exam.totalMarks);
    }

    await exam.save();

    // Log activity
    await ActivityLog.create({user: req.user.id,
      userType: 'TPO',
      activity: `Added question to section "${section.name}" in exam: ${exam.title}`,
      details: `Question type: ${type}, Marks: ${marks}`,
      action: 'added_question_to_se'});

    res.status(201).json({
      success: true,
      data: section.questions[section.questions.length - 1]
    });
  } catch (error) {
    console.error('Error adding question:', error);
    
    // Log the error
    await ErrorLog.create({message: 'Failed to add question to exam section',
      stack: error.stack,
      user: req.user ? req.user.id : null,
      userType: 'TPO',
      endpoint: `/api/exams/${req.params.id}/sections/${req.params.sectionId}/questions`,
      action: 'error'});

    next(error);
  }
};

/**
 * @desc    Set an exam to Active status
 * @route   PUT /api/exams/:id/activate
 * @access  Private (TPO only)
 */
exports.activateExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }
    
    // Ensure startDate and endDate are properly set
    const now = new Date();
    
    // If no startDate is set, set it to now
    if (!exam.startDate) {
      exam.startDate = now;
    }
    
    // If no endDate is set, set it to a default period (1 day later)
    if (!exam.endDate) {
      // Set end date to 24 hours from now if not specified
      const endDate = new Date(now);
      endDate.setHours(endDate.getHours() + 24);
      exam.endDate = endDate;
    }
    
    // Change status to Active
    exam.status = 'Active';
    await exam.save();
    
    // Log the activity
    await ActivityLog.create({
      user: req.user.id,
      userModel: req.user.role,
      activity: 'activateExam',
      details: `Activated exam: ${exam.title} from ${exam.startDate.toISOString()} to ${exam.endDate.toISOString()}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'Exam activated successfully',
      data: exam
    });
  } catch (error) {
    console.error('Error activating exam:', error);
    await ErrorLog.create({
      error: error.message,
      stack: error.stack,
      user: req.user ? req.user.id : null,
      userModel: req.user ? req.user.role : null,
      path: req.originalUrl,
      method: req.method
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to activate exam',
      error: error.message
    });
  }
};

// @desc    Get all exams (with filtering options)
// @route   GET /api/exams
// @access  Private
exports.getExams = async (req, res, next) => {
  try {
    let query = {};
    
    // Allow filtering by status, type, date range
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Date range for scheduled exams
    if (req.query.startDate && req.query.endDate) {
      query.scheduledFor = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // For students, only show published/active exams they're eligible for
    if (req.user.role === 'student') {
      query.status = { $in: ['Published', 'Active'] };
      
      // Check student department against eligibility
      const studentDept = req.user.department;
      query.$or = [
        { 'eligibility.departments': { $exists: false } },
        { 'eligibility.departments': { $size: 0 } },
        { 'eligibility.departments': studentDept }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const exams = await Exam.find(query)
      .select('-sections.questions.correctAnswer') // Don't send answers
      .sort({ scheduledFor: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Exam.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: exams.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: exams
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    next(error);
  }
};

// @desc    Get single exam details
// @route   GET /api/exams/:id
// @access  Private
exports.getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // For students, check if eligible and don't return answers
    if (req.user.role === 'student') {
      // Check if exam is published/active
      if (!['Published', 'Active'].includes(exam.status)) {
        return res.status(403).json({
          success: false,
          error: 'This exam is not available for students'
        });
      }
      
      // Check eligibility
      if (
        exam.eligibility && 
        exam.eligibility.departments && 
        exam.eligibility.departments.length > 0 &&
        !exam.eligibility.departments.includes(req.user.department)
      ) {
        return res.status(403).json({
          success: false,
          error: 'You are not eligible for this exam'
        });
      }
      
      // Remove correct answers
      const examData = exam.toObject();
      examData.sections.forEach(section => {
        section.questions.forEach(question => {
          delete question.correctAnswer;
          delete question.explanation;
        });
      });
      
      return res.status(200).json({
        success: true,
        data: examData
      });
    }
    
    // For TPO and admin, return full details
    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Error fetching exam details:', error);
    next(error);
  }
};

// @desc    Update exam status
// @route   PUT /api/exams/:id/status
// @access  Private (TPO only)
exports.updateExamStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Draft', 'Published', 'Active', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status'
      });
    }
    
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // Add status transition validation if needed
    if (status === 'Published' && exam.sections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot publish an exam with no sections or questions'
      });
    }
    
    // Update status and save
    exam.status = status;
    await exam.save();
    
    // Log activity
    await ActivityLog.create({user: req.user.id,
      userType: 'TPO',
      activity: `Updated exam status: ${exam.title}`,
      details: `Status changed to: ${status}`,
      action: 'updated'});
    
    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Error updating exam status:', error);
    next(error);
  }
};

// @desc    Register a student for an exam
// @route   POST /api/exams/:id/register
// @access  Private (Student)
exports.registerForExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    
    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // Check if exam is open for registration
    if (exam.status !== 'Published') {
      return res.status(400).json({
        success: false,
        error: 'Exam is not open for registration'
      });
    }
    
    // Check registration deadline
    if (exam.registrationDeadline && new Date() > new Date(exam.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        error: 'Registration deadline has passed'
      });
    }
    
    // Check eligibility
    if (
      exam.eligibility && 
      exam.eligibility.departments && 
      exam.eligibility.departments.length > 0 &&
      !exam.eligibility.departments.includes(req.user.department)
    ) {
      return res.status(403).json({
        success: false,
        error: 'You are not eligible for this exam'
      });
    }
    
    // Check if already registered
    if (exam.registeredStudents.includes(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'You are already registered for this exam'
      });
    }
    
    // Register student
    exam.registeredStudents.push(studentId);
    await exam.save();
    
    // Log registration
    await ActivityLog.create({user: studentId,
      userType: 'Student',
      activity: `Registered for exam: ${exam.title}`,
      details: `Exam ID: ${examId}`,
      action: 'registered_for_exam_'});
    
    res.status(200).json({
      success: true,
      message: 'Successfully registered for the exam',
      examDate: exam.scheduledFor
    });
  } catch (error) {
    console.error('Error registering for exam:', error);
    next(error);
  }
};

// @desc    Start an exam for a student
// @route   POST /api/exams/:id/start
// @access  Private (Student)
exports.startExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    
    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // Check if exam is active based on dates or status
    const now = new Date();
    let isActive = false;
    
    if (exam.startDate && exam.endDate) {
      isActive = now >= new Date(exam.startDate) && now <= new Date(exam.endDate);
    } else {
      isActive = exam.status === 'Active' || exam.status === 'Ongoing';
    }
    
    if (!isActive) {
      return res.status(400).json({
        success: false,
        error: 'Exam is not currently active'
      });
    }
    
    // Check if student is registered
    if (!exam.registeredStudents.includes(studentId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not registered for this exam'
      });
    }
      // Check if student has already started/completed the exam
    const existingLog = await ExamLog.findOne({
      exam: examId,
      student: studentId,
      status: { $in: ['In-Progress', 'Completed'] }
    });
    
    if (existingLog && existingLog.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'You have already completed this exam'
      });
    }
    
    let examLog;
    
    if (existingLog && existingLog.status === 'In-Progress') {
      // Check if existing attempt is still valid (time not expired)
      const startTime = new Date(existingLog.startTime);
      const durationMs = exam.duration * 60 * 1000; // convert minutes to milliseconds
      const endTime = new Date(startTime.getTime() + durationMs);
      
      if (new Date() > endTime) {
        // Previous attempt expired, automatically mark as completed
        existingLog.status = 'Completed';
        existingLog.endTime = endTime;
        await existingLog.save();
        
        // Create a new attempt if the exam allows multiple attempts
        if (!exam.settings || !exam.settings.allowMultipleAttempts) {
          return res.status(400).json({
            success: false,
            error: 'Your previous attempt has expired and multiple attempts are not allowed'
          });
        }
          // Create new attempt
        examLog = new ExamLog({
          exam: examId,
          student: studentId,
          action: 'start',
          startTime: new Date(),
          status: 'In-Progress',
          responses: []
        });
      } else {
        // Continue existing attempt
        examLog = existingLog;
        // Calculate remaining time
        const remainingTimeMs = endTime - new Date();
        const remainingTimeMinutes = Math.ceil(remainingTimeMs / (60 * 1000));
        
        return res.status(200).json({
          success: true,
          message: 'Continuing exam',
          examData: {
            _id: exam._id,
            title: exam.title,
            duration: exam.duration,
            remainingTime: remainingTimeMinutes,
            sections: exam.sections.map(section => ({
              ...section.toObject(),
              questions: section.questions.map(q => ({
                ...q,
                correctAnswer: undefined,
                explanation: undefined
              }))
            })),
            responses: examLog.responses
          }
        });
      }
    } else {    // Create new exam log
      examLog = new ExamLog({
        exam: examId,
        student: studentId,
        action: 'start',
        startTime: new Date(),
        status: 'In-Progress',
        responses: []
      });
    }
    
    await examLog.save();
    
    // Log activity
    await ActivityLog.create({user: studentId,
      userType: 'Student',
      activity: `Started exam: ${exam.title}`,
      details: `Exam ID: ${examId}`,
      action: 'started'});
    
    // Return exam data without answers
    res.status(200).json({
      success: true,
      message: 'Exam started successfully',
      examData: {
        _id: exam._id,
        title: exam.title,
        duration: exam.duration,
        sections: exam.sections.map(section => ({
          ...section.toObject(),
          questions: section.questions.map(q => ({
            ...q,
            correctAnswer: undefined,
            explanation: undefined
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    next(error);
  }
};

// @desc    Submit exam answers
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
exports.submitExam = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    
    // The frontend sends 'answers', but we're expecting 'responses'
    // Handle both formats
    const responses = req.body.responses || req.body.answers || [];
    
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response format. Please provide an array of responses'
      });
    }
    
    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
      // Find the exam log
    const examLog = await ExamLog.findOne({
      exam: examId,
      student: studentId,
      status: 'In-Progress'
    });
    
    if (!examLog) {
      return res.status(400).json({
        success: false,
        error: 'No active exam session found'
      });
    }
    
    // Check if time expired
    const startTime = new Date(examLog.startTime);
    const durationMs = exam.duration * 60 * 1000;
    const endTime = new Date(startTime.getTime() + durationMs);
    
    if (new Date() > endTime) {
      return res.status(400).json({
        success: false,
        error: 'Exam time has expired'
      });
    }
    
    // Process responses and calculate score
    let totalScore = 0;
    let maxScore = 0;
      // Flat map of all questions indexed by question ID
    const questionsMap = {};
    exam.sections.forEach(section => {
      section.questions.forEach(question => {
        questionsMap[question._id.toString()] = {
          question,
          sectionName: section.name
        };
        
        // Log the first question's full structure to help debugging
        if (Object.keys(questionsMap).length === 1) {
          console.log('DEBUG - First question structure:');
          console.log(JSON.stringify({
            id: question._id,
            type: question.type,
            correctAnswer: question.correctAnswer || question.correctOption,
            options: question.options
          }, null, 2));
        }
      });
    });
    
    // Calculate score
    const scoredResponses = responses.map(response => {
      const { questionId, answer } = response;
      const questionData = questionsMap[questionId];
      
      if (!questionData) {
        return { ...response, score: 0, maxScore: 0, correct: false };
      }
        const { question } = questionData;
      // Use points, marks, or default to 1 for maxPossibleScore
      const maxPossibleScore = question.points || question.marks || 1;
      maxScore += maxPossibleScore;
      
      let score = 0;
      let isCorrect = false;
      
      // Handle different property names for correct answer (correctAnswer or correctOption)
      const correctAns = question.correctAnswer || question.correctOption;
      
      // Add debug logging
      console.log(`Processing question: ${question._id}`);
      console.log(`Question type: ${question.type}, Student answer: ${answer}, Correct answer: ${correctAns}`);
        // Check if answer is correct
      if (question.type === 'MCQ' || question.type === 'TrueFalse') {
        // Get the options array to check if answer is an index
        const options = question.options || [];
        
        // Convert both to strings for comparison and try different matching strategies
        const studentAnswer = String(answer).trim();
        const correctAnswer = String(correctAns).trim();
        
        // Strategy 1: Direct comparison
        let isCorrect = studentAnswer === correctAnswer;
        
        // Strategy 2: Index-based comparison (student sent option index)
        if (!isCorrect && !isNaN(studentAnswer) && options.length > 0) {
          const index = parseInt(studentAnswer);
          if (index >= 0 && index < options.length && options[index] === correctAnswer) {
            isCorrect = true;
            console.log(`MCQ index match: options[${index}] = "${options[index]}" matches "${correctAnswer}"`);
          }
        }
        
        // Strategy 3: Value in options array (student sent the actual value)
        if (!isCorrect && options.indexOf(studentAnswer) !== -1 && 
            options.indexOf(studentAnswer) === options.indexOf(correctAnswer)) {
          isCorrect = true;
        }
        
        score = isCorrect ? maxPossibleScore : 0;
        console.log(`MCQ check: ${answer} vs ${correctAns} => ${isCorrect}, Score: ${score}`);      } else if (question.type === 'MultipleSelect') {
        // Get answers in a consistent format
        const correctAnswers = Array.isArray(correctAns) 
          ? correctAns.map(String) 
          : String(correctAns).split(',').map(a => a.trim());
        
        // Handle various student answer formats
        let studentAnswers = [];
        if (Array.isArray(answer)) {
          studentAnswers = answer.map(String);
        } else if (answer && typeof answer === 'string') {
          studentAnswers = answer.split(',').map(a => a.trim());
        } else if (answer && typeof answer === 'object') {
          // Handle case where answer might be an object with selected indices
          studentAnswers = Object.keys(answer)
            .filter(key => answer[key] === true)
            .map(String);
        }
        
        // Handle index-based answers (if student sent indices instead of values)
        const options = question.options || [];
        if (options.length > 0 && studentAnswers.every(ans => !isNaN(ans))) {
          console.log('Converting index-based answers to values');
          studentAnswers = studentAnswers
            .map(idx => parseInt(idx))
            .filter(idx => idx >= 0 && idx < options.length)
            .map(idx => options[idx]);
        }
        
        // Compare arrays - for perfect match
        const correctCount = studentAnswers.filter(a => correctAnswers.includes(a)).length;
        const incorrectCount = studentAnswers.length - correctCount;
        
        console.log(`MultipleSelect: Student answers: [${studentAnswers}], Correct answers: [${correctAnswers}]`);
        console.log(`Correct selections: ${correctCount}/${correctAnswers.length}, Incorrect selections: ${incorrectCount}`);
        
        if (correctCount === correctAnswers.length && incorrectCount === 0) {
          // All correct answers selected with no extras
          score = maxPossibleScore;
          isCorrect = true;
        } else {
          // Partial credit
          const partialScore = (correctCount / correctAnswers.length) * maxPossibleScore;
          // Penalty for incorrect selections
          const penalty = (incorrectCount / correctAnswers.length) * maxPossibleScore * 0.5;
          score = Math.max(0, partialScore - penalty);
          isCorrect = false;
        }
        console.log(`MultipleSelect score: ${score} out of ${maxPossibleScore}`);
      } else if (question.type === 'ShortAnswer') {
        // Simple exact match for short answer
        const correctAnswer = correctAns.toLowerCase().trim();
        const studentAnswer = answer.toLowerCase().trim();
        isCorrect = studentAnswer === correctAnswer;
        score = isCorrect ? maxPossibleScore : 0;
        console.log(`ShortAnswer: '${studentAnswer}' vs '${correctAnswer}' => ${isCorrect}, Score: ${score}`);
      }
        totalScore += score;
      console.log(`Question ${questionData ? questionData.sectionName : 'unknown'} - ${question._id}: Score ${score}/${maxPossibleScore}, Running total: ${totalScore}`);
      
      return {
        ...response,
        score,
        maxScore: maxPossibleScore,
        correct: isCorrect
      };
    });
      
    // Log final score calculation
    console.log(`=== Final Score Calculation ===`);
    console.log(`Total score: ${totalScore}`);
    console.log(`Max score: ${maxScore}`);
    console.log(`Percentage: ${(totalScore / maxScore) * 100}%`);
    
    // Update exam log
    examLog.responses = scoredResponses;
    examLog.score = totalScore;
    examLog.maxScore = maxScore;
    examLog.status = 'Completed';
    examLog.endTime = new Date();
    examLog.percentageScore = (totalScore / maxScore) * 100;
      await examLog.save();
      // Save detailed exam result to ExamResult collection    // Ensure we have a valid startTime for the exam result
    const validStartTime = examLog.startTime || new Date(Date.now() - (exam.duration * 60 * 1000));
      // Calculate percentage score correctly with a fallback to avoid division by zero
    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    // Make sure we use the same percentage calculation for both records
    examLog.percentageScore = percentageScore;
    await examLog.save();

    console.log(`Creating ExamResult with score: ${totalScore}/${maxScore} (${percentageScore}%)`);
      // Debug response content
    if (responses.length > 0) {
      const firstResponse = responses[0];
      console.log('Sample student response format:', {
        questionId: firstResponse.questionId,
        answer: firstResponse.answer,
        type: typeof firstResponse.answer
      });
    }
    
    const examResult = new ExamResult({
      exam: examId,
      student: studentId,
      score: totalScore,
      maxScore: maxScore,
      percentageScore: percentageScore,  // Use the calculated percentage directly
      responses: scoredResponses,
      startTime: validStartTime, // Use the guaranteed start time
      endTime: examLog.endTime || new Date(),
      duration: exam.duration,
      status: 'Completed'
    });
    
    await examResult.save();
    
    // Log activity
    await ActivityLog.create({user: studentId,
      userType: 'Student',
      activity: `Submitted exam: ${exam.title}`,
      details: `Score: ${totalScore}/${maxScore} (${examLog.percentageScore.toFixed(2)}%)`,
      action: 'submitted'});
      // Calculate if the student passed the exam based on the passing percentage
    const passingPercentage = exam.passingPercentage || 0;
    const passed = examLog.percentageScore >= passingPercentage;
      res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      result: {
        score: totalScore,
        maxScore,
        percentage: examLog.percentageScore.toFixed(2),
        passed: passed,
        passingPercentage: passingPercentage,
        exam: {
          _id: exam._id,
          title: exam.title,
          passingPercentage: exam.passingPercentage || 0
        }
      }
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    next(error);
  }
};

// @desc    Get student's exam results
// @route   GET /api/exams/:id/result
// @access  Private (Student)
exports.getExamResult = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    
    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }
    
    // Find the exam result from ExamResult collection
    const examResult = await ExamResult.findOne({
      exam: examId,
      student: studentId,
      status: 'Completed'
    }).sort({ endTime: -1 }); // Get the most recent completion
    
    if (!examResult) {
      // Fall back to checking the exam log as a secondary option
      const examLog = await ExamLog.findOne({
        exam: examId,
        student: studentId,
        status: 'Completed'
      }).sort({ endTime: -1 });
      
      if (!examLog) {
        return res.status(404).json({
          success: false,
          error: 'No completed exam result found'
        });
      }
    }
      // Get questions for reference
    const questionsMap = {};
    exam.sections.forEach(section => {
      section.questions.forEach(question => {
        questionsMap[question._id.toString()] = {
          ...question.toObject(),
          sectionName: section.name
        };
      });
    });
    
    // Process the result from either examResult or examLog
    const responseData = examResult ? examResult.responses : examLog.responses;
    const startTime = examResult ? examResult.startTime : examLog.startTime;
    const endTime = examResult ? examResult.endTime : examLog.endTime;
    const score = examResult ? examResult.score : examLog.score;
    const maxScore = examResult ? examResult.maxScore : examLog.maxScore; 
    const percentageScore = examResult ? examResult.percentageScore : examLog.percentageScore;
    
    // Enhanced result with question details
    const enhancedResponses = responseData.map(response => {
      const questionData = questionsMap[response.questionId];
      return {
        ...response,
        question: questionData ? {
          text: questionData.question || questionData.text, // Handle different property names
          type: questionData.type,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation,
          sectionName: questionData.sectionName
        } : null
      };
    });
    
    // Group responses by section
    const sectionResults = {};
    enhancedResponses.forEach(response => {
      if (response.question && response.question.sectionName) {
        const sectionName = response.question.sectionName;
        if (!sectionResults[sectionName]) {
          sectionResults[sectionName] = {
            name: sectionName,
            score: 0,
            maxScore: 0,
            responses: []
          };
        }
        
        sectionResults[sectionName].score += response.score;
        sectionResults[sectionName].maxScore += response.maxScore;
        sectionResults[sectionName].responses.push(response);
      }
    });      // Determine if the student passed based on the exam's passing percentage
      const passingPercentage = exam.passingPercentage || 0;
      const passed = percentageScore >= passingPercentage;
      
      res.status(200).json({
        success: true,
        result: {
          exam: {
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            type: exam.type,
            passingPercentage: passingPercentage
          },
          studentId,
          startTime: startTime,
          endTime: endTime,
          duration: Math.round((new Date(endTime) - new Date(startTime)) / (60 * 1000)),
          score: score,
          maxScore: maxScore,
          percentageScore: percentageScore,
          percentage: percentageScore.toFixed(2), // Add consistent field name for frontend
          passed: passed, // Add passed field
          sections: Object.values(sectionResults),
          responses: enhancedResponses,
          // Indicate which data source we used
          source: examResult ? 'ExamResult' : 'ExamLog'
        }
    });
  } catch (error) {
    console.error('Error fetching exam result:', error);
    next(error);
  }
};