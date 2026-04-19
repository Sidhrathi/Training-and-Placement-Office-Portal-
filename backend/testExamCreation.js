/**
 * Test script to directly create an exam in MongoDB
 * Run this with: node testExamCreation.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import Exam model
const Exam = require('./models/Exam');

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect('mongodb://localhost:27017/TrainingAndPlacement', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('Connected to MongoDB');

    try {
      // Create a simple test exam
      console.log('Creating test exam...');
      
      const testExam = {
        title: `Direct Test Exam ${new Date().toISOString()}`,
        description: 'Test exam created via direct MongoDB script',
        type: 'Aptitude',
        duration: 60,
        totalMarks: 10,
        passingMarks: 6,
        passingPercentage: 60,
        scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
        registrationDeadline: new Date(),
        sections: [
          {
            name: 'Default Section',
            description: 'Auto-generated section with test questions',
            questions: [
              {
                type: 'MCQ',
                question: 'What is 1+1?',
                options: ['1', '2', '3', '4'],
                correctAnswer: '2',
                marks: 1
              },
              {
                type: 'MCQ',
                question: 'What is the capital of France?',
                options: ['London', 'Paris', 'Berlin', 'Madrid'],
                correctAnswer: 'Paris',
                marks: 1
              }
            ]
          }
        ],
        createdBy: new mongoose.Types.ObjectId('6457b8f000b91e0014c4399a') // Use a placeholder ObjectId
      };

      // Save directly to database
      const exam = new Exam(testExam);
      const savedExam = await exam.save();
      console.log('Test exam created successfully with ID:', savedExam._id);
      
      // Verify exams in the database
      const exams = await Exam.find({}).limit(5);
      console.log(`Found ${exams.length} exams in the database:`);
      
      exams.forEach(e => {
        const questionCount = e.sections.reduce((sum, section) => 
          sum + section.questions.length, 0);
          
        console.log(`- ${e._id}: "${e.title}" (${questionCount} questions)`);
      });
      
    } catch (error) {
      console.error('Error creating exam:', error);
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
