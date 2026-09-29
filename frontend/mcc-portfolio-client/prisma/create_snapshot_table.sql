CREATE TABLE IF NOT EXISTS "DepartmentAnalyticsSnapshot" (
  "Id" SERIAL PRIMARY KEY,
  "Date" DATE NOT NULL,
  "DepartmentId" TEXT NOT NULL,
  "Stream" TEXT NOT NULL,
  "TotalStudents" INTEGER NOT NULL DEFAULT 0,
  "NewSignupsToday" INTEGER NOT NULL DEFAULT 0,
  "ActiveStudentsToday" INTEGER NOT NULL DEFAULT 0,
  "AvgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "SectionCompletionCounts" TEXT NOT NULL DEFAULT '{}',
  "CreatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "UQ_DeptSnapshot_Date_Dept" UNIQUE ("Date", "DepartmentId")
);
