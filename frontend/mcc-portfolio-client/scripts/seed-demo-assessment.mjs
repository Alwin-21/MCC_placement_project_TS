/**
 * Demo Assessment Seeder
 * Run from project root: node scripts/seed-demo-assessment.mjs
 * Creates a "Proctored Demo Assessment" with 10 questions for demonstration.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find an admin user to assign as creator
  let adminUser = await prisma.users.findFirst({ where: { Role: 2 } });
  if (!adminUser) {
    console.error("No admin user found. Please create an admin user first.");
    process.exit(1);
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  const assessment = await prisma.assessments.create({
    data: {
      Title: "Proctored Demo Assessment",
      Description: "A demonstration assessment showcasing AI-powered proctoring: face recognition, eye tracking, and security enforcement.",
      Instructions: `Welcome to the Proctored Demo Assessment.\n\nIMPORTANT INSTRUCTIONS:\n1. Ensure your face is clearly visible in the webcam at all times.\n2. Do not look away from the screen — the AI monitors your gaze.\n3. Do not use a mobile phone or any external materials.\n4. Do not switch browser tabs or exit fullscreen mode.\n5. Answer all questions within the allotted time.\n\nThis assessment is monitored by an AI proctoring system which detects:\n• Face absence or obstruction\n• Looking away from the screen\n• Mobile phone or prohibited device usage\n• Tab switching and fullscreen exit\n• Multiple persons in camera frame`,
      DurationMinutes: 30,
      TotalMarks: 100,
      StartDate: now,
      EndDate: endDate,
      Status: "Published",
      Departments: "CSE;IT;ECE;EEE;MECH;CIVIL",
      CreatedAt: now,
      UpdatedAt: now,
      CreatedByUserId: adminUser.Id,
    },
  });

  console.log(`\u2713 Created assessment: ID=${assessment.Id}, Title="${assessment.Title}"`);

  const questions = [
    {
      questionText: "What is the primary purpose of an operating system?",
      optionA: "To manage hardware and software resources",
      optionB: "To browse the internet",
      optionC: "To write computer programs",
      optionD: "To store data permanently",
      correctAnswer: "A",
      marks: 10,
    },
    {
      questionText: "Which data structure follows the LIFO (Last In First Out) principle?",
      optionA: "Queue",
      optionB: "Array",
      optionC: "Stack",
      optionD: "Linked List",
      correctAnswer: "C",
      marks: 10,
    },
    {
      questionText: "What does HTML stand for?",
      optionA: "Hyperlinks and Text Markup Language",
      optionB: "HyperText Markup Language",
      optionC: "Home Tool Markup Language",
      optionD: "Hyper Transfer Markup Language",
      correctAnswer: "B",
      marks: 10,
    },
    {
      questionText: "Which sorting algorithm has the best average-case time complexity?",
      optionA: "Bubble Sort — O(n\u00b2)",
      optionB: "Selection Sort — O(n\u00b2)",
      optionC: "Merge Sort — O(n log n)",
      optionD: "Insertion Sort — O(n\u00b2)",
      correctAnswer: "C",
      marks: 10,
    },
    {
      questionText: "What is the full form of SQL?",
      optionA: "Structured Query Language",
      optionB: "Simple Query Language",
      optionC: "Sequential Query Language",
      optionD: "Standard Query Language",
      correctAnswer: "A",
      marks: 10,
    },
    {
      questionText: "In object-oriented programming, what is 'inheritance'?",
      optionA: "The ability of a class to derive properties and behaviors from another class",
      optionB: "The process of hiding implementation details",
      optionC: "The ability to have multiple methods with the same name",
      optionD: "Converting one data type to another",
      correctAnswer: "A",
      marks: 10,
    },
    {
      questionText: "Which protocol is used to securely transfer files over a network?",
      optionA: "FTP",
      optionB: "SFTP",
      optionC: "HTTP",
      optionD: "SMTP",
      correctAnswer: "B",
      marks: 10,
    },
    {
      questionText: "What does CPU stand for?",
      optionA: "Central Processing Unit",
      optionB: "Computer Personal Unit",
      optionC: "Central Program Utility",
      optionD: "Core Processing Unit",
      correctAnswer: "A",
      marks: 10,
    },
    {
      questionText: "Which of the following is NOT a programming paradigm?",
      optionA: "Object-Oriented Programming",
      optionB: "Functional Programming",
      optionC: "Sequential Programming",
      optionD: "Cloud Programming",
      correctAnswer: "D",
      marks: 10,
    },
    {
      questionText: "What is the time complexity of binary search on a sorted array?",
      optionA: "O(n)",
      optionB: "O(n\u00b2)",
      optionC: "O(log n)",
      optionD: "O(1)",
      correctAnswer: "C",
      marks: 10,
    },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.assessmentQuestions.create({
      data: {
        AssessmentId: assessment.Id,
        QuestionText: q.questionText,
        OptionA: q.optionA,
        OptionB: q.optionB,
        OptionC: q.optionC,
        OptionD: q.optionD,
        CorrectAnswer: q.correctAnswer,
        Marks: q.marks,
        CreatedAt: now,
        UpdatedAt: now,
      },
    });
    console.log(`  \u2713 Q${i + 1}: ${q.questionText.substring(0, 60)}...`);
  }

  console.log(`\n\u2705 Demo assessment ready!`);
  console.log(`   ID: ${assessment.Id} | "${assessment.Title}"`);
  console.log(`   10 questions | 100 marks | 30 minutes | Status: Published`);
  console.log(`\n   \u279c Open http://localhost:3001/assessment to take it.\n`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
