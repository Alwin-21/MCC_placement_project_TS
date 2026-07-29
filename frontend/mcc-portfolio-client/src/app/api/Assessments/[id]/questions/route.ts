import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
<<<<<<< HEAD
import { getUserFromRequest } from "@/utils/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);

    const aqs = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: assessmentId },
      include: { Questions: true }
    });

    const questions = aqs.map(aq => aq.Questions);

    if (userPayload.role === "Student") {
      // Strip correct answers to prevent inspection cheating!
      const secured = questions.map(q => ({
        id: q.Id,
=======
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// GET /api/Assessments/[id]/questions
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

    return NextResponse.json(
      questions.map((q) => ({
        id: q.Id,
        assessmentId: q.AssessmentId,
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
        questionText: q.QuestionText,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
<<<<<<< HEAD
        marks: q.Marks
      }));
      return NextResponse.json(secured);
    }

    // Admin/Moderator gets full details
    const formatted = questions.map(q => ({
      id: q.Id,
      questionText: q.QuestionText,
      optionA: q.OptionA,
      optionB: q.OptionB,
      optionC: q.OptionC,
      optionD: q.OptionD,
      correctAnswer: q.CorrectAnswer,
      marks: q.Marks
    }));

    return NextResponse.json(formatted);
=======
        correctOption: q.CorrectOption,
        marks: q.Marks,
        orderIndex: q.OrderIndex,
      }))
    );
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
  } catch (err: any) {
    console.error("GET Questions Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

<<<<<<< HEAD
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || (userPayload.role !== "Admin" && userPayload.role !== "Moderator")) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const assessmentId = parseInt(id);
    const body = await request.json(); // array of questions

    if (!Array.isArray(body)) {
      return NextResponse.json("Invalid payload, expected array", { status: 400 });
    }

    // Fetch existing relationships
    const existingAqs = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: assessmentId },
      include: { Questions: true }
    });

    const existingQuestionIds = existingAqs.map(aq => aq.QuestionId);
    const incomingQuestionIds = body.map((q: any) => q.id).filter((qid: any) => typeof qid === "number");

    // Identify questions to delete
    const questionIdsToDelete = existingQuestionIds.filter(qid => !incomingQuestionIds.includes(qid));

    // Execute transaction to sync database
    await prisma.$transaction(async (tx) => {
      // 1. Delete questions that are no longer referenced
      if (questionIdsToDelete.length > 0) {
        await tx.assessmentQuestions.deleteMany({
          where: {
            AssessmentId: assessmentId,
            QuestionId: { in: questionIdsToDelete }
          }
        });
        await tx.questions.deleteMany({
          where: { Id: { in: questionIdsToDelete } }
        });
      }

      // 2. Create or Update questions
      for (const q of body) {
        if (q.id && existingQuestionIds.includes(q.id)) {
          // Update
          await tx.questions.update({
            where: { Id: q.id },
            data: {
              QuestionText: q.questionText,
              OptionA: q.optionA,
              OptionB: q.optionB,
              OptionC: q.optionC,
              OptionD: q.optionD,
              CorrectAnswer: q.correctAnswer,
              Marks: parseInt(q.marks) || 1
            }
          });
        } else {
          // Create new question
          const newQ = await tx.questions.create({
            data: {
              QuestionText: q.questionText,
              OptionA: q.optionA,
              OptionB: q.optionB,
              OptionC: q.optionC,
              OptionD: q.optionD,
              CorrectAnswer: q.correctAnswer,
              Marks: parseInt(q.marks) || 1
            }
          });
          // Link it to assessment
          await tx.assessmentQuestions.create({
            data: {
              AssessmentId: assessmentId,
              QuestionId: newQ.Id
            }
          });
        }
      }
    });

    return NextResponse.json("Questions saved successfully.");
  } catch (err: any) {
    console.error("POST Save Questions Error:", err);
=======
// POST /api/Assessments/[id]/questions — bulk import
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { id } = await params;
    const assessmentId = parseInt(id);

    const body = await request.json();
    const { questions, replace } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: "No questions provided." }, { status: 400 });
    }

    // Validate all questions
    const invalid: number[] = [];
    const valid = questions.filter((q: any, idx: number) => {
      const hasRequired =
        q.questionText?.trim() &&
        q.optionA?.trim() &&
        q.optionB?.trim() &&
        q.optionC?.trim() &&
        q.optionD?.trim() &&
        ["A", "B", "C", "D"].includes((q.correctOption || "").toUpperCase()) &&
        !isNaN(parseInt(q.marks)) &&
        parseInt(q.marks) > 0;
      if (!hasRequired) invalid.push(idx + 1);
      return hasRequired;
    });

    if (replace) {
      await prisma.assessmentQuestions.deleteMany({ where: { AssessmentId: assessmentId } });
    }

    // Get current max order index
    const existing = await prisma.assessmentQuestions.findMany({
      where: { AssessmentId: assessmentId },
      orderBy: { OrderIndex: "desc" },
      take: 1,
    });
    let startIndex = existing.length > 0 ? existing[0].OrderIndex + 1 : 0;

    const created = await prisma.assessmentQuestions.createMany({
      data: valid.map((q: any, i: number) => ({
        AssessmentId: assessmentId,
        QuestionText: q.questionText.trim(),
        OptionA: q.optionA.trim(),
        OptionB: q.optionB.trim(),
        OptionC: q.optionC.trim(),
        OptionD: q.optionD.trim(),
        CorrectOption: q.correctOption.toUpperCase(),
        Marks: parseInt(q.marks),
        OrderIndex: startIndex + i,
      })),
    });

    // Update assessment total marks
    const allQ = await prisma.assessmentQuestions.findMany({ where: { AssessmentId: assessmentId } });
    const total = allQ.reduce((sum, q) => sum + q.Marks, 0);
    await prisma.assessments.update({
      where: { Id: assessmentId },
      data: { TotalMarks: total, UpdatedAt: new Date() },
    });

    return NextResponse.json({ success: true, created: created.count, invalidRows: invalid });
  } catch (err: any) {
    console.error("POST Questions Error:", err);
>>>>>>> 40a9e30e1da64064e79b351472bee8ee265619c7
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
