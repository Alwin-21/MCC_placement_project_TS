import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
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
        questionText: q.QuestionText,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
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
  } catch (err: any) {
    console.error("GET Questions Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
