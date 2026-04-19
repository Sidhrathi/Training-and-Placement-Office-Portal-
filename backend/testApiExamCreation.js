/**
 * API test script for exam creation
 * This tests the HTTP API, not just the database
 */
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Test exam data - formatted exactly like the frontend would send it
const testExam = {
  title: "API Test Exam",
  description: "Test exam for API debugging",
  type: "Aptitude",
  duration: 60,
  totalMarks: 100,
  passingMarks: 40,
  passingPercentage: 40,
  scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  registrationDeadline: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
  startDate: new Date(Date.now() + 86400000).toISOString(),
  endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
  eligibility: {
    departments: ["Computer Science"],
    branches: ["Computer Science"],
    semesters: ["1", "2"],
  },
  instructions: "Test instructions",
  sections: [
    {
      name: "Main Section",
      description: "Test section",
      questions: [
        {
          type: "MCQ",
          question: "What is 2+2?",
          options: ["3", "4", "5", "6"],
          correctOption: 1,
          correctAnswer: "4",
          marks: 1,
        }
      ]
    }
  ],
  status: "Draft"
};

// Function to test the exam creation API
async function testExamCreation() {
  try {
    console.log('Starting API test for exam creation...');
    
    // Replace with your actual TPO credentials
    const loginResponse = await axios.post('http://localhost:5000/api/tpo/login', {
      email: 'tpo@example.com', // Change this to a valid TPO account
      password: 'password123'    // Change this to a valid password
    });
    
    if (!loginResponse.data.token) {
      throw new Error('Login failed - no token received');
    }
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now try to create an exam with the token
    const examResponse = await axios.post(
      'http://localhost:5000/api/exams',
      testExam,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Exam creation response status:', examResponse.status);
    console.log('Exam created successfully!', examResponse.data);
  } catch (error) {
    console.error('Error in test:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testExamCreation();
