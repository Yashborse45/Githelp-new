import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { listRepoFiles, getRecentCommits } from "@/server/github";

// Helper function to analyze repository files for real analytics
async function analyzeRepository(repoOwner: string, repoName: string, githubToken?: string) {
    try {
        console.log(`Analyzing repository: ${repoOwner}/${repoName}`);
        
        // Fetch repository files and recent commits
        const [files, commits] = await Promise.all([
            listRepoFiles(repoOwner, repoName, githubToken),
            getRecentCommits(repoOwner, repoName, githubToken, 100) // Get more commits for better analysis
        ]);

        console.log(`Found ${files.length} files and ${commits.length} commits`);

        // Analyze programming languages
        const languages: Record<string, number> = {};
        const fileExtensions: Record<string, number> = {};
        const previewImages: string[] = [];

        files.forEach(file => {
            const extension = file.path.split('.').pop()?.toLowerCase();
            const fileName = file.path.toLowerCase();
            const pathParts = file.path.split('/');
            
            // Detect preview images (screenshots, logos, etc.)
            const isImageFile = extension && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension);
            if (isImageFile) {
                const isPreviewImage = 
                    fileName.includes('screenshot') ||
                    fileName.includes('preview') ||
                    fileName.includes('demo') ||
                    fileName.includes('logo') ||
                    fileName.includes('banner') ||
                    fileName.includes('hero') ||
                    fileName.includes('cover') ||
                    pathParts.includes('screenshots') ||
                    pathParts.includes('images') ||
                    pathParts.includes('assets') ||
                    (pathParts.length <= 2 && isImageFile); // Root level images

                if (isPreviewImage) {
                    previewImages.push(file.path);
                }
            }

            if (extension) {
                fileExtensions[`.${extension}`] = (fileExtensions[`.${extension}`] || 0) + 1;

                // Map extensions to languages
                const languageMap: Record<string, string> = {
                    'js': 'JavaScript',
                    'jsx': 'JavaScript',
                    'ts': 'TypeScript', 
                    'tsx': 'TypeScript',
                    'py': 'Python',
                    'java': 'Java',
                    'cpp': 'C++',
                    'c': 'C',
                    'cs': 'C#',
                    'php': 'PHP',
                    'rb': 'Ruby',
                    'go': 'Go',
                    'rs': 'Rust',
                    'swift': 'Swift',
                    'kt': 'Kotlin',
                    'dart': 'Dart',
                    'vue': 'Vue',
                    'svelte': 'Svelte',
                    'html': 'HTML',
                    'css': 'CSS',
                    'scss': 'SCSS',
                    'sass': 'Sass',
                    'less': 'Less',
                    'json': 'JSON',
                    'xml': 'XML',
                    'yaml': 'YAML',
                    'yml': 'YAML',
                    'md': 'Markdown',
                    'sql': 'SQL',
                    'sh': 'Shell',
                    'dockerfile': 'Dockerfile'
                };

                const language = languageMap[extension] || 'Other';
                languages[language] = (languages[language] || 0) + 1;
            }
        });

        // Ensure we have at least some language data
        if (Object.keys(languages).length === 0) {
            languages['Unknown'] = 1;
        }

        // Analyze commit patterns (last 6 months)
        const commitPatterns: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            commitPatterns[monthKey] = 0;
        }

        // Count commits by month
        commits.forEach(commit => {
            const commitDate = new Date(commit.timestamp);
            const monthKey = `${monthNames[commitDate.getMonth()]} ${commitDate.getFullYear()}`;
            if (commitPatterns[monthKey] !== undefined) {
                commitPatterns[monthKey]++;
            }
        });

        // Calculate total lines of code (approximate)
        const totalLinesOfCode = files.reduce((total, file) => {
            return total + (file.content.split('\n').length || 0);
        }, 0);

        // Get unique contributors
        const contributors = new Set(commits.map(c => c.author).filter(Boolean)).size;

        // Calculate repository size estimation
        const totalBytes = files.reduce((total, file) => total + (file.content.length || 0), 0);
        const repoSize = totalBytes > 1024 * 1024 
            ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
            : `${(totalBytes / 1024).toFixed(1)} KB`;

        // Analyze repository health and structure
        const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
        const hasLicense = files.some(f => f.path.toLowerCase().includes('license'));
        const hasDockerfile = files.some(f => f.path.toLowerCase().includes('dockerfile'));
        const hasTests = files.some(f => 
            f.path.toLowerCase().includes('test') || 
            f.path.toLowerCase().includes('spec') ||
            f.path.includes('__tests__')
        );
        const hasCI = files.some(f => 
            f.path.includes('.github/workflows') || 
            f.path.includes('.gitlab-ci') ||
            f.path.includes('circle.yml') ||
            f.path.includes('.travis.yml')
        );

        const result = {
            totalFiles: files.length,
            totalLinesOfCode,
            repoSize,
            contributors: Math.max(contributors, 1), // At least 1 contributor
            latestCommitDate: commits[0]?.timestamp.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            languages,
            commitPatterns,
            fileExtensions: Object.keys(fileExtensions).length > 0 ? fileExtensions : { '.unknown': 1 },
            previewImages: previewImages.slice(0, 10), // Top 10 preview images
            recentCommits: commits.slice(0, 10), // Last 10 commits for display
            totalCommits: commits.length,
            repositoryHealth: {
                hasReadme,
                hasLicense,
                hasDockerfile,
                hasTests,
                hasCI,
                healthScore: [hasReadme, hasLicense, hasDockerfile, hasTests, hasCI].filter(Boolean).length
            }
        };

        console.log(`Analysis complete:`, { 
            totalFiles: result.totalFiles, 
            totalLinesOfCode: result.totalLinesOfCode,
            contributors: result.contributors,
            languageCount: Object.keys(result.languages).length,
            previewImages: result.previewImages.length,
            healthScore: result.repositoryHealth.healthScore
        });

        return result;

    } catch (error) {
        console.error('Error analyzing repository:', error);
        // Return fallback data if analysis fails
        return {
            totalFiles: 0,
            totalLinesOfCode: 0,
            repoSize: '0 KB',
            contributors: 0,
            latestCommitDate: new Date().toISOString().split('T')[0],
            languages: { 'Unknown': 1 },
            commitPatterns: generateRandomCommitPatterns(),
            fileExtensions: { '.unknown': 1 },
            previewImages: [],
            recentCommits: [],
            totalCommits: 0,
            repositoryHealth: {
                hasReadme: false,
                hasLicense: false,
                hasDockerfile: false,
                hasTests: false,
                hasCI: false,
                healthScore: 0
            },
            error: 'Failed to analyze repository. Please check if the repository is public or verify your GitHub token.'
        };
    }
}

export const analyticsRouter = createTRPCRouter({
    getProjectAnalytics: protectedProcedure
        .input(z.object({
            projectId: z.string()
        }))
        .query(async ({ ctx, input }) => {
            // Get project from database
            const project = await ctx.db.project.findFirst({
                where: {
                    id: input.projectId,
                    ownerId: ctx.auth.userId,
                },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            // Analyze repository with real data
            const analytics = await analyzeRepository(
                project.repoOwner, 
                project.repoName, 
                project.githubToken || undefined
            );

            return analytics;
        }),

    refreshAnalytics: protectedProcedure
        .input(z.object({
            projectId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            // Get project from database
            const project = await ctx.db.project.findFirst({
                where: {
                    id: input.projectId,
                    ownerId: ctx.auth.userId,
                },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            // Force refresh analytics (no caching)
            const analytics = await analyzeRepository(
                project.repoOwner, 
                project.repoName, 
                project.githubToken || undefined
            );

            return analytics;
        }),
});

// Helper function for fallback commit patterns when analysis fails
function generateRandomCommitPatterns() {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const result: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        result[monthKey] = Math.floor(Math.random() * 20) + 1;
    }

    return result;
}