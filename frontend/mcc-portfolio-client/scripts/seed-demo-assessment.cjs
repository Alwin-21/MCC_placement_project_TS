const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:admin123@127.0.0.1:5432/mcc_portfolio_db",
});

async function seed() {
  const client = await pool.connect();
  try {
    // Clean up any partially created demo assessments first
    await client.query(`DELETE FROM "Assessments" WHERE "Title" = 'Proctored Demo Assessment'`);
    console.log("Cleaned up any previous demo assessments.");

    // Find admin user
    const adminRes = await client.query(`SELECT "Id", "FullName" FROM "Users" WHERE "Role" = 2 LIMIT 1`);
    if (!adminRes.rows.length) {
      console.error("No admin user found.");
      return;
    }
    const adminId = adminRes.rows[0].Id;
    console.log("Admin:", adminRes.rows[0].FullName, "| ID:", adminId);

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const instructions = [
      "Welcome to the Proctored Demo Assessment.",
      "",
      "EXAM INSTRUCTIONS:",
      "1. Keep your face clearly visible in the webcam at all times.",
      "2. Do not look away from the screen - the AI monitors your gaze continuously.",
      "3. Do not use a mobile phone or any external study materials.",
      "4. Do not switch browser tabs or exit fullscreen mode.",
      "5. Answer all 10 questions within the 30-minute time limit.",
      "",
      "This exam is monitored by our AI proctoring system which detects:",
      "- Face absence or camera obstruction",
      "- Looking away from the screen",
      "- Mobile phone or prohibited device usage",
      "- Tab switching and fullscreen exit",
      "- Multiple persons in camera frame",
      "",
      "Suspicious behavior will be flagged and may result in exam termination.",
    ].join("\n");

    // Create assessment
    const aRes = await client.query(
      `INSERT INTO "Assessments" ("Title","Description","Instructions","DurationMinutes","TotalMarks","StartDate","EndDate","Status","Departments","CreatedAt","UpdatedAt","CreatedByUserId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING "Id"`,
      [
        "Proctored Demo Assessment",
        "A demonstration assessment showcasing AI-powered proctoring: face recognition, eye tracking, and exam security enforcement.",
        instructions,
        30,
        100,
        now,
        endDate,
        "Published",
        "CSE;IT;ECE;EEE;MECH;CIVIL",
        now,
        now,
        adminId,
      ]
    );
    const assessmentId = aRes.rows[0].Id;
    console.log("Created assessment ID:", assessmentId);

    const questions = [
      {
        text: "What is the primary purpose of an operating system?",
        a: "To manage hardware and software resources",
        b: "To browse the internet",
        c: "To write computer programs",
        d: "To store data permanently",
        ans: "A",
        marks: 10,
      },
      {
        text: "Which data structure follows the LIFO (Last In First Out) principle?",
        a: "Queue",
        b: "Array",
        c: "Stack",
        d: "Linked List",
        ans: "C",
        marks: 10,
      },
      {
        text: "What does HTML stand for?",
        a: "Hyperlinks and Text Markup Language",
        b: "HyperText Markup Language",
        c: "Home Tool Markup Language",
        d: "Hyper Transfer Markup Language",
        ans: "B",
        marks: 10,
      },
      {
        text: "Which sorting algorithm has the best average-case time complexity?",
        a: "Bubble Sort — O(n^2)",
        b: "Selection Sort — O(n^2)",
        c: "Merge Sort — O(n log n)",
        d: "Insertion Sort — O(n^2)",
        ans: "C",
        marks: 10,
      },
      {
        text: "What is the full form of SQL?",
        a: "Structured Query Language",
        b: "Simple Query Language",
        c: "Sequential Query Language",
        d: "Standard Query Language",
        ans: "A",
        marks: 10,
      },
      {
        text: "In Object-Oriented Programming, what is inheritance?",
        a: "Ability of a class to derive properties from another class",
        b: "The process of hiding implementation details",
        c: "The ability to have multiple methods with the same name",
        d: "Converting one data type to another",
        ans: "A",
        marks: 10,
      },
      {
        text: "Which protocol is used to securely transfer files over a network?",
        a: "FTP",
        b: "SFTP",
        c: "HTTP",
        d: "SMTP",
        ans: "B",
        marks: 10,
      },
      {
        text: "What does CPU stand for?",
        a: "Central Processing Unit",
        b: "Computer Personal Unit",
        c: "Central Program Utility",
        d: "Core Processing Unit",
        ans: "A",
        marks: 10,
      },
      {
        text: "Which of the following is NOT a programming paradigm?",
        a: "Object-Oriented Programming",
        b: "Functional Programming",
        c: "Sequential Programming",
        d: "Cloud Programming",
        ans: "D",
        marks: 10,
      },
      {
        text: "What is the time complexity of binary search on a sorted array?",
        a: "O(n)",
        b: "O(n^2)",
        c: "O(log n)",
        d: "O(1)",
        ans: "C",
        marks: 10,
      },
    ];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await client.query(
        `INSERT INTO "AssessmentQuestions" ("AssessmentId","QuestionText","OptionA","OptionB","OptionC","OptionD","CorrectOption","Marks","OrderIndex")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [assessmentId, q.text, q.a, q.b, q.c, q.d, q.ans, q.marks, i + 1]
      );
      console.log("  Q" + (i + 1) + ": " + q.text.substring(0, 60));
    }

    console.log("\n✅ Demo assessment seeded successfully!");
    console.log("   Assessment ID: " + assessmentId);
    console.log("   Title: Proctored Demo Assessment");
    console.log("   Questions: 10 | Total Marks: 100 | Duration: 30 min | Status: Published");
    console.log("\n   Open http://localhost:3001/assessment to take the exam.\n");
  } finally {
    client.release();
    pool.end();
  }
}

seed().catch((e) => {
  console.error("Seeding failed:", e.message);
  process.exit(1);
});
