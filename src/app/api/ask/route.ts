import { db } from "@/server/db";
import { answerQuestion } from "@/server/qa";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { projectId, question } = body;

        // Validate input
        if (!projectId || !question) {
            return NextResponse.json(
                { error: "ProjectId and question are required" },
                { status: 400 }
            );
        }

        // Check if project exists and user has access
        const project = await db.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Process the question using existing Q&A logic
        const { answer, citations } = await answerQuestion(projectId, question);

        // Save the answer to database
        const savedAnswer = await db.answer.create({
            data: {
                question,
                answer,
                citations: JSON.stringify(citations),
                projectId: project.id,
                createdById: userId,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: savedAnswer.id,
                question: savedAnswer.question,
                answer: savedAnswer.answer,
                citations,
                createdAt: savedAnswer.createdAt,
            },
        });
    } catch (error) {
        console.error("Error in ask API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { error: "ProjectId is required" },
                { status: 400 }
            );
        }

        // Get all Q&A history for the project
        const answers = await db.answer.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            data: answers.map((answer) => ({
                id: answer.id,
                question: answer.question,
                answer: answer.answer,
                citations: answer.citations ? JSON.parse(answer.citations) : [],
                createdAt: answer.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching Q&A history:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}