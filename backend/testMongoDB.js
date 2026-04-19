const mongoose = require('mongoose');
const Exam = require('./models/Exam');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/TrainingAndPlacement')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Create a simple test exam
      const testExam = new Exam({
        title: 'Test Exam ' + new Date().toISOString(),
        description: 'Test exam created via script',
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
            description: 'Auto-generated section containing all questions',
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
          }        ],
        createdBy: new mongoose.Types.ObjectId('6457b8f000b91e0014c4399a') // Use a placeholder ID
      });

      // Save the exam
      const savedExam = await testExam.save();
      console.log('Test exam created successfully:', savedExam._id);
      
      // Verify it was saved by fetching it
      const exams = await Exam.find().limit(5);
      console.log(`Found ${exams.length} exams in the database:`);
      exams.forEach(exam => {
        console.log(`- ${exam._id}: ${exam.title} (${exam.sections.length} sections, ${exam.sections.reduce((sum, section) => sum + section.questions.length, 0)} questions)`);
      });
    } catch (error) {
      console.error('Error creating test exam:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
