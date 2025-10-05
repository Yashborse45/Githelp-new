import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { answerQuestion } from "@/server/qa";
import { z } from "zod";

export const askRouter = createTRPCRouter({
    // Ask a question about a project
    question: protectedProcedure
        .input(
            z.object({
                projectId: z.string().min(1, "Project ID is required"),
                question: z.string().min(1, "Question cannot be empty"),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Verify project exists and user has access
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            // Get AI-powered answer
            const { answer, citations } = await answerQuestion(
                input.projectId,
                input.question
            );

            // Save the Q&A pair to database
            const savedAnswer = await ctx.db.answer.create({
                data: {
                    question: input.question,
                    answer,
                    citations: JSON.stringify(citations),
                    projectId: project.id,
                    createdById: ctx.auth.userId ?? undefined,
                },
                include: {
                    project: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                },
            });

            return {
                id: savedAnswer.id,
                question: savedAnswer.question,
                answer: savedAnswer.answer,
                citations,
                project: savedAnswer.project,
                createdAt: savedAnswer.createdAt,
            };
        }),

    // Get Q&A history for a project
    history: protectedProcedure
        .input(
            z.object({
                projectId: z.string(),
                limit: z.number().min(1).max(100).default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const answers = await ctx.db.answer.findMany({
                where: { projectId: input.projectId },
                take: input.limit + 1,
                cursor: input.cursor ? { id: input.cursor } : undefined,
                orderBy: { createdAt: "desc" },
                include: {
                    project: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                },
            });

            let nextCursor: typeof input.cursor | undefined = undefined;
            if (answers.length > input.limit) {
                const nextItem = answers.pop();
                nextCursor = nextItem!.id;
            }

            return {
                items: answers.map((answer) => ({
                    id: answer.id,
                    question: answer.question,
                    answer: answer.answer,
                    citations: answer.citations ? JSON.parse(answer.citations) : [],
                    project: answer.project,
                    createdAt: answer.createdAt,
                })),
                nextCursor,
            };
        }),

    // Search through previous Q&A
    search: protectedProcedure
        .input(
            z.object({
                projectId: z.string(),
                searchTerm: z.string().min(1, "Search term is required"),
                limit: z.number().min(1).max(50).default(10),
            })
        )
        .query(async ({ input, ctx }) => {
            const answers = await ctx.db.answer.findMany({
                where: {
                    projectId: input.projectId,
                    OR: [
                        {
                            question: {
                                contains: input.searchTerm,
                                mode: "insensitive",
                            },
                        },
                        {
                            answer: {
                                contains: input.searchTerm,
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                take: input.limit,
                orderBy: { createdAt: "desc" },
                include: {
                    project: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                },
            });

            return answers.map((answer) => ({
                id: answer.id,
                question: answer.question,
                answer: answer.answer,
                citations: answer.citations ? JSON.parse(answer.citations) : [],
                project: answer.project,
                createdAt: answer.createdAt,
            }));
        }),
});