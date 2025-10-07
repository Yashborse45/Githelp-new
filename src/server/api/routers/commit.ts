import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getRecentCommits } from "@/server/github";
import { z } from "zod";

export const commitRouter = createTRPCRouter({
  getRecent: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      limit: z.number().min(1).max(50).default(10)
    }))
    .query(async ({ ctx, input }) => {
      // Get project details
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          ownerId: ctx.auth.userId,
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      try {
        // Fetch recent commits from GitHub
        const commits = await getRecentCommits(
          project.repoOwner,
          project.repoName,
          project.githubToken || undefined,
          input.limit
        );

        // Optionally cache commits in database (upsert to avoid duplicates)
        const cachedCommits = await Promise.all(
          commits.map(async (commit) => {
            return ctx.db.commit.upsert({
              where: { sha: commit.sha },
              update: {
                message: commit.message,
                author: commit.author,
                timestamp: commit.timestamp,
              },
              create: {
                sha: commit.sha,
                message: commit.message,
                author: commit.author,
                timestamp: commit.timestamp,
                projectId: project.id,
              },
            });
          })
        );

        // Return commits with additional info
        return commits.map((commit, index) => ({
          ...commit,
          id: cachedCommits[index]?.id,
          // Keep the changes and pullRequest from GitHub API response
        }));
      } catch (error) {
        console.error("Failed to fetch commits for project:", project.id, error);

        // Fallback to cached commits if GitHub API fails
        const cachedCommits = await ctx.db.commit.findMany({
          where: { projectId: project.id },
          orderBy: { timestamp: "desc" },
          take: input.limit,
        });

        return cachedCommits.map((commit) => ({
          sha: commit.sha,
          message: commit.message,
          author: commit.author,
          timestamp: commit.timestamp || new Date(),
          htmlUrl: `https://github.com/${project.repoOwner}/${project.repoName}/commit/${commit.sha}`,
          id: commit.id,
          changes: [],
          pullRequest: null,
        }));
      }
    }),
});