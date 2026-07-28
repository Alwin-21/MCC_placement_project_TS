import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments/[id]/questions/export — export as CSV
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "read")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    const { id } = await params;
    const questions = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: parseInt(id) },
      orderBy: { OrderIndex: "asc" },
    });

    const headers = ["QuestionText", "OptionA", "OptionB", "OptionC", "OptionD", "CorrectOption", "Marks"];
    const csvRows = [
      headers.join(","),
      ...questions.map((q) =>
        [
          `"${q.QuestionText.replace(/"/g, '""')}"`,
          `"${q.OptionA.replace(/"/g, '""')}"`,
          `"${q.OptionB.replace(/"/g, '""')}"`,
          `"${q.OptionC.replace(/"/g, '""')}"`,
          `"${q.OptionD.replace(/"/g, '""')}"`,
          q.CorrectOption,
          q.Marks,
        ].join(",")
      ),
    ];

    const csv = csvRows.join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="assessment_${id}_questions.csv"`,
      },
    });
  } catch (err: any) {
    console.error("GET Questions Export Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
