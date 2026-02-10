const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');
const Question = require('./models/Question');
const Settings = require('./models/Settings');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    const existingStudent = await User.findOne({ email: 'student@example.com' });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration'
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    if (!existingStudent) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      await User.create({
        name: 'Deepesha Bisht',
        email: 'student@example.com',
        password: hashedPassword,
        role: 'student',
        studentId: 'STU2024001',
        department: 'Computer Science',
        year: 3
      });
      console.log('✅ Student user created');
    } else {
      console.log('ℹ️  Student user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
};

const seedQuestions = async () => {
  try {
    const existingQuestions = await Question.countDocuments();
    
    if (existingQuestions > 0) {
      console.log(`ℹ️  ${existingQuestions} questions already exist`);
      return;
    }

    const admin = await User.findOne({ role: 'admin' });
    
    const questions = [
      // Mathematics MCQs
      {
        questionType: 'mcq',
        subject: 'Mathematics',
        difficulty: 'easy',
        questionText: 'What is 15 + 27?',
        options: [
          { text: '40', isCorrect: false },
          { text: '42', isCorrect: true },
          { text: '43', isCorrect: false },
          { text: '45', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Mathematics',
        difficulty: 'medium',
        questionText: 'What is the value of √144?',
        options: [
          { text: '10', isCorrect: false },
          { text: '11', isCorrect: false },
          { text: '12', isCorrect: true },
          { text: '13', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Mathematics',
        difficulty: 'hard',
        questionText: 'If f(x) = 2x² + 3x - 5, what is f(2)?',
        options: [
          { text: '7', isCorrect: false },
          { text: '9', isCorrect: true },
          { text: '11', isCorrect: false },
          { text: '13', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },

      // Physics MCQs
      {
        questionType: 'mcq',
        subject: 'Physics',
        difficulty: 'easy',
        questionText: 'What is the SI unit of force?',
        options: [
          { text: 'Joule', isCorrect: false },
          { text: 'Newton', isCorrect: true },
          { text: 'Watt', isCorrect: false },
          { text: 'Pascal', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Physics',
        difficulty: 'medium',
        questionText: 'What is the speed of light in vacuum?',
        options: [
          { text: '3 × 10⁸ m/s', isCorrect: true },
          { text: '3 × 10⁶ m/s', isCorrect: false },
          { text: '3 × 10⁷ m/s', isCorrect: false },
          { text: '3 × 10⁹ m/s', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Physics',
        difficulty: 'hard',
        questionText: 'According to Newton\'s second law, F = ma. If force doubles and mass remains constant, acceleration:',
        options: [
          { text: 'Remains same', isCorrect: false },
          { text: 'Doubles', isCorrect: true },
          { text: 'Halves', isCorrect: false },
          { text: 'Quadruples', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },

      // Chemistry MCQs
      {
        questionType: 'mcq',
        subject: 'Chemistry',
        difficulty: 'easy',
        questionText: 'What is the chemical formula of water?',
        options: [
          { text: 'H2O', isCorrect: true },
          { text: 'CO2', isCorrect: false },
          { text: 'O2', isCorrect: false },
          { text: 'H2O2', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Chemistry',
        difficulty: 'medium',
        questionText: 'What is the atomic number of Carbon?',
        options: [
          { text: '4', isCorrect: false },
          { text: '6', isCorrect: true },
          { text: '8', isCorrect: false },
          { text: '12', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Chemistry',
        difficulty: 'hard',
        questionText: 'Which gas is released during photosynthesis?',
        options: [
          { text: 'Carbon Dioxide', isCorrect: false },
          { text: 'Nitrogen', isCorrect: false },
          { text: 'Oxygen', isCorrect: true },
          { text: 'Hydrogen', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },

      // Computer Science MCQs
      {
        questionType: 'mcq',
        subject: 'Computer Science',
        difficulty: 'easy',
        questionText: 'What does HTML stand for?',
        options: [
          { text: 'Hyper Text Markup Language', isCorrect: true },
          { text: 'High Tech Modern Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'Hyperlinks and Text Markup Language', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Computer Science',
        difficulty: 'medium',
        questionText: 'Which data structure uses LIFO (Last In First Out)?',
        options: [
          { text: 'Queue', isCorrect: false },
          { text: 'Stack', isCorrect: true },
          { text: 'Array', isCorrect: false },
          { text: 'Linked List', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'Computer Science',
        difficulty: 'hard',
        questionText: 'What is the time complexity of binary search?',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false },
          { text: 'O(1)', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },

      // English MCQs
      {
        questionType: 'mcq',
        subject: 'English',
        difficulty: 'easy',
        questionText: 'Choose the correct spelling:',
        options: [
          { text: 'Recieve', isCorrect: false },
          { text: 'Receive', isCorrect: true },
          { text: 'Receeve', isCorrect: false },
          { text: 'Recive', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },
      {
        questionType: 'mcq',
        subject: 'English',
        difficulty: 'medium',
        questionText: 'What is the synonym of "Abundant"?',
        options: [
          { text: 'Scarce', isCorrect: false },
          { text: 'Plentiful', isCorrect: true },
          { text: 'Limited', isCorrect: false },
          { text: 'Rare', isCorrect: false }
        ],
        points: 10,
        createdBy: admin._id
      },

      // Coding Questions
      {
        questionType: 'coding',
        subject: 'Computer Science',
        difficulty: 'easy',
        questionText: 'Sum of Two Numbers',
        problemStatement: 'Write a function that takes two numbers as parameters and returns their sum.',
        starterCode: 'function sum(a, b) {\n  // Write your code here\n  \n}',
        testCases: [
          { input: 'sum(5, 3)', expectedOutput: '8' },
          { input: 'sum(10, 20)', expectedOutput: '30' },
          { input: 'sum(-5, 5)', expectedOutput: '0' }
        ],
        points: 20,
        createdBy: admin._id
      },
      {
        questionType: 'coding',
        subject: 'Computer Science',
        difficulty: 'medium',
        questionText: 'Reverse a String',
        problemStatement: 'Write a function that takes a string and returns it reversed.',
        starterCode: 'function reverseString(str) {\n  // Write your code here\n  \n}',
        testCases: [
          { input: 'reverseString("hello")', expectedOutput: 'olleh' },
          { input: 'reverseString("world")', expectedOutput: 'dlrow' },
          { input: 'reverseString("JavaScript")', expectedOutput: 'tpircSavaJ' }
        ],
        points: 20,
        createdBy: admin._id
      },
      {
        questionType: 'coding',
        subject: 'Computer Science',
        difficulty: 'hard',
        questionText: 'Check Prime Number',
        problemStatement: 'Write a function that checks if a number is prime. Return true if prime, false otherwise.',
        starterCode: 'function isPrime(n) {\n  // Write your code here\n  \n}',
        testCases: [
          { input: 'isPrime(7)', expectedOutput: 'true' },
          { input: 'isPrime(10)', expectedOutput: 'false' },
          { input: 'isPrime(13)', expectedOutput: 'true' }
        ],
        points: 20,
        createdBy: admin._id
      },
      {
        questionType: 'coding',
        subject: 'Mathematics',
        difficulty: 'medium',
        questionText: 'Calculate Factorial',
        problemStatement: 'Write a function that calculates the factorial of a number.',
        starterCode: 'function factorial(n) {\n  // Write your code here\n  \n}',
        testCases: [
          { input: 'factorial(5)', expectedOutput: '120' },
          { input: 'factorial(3)', expectedOutput: '6' },
          { input: 'factorial(0)', expectedOutput: '1' }
        ],
        points: 20,
        createdBy: admin._id
      }
    ];

    await Question.insertMany(questions);
    console.log(`✅ ${questions.length} questions created`);
  } catch (error) {
    console.error('❌ Error seeding questions:', error.message);
  }
};

const seedSettings = async () => {
  try {
    const existingSettings = await Settings.findOne();
    
    if (existingSettings) {
      console.log('ℹ️  Settings already exist');
      return;
    }

    await Settings.create({
      mcqCount: 5,
      codingCount: 2,
      mcqTimeLimit: 30,
      codingTimeLimit: 60,
      passingPercentageMCQ: 60,
      passingPercentageCoding: 50,
      maxViolations: 3,
      autoSubmitOnViolation: true,
      difficultyDistribution: {
        easy: 40,
        medium: 40,
        hard: 20
      }
    });
    console.log('✅ Settings created');
  } catch (error) {
    console.error('❌ Error seeding settings:', error.message);
  }
};

const seedDatabase = async () => {
  await connectDB();
  
  console.log('\n🌱 Starting database seeding...\n');
  
  await seedUsers();
  await seedQuestions();
  await seedSettings();
  
  console.log('\n✅ Database seeding completed!\n');
  process.exit(0);
};

seedDatabase();
