const path = require("path");
require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env.local") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Seeding sample assessment with 10 questions...");

  // 1. Get or create Super Admin
  let admin = await prisma.users.findFirst({ where: { Role: 2 } });
  if (!admin) {
    admin = await prisma.users.create({
      data: {
        FullName: "Super Administrator",
        Email: "admin@mcc.com",
        PasswordHash: "$2a$10$abcdefghijklmnopqrstuv",
        Department: "Administration",
        RegisterNumber: "ADMIN001",
        Role: 2,
        CreatedAt: new Date(),
        Stream: "Admin",
        Username: "superadmin",
        IsActive: true,
      },
    });
  }

  // 2. Create Assessment
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days active

  const assessment = await prisma.assessments.create({
    data: {
      Title: "Technical Placement Mock Test 2026",
      Description: "Comprehensive test covering Data Structures, Web Development, Databases, and Core CS Fundamentals for placement preparation.",
      Instructions: "1. All 10 questions carry equal marks (5 marks each).\n2. Duration: 30 Minutes.\n3. Proctoring system monitors window focus.",
      DurationMinutes: 30,
      TotalMarks: 50,
      StartDate: now,
      EndDate: endDate,
      Status: "Published",
      Departments: "Computer Science;Information Technology;MCA",
      CreatedAt: now,
      UpdatedAt: now,
      CreatedByUserId: admin.Id,
    },
  });

  console.log(`Created Assessment ID: ${assessment.Id}`);

  // 3. Add 10 Questions
  const questionsData = [
    {
      QuestionText: "What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?",
      OptionA: "O(1)",
      OptionB: "O(log n)",
      OptionC: "O(n)",
      OptionD: "O(n log n)",
      CorrectOption: "B",
      Marks: 5,
      OrderIndex: 0
    },
    {
      QuestionText: "Which HTTP status code indicates that a requested resource was not found on the server?",
      OptionA: "200 OK",
      OptionB: "401 Unauthorized",
      OptionC: "404 Not Found",
      OptionD: "500 Internal Server Error",
      CorrectOption: "C",
      Marks: 5,
      OrderIndex: 1
    },
    {
      QuestionText: "In SQL, which clause is used to filter records after an aggregate function or GROUP BY has been applied?",
      OptionA: "WHERE",
      OptionB: "HAVING",
      OptionC: "ORDER BY",
      OptionD: "FILTER BY",
      CorrectOption: "B",
      Marks: 5,
      OrderIndex: 2
    },
    {
      QuestionText: "Which data structure follows the Last-In, First-Out (LIFO) principle?",
      OptionA: "Queue",
      OptionB: "Stack",
      OptionC: "Linked List",
      OptionD: "Array",
      CorrectOption: "B",
      Marks: 5,
      OrderIndex: 3
    },
    {
      QuestionText: "What is the default port number for HTTP network protocol?",
      OptionA: "21",
      OptionB: "22",
      OptionC: "80",
      OptionD: "443",
      CorrectOption: "C",
      Marks: 5,
      OrderIndex: 4
    },
    {
      QuestionText: "Which Object-Oriented Programming principle allows a class to inherit properties and methods from another class?",
      OptionA: "Encapsulation",
      OptionB: "Abstraction",
      OptionC: "Inheritance",
      OptionD: "Polymorphism",
      CorrectOption: "C",
      Marks: 5,
      OrderIndex: 5
    },
    {
      QuestionText: "What does API stand for in software engineering?",
      OptionA: "Application Programming Interface",
      OptionB: "Automated Program Integration",
      OptionC: "Application Process Interaction",
      OptionD: "Advanced Protocol Interface",
      CorrectOption: "A",
      Marks: 5,
      OrderIndex: 6
    },
    {
      QuestionText: "Which sorting algorithm has a worst-case time complexity of O(n^2)?",
      OptionA: "Merge Sort",
      OptionB: "Quick Sort",
      OptionC: "Heap Sort",
      OptionD: "Radix Sort",
      CorrectOption: "B",
      Marks: 5,
      OrderIndex: 7
    },
    {
      QuestionText: "In Git, which command is used to record changes to the local repository with a descriptive message?",
      OptionA: "git push",
      OptionB: "git add",
      OptionC: "git commit",
      OptionD: "git checkout",
      CorrectOption: "C",
      Marks: 5,
      OrderIndex: 8
    },
    {
      QuestionText: "Which React hook is primarily used to declare state variables in modern functional components?",
      OptionA: "useEffect",
      OptionB: "useState",
      OptionC: "useRef",
      OptionD: "useMemo",
      CorrectOption: "B",
      Marks: 5,
      OrderIndex: 9
    }
  ];

  for (const q of questionsData) {
    await prisma.assessmentQuestions.create({
      data: {
        AssessmentId: assessment.Id,
        QuestionText: q.QuestionText,
        OptionA: q.OptionA,
        OptionB: q.OptionB,
        OptionC: q.OptionC,
        OptionD: q.OptionD,
        CorrectOption: q.CorrectOption,
        Marks: q.Marks,
        OrderIndex: q.OrderIndex
      }
    });
  }

  console.log("SUCCESSFULLY_SEEDED_ASSESSMENT_ID:", assessment.Id);
}

seed()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
