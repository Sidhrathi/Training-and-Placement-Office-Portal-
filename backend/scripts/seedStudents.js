const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();
// Import the Student model
const Student = require("../models/Student");

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to generate random CGPA between 6 and 10
const generateCgpa = () => {
  return parseFloat((Math.random() * (10 - 6) + 6).toFixed(2));
};

// Function to generate random percentage between min and max
const generatePercentage = (min = 60, max = 95) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

// Define branches, departments, and states for randomization
const branches = [
  "Computer Science",
  "Information Technology",
  "Data Science",
  "AI & ML",
  "Cloud Computing",
];
const departments = [
  "MCA Department",
  "Computer Applications",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electronics and Communication",
  "Electrical Engineering",
  "Information Science",
  "Artificial Intelligence",
  "Data Science",
];
const cities = [
  "Hubballi",
  "Bengaluru",
  "Mysuru",
  "Mangaluru",
  "Belagavi",
  "Dharwad",
  "Vijayapura",
  "Kalaburagi",
  "Udupi",
  "Shivamogga",
];
const states = [
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Kerala",
  "Telangana",
];

// Create student data array
const createStudentData = async () => {
  const students = [];
  const salt = await bcrypt.genSalt(10);

  // List of student names
  const studentNames = [
    "Akshay Kumar",
    "Ananya Sharma",
    "Aditya Patel",
    "Bhavya Singh",
    "Chirag Verma",
    "Deepika Nair",
    "Darshan Hegde",
    "Esha Reddy",
    "Farhan Khan",
    "Gita Desai",
    "Harish Joshi",
    "Ishita Gupta",
    "Jai Patel",
    "Kavya Rao",
    "Karan Malhotra",
    "Leela Iyer",
    "Manish Tiwari",
    "Neha Choudhury",
    "Nikhil Menon",
    "Pallavi Saxena",
    "Prakash Kumar",
    "Rachna Banerjee",
    "Rahul Sharma",
    "Sneha Yadav",
    "Tarun Nair",
    "Uma Desai",
    "Vijay Kapoor",
    "Vidya Suresh",
    "Yash Agarwal",
    "Zoya Ahmed",
    "Arjun Nambiar",
    "Bhumi Seth",
    "Chandrashekhar Iyer",
    "Divya Krishnan",
    "Eshwar Prasad",
    "Falguni Mehta",
    "Ganesh Pai",
    "Hema Narayan",
    "Irfan Ali",
    "Juhi Chauhan",
    "Kamal Vaidya",
    "Lata Menon",
    "Manoj Vincent",
    "Nandini Rajan",
    "Omkar Patil",
    "Priya George",
    "Rajesh Nambiar",
    "Sarita Kumar",
    "Tejas Hegde",
    "Usha Sharma",
  ];

  for (let i = 0; i < 50; i++) {
    // Generate the USN with format 01FE23MCA[071-120]
    const usnNumber = (71 + i).toString().padStart(3, "0");
    const usn = `01FE23MCA${usnNumber}`;

    // Create a username from the name (lowercase, no spaces)
    const name = studentNames[i];
    const username = name.toLowerCase().replace(/\s/g, "");

    // Generate email from username
    const email = `${username}@example.com`;

    // Hash the password (username@123)
    const password = await bcrypt.hash(`${username}@123`, salt);

    // Generate phone number
    const phoneNumber = `9${Math.floor(
      Math.random() * 9000000000 + 1000000000
    )}`.substring(0, 10);

    // Random values for other fields
    const branch = branches[Math.floor(Math.random() * branches.length)];
    const department =
      departments[Math.floor(Math.random() * departments.length)];
    const semester = Math.floor(Math.random() * 2) + 1; // 1 or 2 for MCA
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];

    // Educational details
    const tenthPercentage = generatePercentage(70, 98);
    const twelfthPercentage = generatePercentage(65, 95);
    const degreePercentage = generatePercentage(60, 90);
    const cgpa = generateCgpa();

    // Create student object
    const student = {
      name,
      usn,
      email,
      password,
      phoneNumber,
      branch,
      department,
      semester,
      city,
      state,
      tenthPercentage,
      twelfthPercentage,
      degreePercentage,
      cgpa,
      backlogs: Math.random() > 0.8 ? Math.floor(Math.random() * 2) + 1 : 0, // 20% chance of having backlogs
      placementStatus: "Not Placed",
    };

    students.push(student);
  }

  return students;
};

// Seed the database
const seedDatabase = async () => {
  try {
    // Delete existing data
    // await Student.deleteMany({});
    // console.log('Existing students deleted');

    // Create and insert new student data
    const studentData = await createStudentData();
    const insertedStudents = await Student.insertMany(studentData);

    console.log(
      `${insertedStudents.length} students successfully added to the database`
    );

    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
