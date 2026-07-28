import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest, hasModulePermission } from "@/utils/auth";

// PUT /api/Assessments/[id]/questions/[qid]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { qid } = await params;
    const body = await request.json();
    const { questionText, optionA, optionB, optionC, optionD, correctOption, marks } = body;

    const updated = await prisma.assessmentQuestions.update({
      where: { Id: parseInt(qid) },
      data: {
        QuestionText: questionText?.trim() ?? undefined,
        OptionA: optionA?.trim() ?? undefined,
        OptionB: optionB?.trim() ?? undefined,
        OptionC: optionC?.trim() ?? undefined,
        OptionD: optionD?.trim() ?? undefined,
        CorrectOption: correctOption?.toUpperCase() ?? undefined,
        Marks: marks !== undefined ? parseInt(marks) : undefined,
      },
    });

    return NextResponse.json({ success: true, id: updated.Id });
  } catch (err: any) {
    console.error("PUT Question Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/Assessments/[id]/questions/[qid]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload || !hasModulePermission(userPayload, "assessments", "write")) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { qid } = await params;
    await prisma.assessmentQuestions.delete({ where: { Id: parseInt(qid) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Question Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
