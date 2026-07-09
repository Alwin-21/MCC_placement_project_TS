import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) return NextResponse.json("Unauthorized", { status: 401 });
    const userId = parseInt(userPayload.nameid, 10);

    const user = await prisma.users.findUnique({ where: { Id: userId } });
    if (!user) return NextResponse.json("User not found.", { status: 404 });

    const profile = await prisma.profiles.findFirst({ where: { UserId: userId } });
    const skills = await prisma.skills.findMany({ where: { UserId: userId } });
    const projects = await prisma.projects.findMany({ where: { UserId: userId } });
    const papers = await prisma.researchPapers.findMany({ where: { UserId: userId } });
    const certs = await prisma.certifications.findMany({ where: { UserId: userId } });

    const body = await request.json();
    const { targetPath, tone } = body;

    const skillsCsv = skills.length > 0 ? skills.map(s => s.Name).join(", ") : "core technologies";
    const projectsCsv = projects.length > 0 ? projects.map(p => p.Title).join(", ") : "several technical implementations";
    const certsCsv = certs.length > 0 ? certs.map(c => c.Title).join(", ") : "professional certifications";
    
    const cgpaText = profile && profile.CGPA > 0 ? `carrying a cumulative grade point average of ${profile.CGPA.toFixed(2)}/10.0` : "";
    const targetCareerText = profile && profile.TargetCareer ? profile.TargetCareer : (targetPath || "my chosen career path");
    const dept = user.Department || "my department";

    let header = "STATEMENT OF PURPOSE";
    let opening = `I am writing to express my strong candidacy for opportunities in ${targetCareerText}. As a dedicated student of ${dept} at Madras Christian College ${cgpaText}, I have developed a robust academic foundation coupled with practical experience that matches the demands of this challenging domain.`;
    
    let middle = `Throughout my study at Madras Christian College, I have cultivated hands-on competencies in ${skillsCsv}. I consolidated these skills by engineering projects like ${projectsCsv}. Additionally, my drive to learn is represented by credentials in ${certsCsv}.`;
    
    if (papers.length > 0) {
      middle += ` Driven by scientific curiosity, I authored the research publication '${papers[0].Title}' presented at ${papers[0].Conference}, showing my ability to perform rigorous analysis.`;
    }

    let closing = `Looking forward, I intend to apply the academic discipline and innovative spirit I acquired at Madras Christian College to make high-impact contributions. I am confident that my technical skills and proactive mindset prepare me well for success.`;

    const selectedTone = tone || "Academic";

    if (selectedTone === "Corporate") {
      header = "PROFESSIONAL CAREER STATEMENT";
      opening = `Dear Hiring Manager, I am applying for positions in ${targetCareerText} that leverage my training in ${dept} from Madras Christian College. My objective is to bring structured problem-solving and rapid software delivery capabilities to your organization.`;
      middle = `In my tenure at MCC, I acquired expertise in industry-standard stacks, notably ${skillsCsv}. I built production-like solutions, including ${projectsCsv}, focusing on clean architecture and optimization. My training is supplemented by certified proficiency in ${certsCsv}.`;
      closing = `I am excited to join an agile corporate team where I can apply my dedication to clean code, collaboration, and performance metrics. Thank you for your consideration.`;
    } else if (selectedTone === "Startup") {
      header = "FOUNDER / INNOVATOR MANIFESTO";
      opening = `To the Startup Team, I want to deploy my technical drive in ${targetCareerText}. As a builder studying ${dept} at Madras Christian College, I specialize in rapid prototyping and zero-to-one engineering.`;
      middle = `I thrive on building things. My technical arsenal covers ${skillsCsv}. I have designed and deployed products like ${projectsCsv}, proving my ability to ship fast and adapt under pressure. I hold certifications in ${certsCsv}.`;
      closing = `I want to join a team that moves fast, breaks boundaries, and shapes the future. I am ready to work hard and contribute code from day one.`;
    }

    const sopText = `${header}\n\nDear Admissions / Recruitment Panel,\n\n${opening}\n\n${middle}\n\n${closing}\n\nSincerely,\n${user.FullName}\nMadras Christian College`;

    return NextResponse.json({ sop: sopText });
  } catch (err: any) {
    console.error("Generate SOP Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
