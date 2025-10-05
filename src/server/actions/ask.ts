"use server";

import { db } from "@/server/db";
import { answerQuestion, type Citation } from "@/server/qa";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type AskResult = {
    success: boolean;
    data?: {
        id: string;
        question: string;
        answer: string;
        citations: Citation[];
        createdAt: Date;
    };
    error?: string;
};

export async function askQuestion(
    projectId: string,
    question: string
): Promise<AskResult> {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Authentication required" };
        }

        // Validate input
        if (!projectId.trim()) {
            return { success: false, error: "Project ID is required" };
        }

        if (!question.trim()) {
            return { success: false, error: "Question cannot be empty" };
        }

        // Check if project exists
        const project = await db.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Process the question
        const { answer, citations } = await answerQuestion(projectId, question);

        // Save to database
        const savedAnswer = await db.answer.create({
            data: {
                question: question.trim(),
                answer,
                citations: JSON.stringify(citations),
                projectId: project.id,
                createdById: userId,
            },
        });

        // Revalidate relevant pages
        revalidatePath(`/dashboard/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/qa`);

        return {
            success: true,
            data: {
                id: savedAnswer.id,
                question: savedAnswer.question,
                answer: savedAnswer.answer,
                citations,
                createdAt: savedAnswer.createdAt,
            },
        };
    } catch (error) {
        console.error("Error in askQuestion server action:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        };
    }
}

export type GetQAHistoryResult = {
    success: boolean;
    data?: Array<{
        id: string;
        question: string;
        answer: string;
        citations: Citation[];
        createdAt: Date;
    }>;
    error?: string;
};

export async function getQAHistory(projectId: string): Promise<GetQAHistoryResult> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Authentication required" };
        }

        if (!projectId.trim()) {
            return { success: false, error: "Project ID is required" };
        }

        const answers = await db.answer.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to recent 50 Q&As
        });

        return {
            success: true,
            data: answers.map((answer) => ({
                id: answer.id,
                question: answer.question,
                answer: answer.answer,
                citations: answer.citations ? JSON.parse(answer.citations) : [],
                createdAt: answer.createdAt,
            })),
        };
    } catch (error) {
        console.error("Error getting Q&A history:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        };
    }
}

export async function deleteQA(answerId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Authentication required" };
        }

        // Verify the answer belongs to the user (optional additional security)
        const answer = await db.answer.findUnique({
            where: { id: answerId },
        });

        if (!answer) {
            return { success: false, error: "Q&A not found" };
        }

        await db.answer.delete({
            where: { id: answerId },
        });

        // Revalidate relevant pages
        revalidatePath(`/dashboard/projects/${answer.projectId}`);
        revalidatePath(`/projects/${answer.projectId}/qa`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting Q&A:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        };
    }
}