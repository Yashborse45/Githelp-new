import { Octokit } from "octokit";
// Importing the filtering helper. This creates a mild circular dependency (rag -> github for the RepoFile type
// and github -> rag for shouldIgnore) but it's safe because rag only imports the type (erased at runtime).
// If this grows, consider extracting shared filtering logic into a separate module (e.g. filter.ts).
import {
    CircuitBreaker,
    GitHubError,
    RateLimiter,
    safeExecute,
    withRetry,
    withTimeout
} from "../lib/error-handling";
import { shouldIgnore } from "./rag";

export type RepoFile = {
    path: string;
    content: string;
};

export type RepoCommit = {
    sha: string;
    message: string;
    author: string | null;
    timestamp: Date;
    htmlUrl: string;
    changes: string[];
    pullRequest?: string | null;
    stats: {
        additions: number;
        deletions: number;
        total: number;
    };
};

// Circuit breakers for different GitHub operations
const githubCircuitBreaker = new CircuitBreaker(5, 60000);
const rateLimiter = new RateLimiter(5000, 3600000); // 5000 requests per hour

/**
 * Creates an authenticated Octokit instance with error handling
 */
function createOctokit(token?: string): Octokit {
    const authToken = token || process.env.GITHUB_TOKEN;

    if (!authToken) {
        throw new GitHubError(
            'GitHub token is required but not provided',
            'MISSING_TOKEN'
        );
    }

    return new Octokit({
        auth: authToken,
        request: {
            timeout: 30000, // 30 second timeout
        }
    });
}

/**
 * Handles GitHub API errors with proper error classification
 */
function handleGitHubError(error: unknown, context: string): never {
    if (error && typeof error === 'object' && 'status' in error) {
        const githubError = error as { status: number; message?: string };

        switch (githubError.status) {
            case 401:
                throw new GitHubError(
                    'GitHub authentication failed. Please check your token.',
                    'UNAUTHORIZED',
                    401,
                    error
                );
            case 403:
                throw new GitHubError(
                    'GitHub rate limit exceeded or forbidden access.',
                    'RATE_LIMITED',
                    403,
                    error
                );
            case 404:
                throw new GitHubError(
                    'GitHub repository or resource not found.',
                    'NOT_FOUND',
                    404,
                    error
                );
            case 422:
                throw new GitHubError(
                    'GitHub API validation failed.',
                    'VALIDATION_ERROR',
                    422,
                    error
                );
            default:
                throw new GitHubError(
                    `GitHub API error in ${context}: ${githubError.message || 'Unknown error'}`,
                    'API_ERROR',
                    githubError.status,
                    error
                );
        }
    }

    if (error instanceof Error) {
        throw new GitHubError(
            `GitHub operation failed in ${context}: ${error.message}`,
            'OPERATION_ERROR',
            undefined,
            error
        );
    }

    throw new GitHubError(
        `Unknown GitHub error in ${context}`,
        'UNKNOWN_ERROR',
        undefined,
        error
    );
}

export async function listRepoFiles(owner: string, repo: string, token?: string): Promise<RepoFile[]> {
    if (!owner || !repo) {
        throw new GitHubError('Owner and repository name are required', 'INVALID_PARAMS');
    }

    return githubCircuitBreaker.execute(async () => {
        await rateLimiter.checkLimit();

        return withRetry(async () => {
            return withTimeout(async () => {
                const octokit = createOctokit(token);

                try {
                    // 1. Resolve default branch
                    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
                    const branch = repoData.default_branch || "main";

                    // 2. Recursively list tree (one network call) on that branch
                    const { data: treeData } = await octokit.rest.git.getTree({
                        owner,
                        repo,
                        tree_sha: branch,
                        recursive: "true",
                    });

                    const candidateFiles = (treeData.tree || []).filter((t: any) => t.type === "blob" && t.path);

                    const filteredFiles = candidateFiles
                        .filter((t: any) => !shouldIgnore(t.path)) // central ignore logic
                        // Fast size guard (Git tree lists size in bytes for blobs); skip huge > ~200k like ingest side.
                        .filter((t: any) => typeof t.size !== "number" || t.size <= 200_000)
                        .map((t: any) => t.path as string);

                    const results: RepoFile[] = [];

                    // Process files in batches to avoid rate limiting
                    const batchSize = 10;
                    for (let i = 0; i < filteredFiles.length; i += batchSize) {
                        const batch = filteredFiles.slice(i, i + batchSize);

                        const batchPromises = batch.map(async (path) => {
                            return safeExecute(async () => {
                                const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });

                                // fileData.content is base64 when single file. If it returns an array (e.g. directory) skip gracefully.
                                if (Array.isArray(fileData)) return null;

                                const contentEncoded = (fileData as any).content;
                                const encoding = (fileData as any).encoding || "base64";
                                let content = "";

                                if (encoding === "base64" && typeof contentEncoded === "string") {
                                    content = Buffer.from(contentEncoded, "base64").toString("utf-8");
                                } else {
                                    content = contentEncoded || "";
                                }

                                // Final guard: empty or still ignored (in case patterns change mid-run)
                                if (!content || shouldIgnore(path)) return null;

                                return { path, content };
                            }, null, `file fetch for ${path}`);
                        });

                        const batchResults = await Promise.all(batchPromises);
                        results.push(...batchResults.filter((result): result is RepoFile => result !== null));

                        // Small delay between batches to be gentle on API
                        if (i + batchSize < filteredFiles.length) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }

                    console.log(`Successfully fetched ${results.length} files from ${owner}/${repo}`);
                    return results;
                } catch (error) {
                    handleGitHubError(error, 'listRepoFiles');
                }
            }, 60000, 'GitHub file listing timed out');
        }, {
            maxRetries: 3,
            retryCondition: (error) => {
                if (error instanceof GitHubError) {
                    // Don't retry on authentication or not found errors
                    return error.statusCode !== 401 && error.statusCode !== 404;
                }
                return true;
            }
        });
    });
}

export async function getRecentCommits(owner: string, repo: string, token?: string, limit = 10): Promise<RepoCommit[]> {
    if (!owner || !repo) {
        throw new GitHubError('Owner and repository name are required', 'INVALID_PARAMS');
    }

    if (limit < 1 || limit > 100) {
        throw new GitHubError('Limit must be between 1 and 100', 'INVALID_PARAMS');
    }

    return githubCircuitBreaker.execute(async () => {
        await rateLimiter.checkLimit();

        return withRetry(async () => {
            return withTimeout(async () => {
                const octokit = createOctokit(token);

                try {
                    const { data: commits } = await octokit.rest.repos.listCommits({
                        owner,
                        repo,
                        per_page: limit,
                    });

                    // Fetch detailed information for each commit with error handling
                    const detailedCommits = await Promise.all(
                        commits.map(async (commit) => {
                            return safeExecute(async () => {
                                // Get commit details including file changes
                                const { data: commitDetail } = await octokit.rest.repos.getCommit({
                                    owner,
                                    repo,
                                    ref: commit.sha,
                                });

                                // Generate change summary from files
                                const changes = generateChangeSummary(commitDetail.files || []);

                                // Check if this is a pull request merge
                                const pullRequest = extractPullRequestFromMessage(commit.commit.message);

                                return {
                                    sha: commit.sha,
                                    message: commit.commit.message,
                                    author: commit.commit.author?.name || commit.author?.login || null,
                                    timestamp: new Date(commit.commit.author?.date || commit.commit.committer?.date || new Date()),
                                    htmlUrl: commit.html_url,
                                    changes,
                                    pullRequest,
                                    stats: {
                                        additions: commitDetail.stats?.additions || 0,
                                        deletions: commitDetail.stats?.deletions || 0,
                                        total: commitDetail.stats?.total || 0,
                                    },
                                };
                            }, {
                                // Fallback commit info if detailed fetch fails
                                sha: commit.sha,
                                message: commit.commit.message,
                                author: commit.commit.author?.name || commit.author?.login || null,
                                timestamp: new Date(commit.commit.author?.date || commit.commit.committer?.date || new Date()),
                                htmlUrl: commit.html_url,
                                changes: ['+ ' + commit.commit.message.split('\n')[0]],
                                pullRequest: extractPullRequestFromMessage(commit.commit.message),
                                stats: { additions: 0, deletions: 0, total: 0 },
                            }, `commit details for ${commit.sha}`);
                        })
                    );

                    console.log(`Successfully fetched ${detailedCommits.length} commits from ${owner}/${repo}`);
                    return detailedCommits;
                } catch (error) {
                    handleGitHubError(error, 'getRecentCommits');
                }
            }, 45000, 'GitHub commit listing timed out');
        }, {
            maxRetries: 2,
            retryCondition: (error) => {
                if (error instanceof GitHubError) {
                    // Don't retry on authentication or not found errors
                    return error.statusCode !== 401 && error.statusCode !== 404;
                }
                return true;
            }
        });
    });
}

function generateChangeSummary(files: any[]): string[] {
    const changes: string[] = [];
    const filesByType: Record<string, number> = {};
    const significantFiles: string[] = [];

    files.forEach(file => {
        const filename = file.filename;
        const extension = filename.split('.').pop()?.toLowerCase() || 'other';
        const status = file.status;

        filesByType[extension] = (filesByType[extension] || 0) + 1;

        // Track significant files (not in node_modules, dist, etc.)
        if (!filename.includes('node_modules') &&
            !filename.includes('dist/') &&
            !filename.includes('.lock') &&
            !filename.startsWith('.')) {
            significantFiles.push(filename);
        }

        // Generate specific change descriptions
        if (status === 'added') {
            if (filename.includes('component') || filename.includes('Component')) {
                changes.push(`+ Added new component: ${filename}`);
            } else if (extension === 'ts' || extension === 'tsx') {
                changes.push(`+ Added TypeScript file: ${filename}`);
            } else if (extension === 'js' || extension === 'jsx') {
                changes.push(`+ Added JavaScript file: ${filename}`);
            } else {
                changes.push(`+ Added ${filename}`);
            }
        } else if (status === 'removed') {
            changes.push(`- Removed ${filename}`);
        } else if (status === 'modified') {
            if (file.additions > file.deletions) {
                changes.push(`+ Updated ${filename} (+${file.additions} lines)`);
            } else if (file.deletions > file.additions) {
                changes.push(`- Refactored ${filename} (-${file.deletions} lines)`);
            } else {
                changes.push(`~ Modified ${filename}`);
            }
        }
    });

    // Add summary if many files changed
    if (files.length > 5) {
        const topTypes = Object.entries(filesByType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([type, count]) => `${count} ${type} file${count > 1 ? 's' : ''}`)
            .join(', ');

        changes.unshift(`+ Updated ${files.length} files (${topTypes})`);
    }

    // If no specific changes generated, create a generic one
    if (changes.length === 0) {
        changes.push(`+ Modified ${files.length} file${files.length > 1 ? 's' : ''}`);
    }

    return changes.slice(0, 4); // Limit to 4 changes for readability
}

function extractPullRequestFromMessage(message: string): string | null {
    const prMatch = message.match(/#(\d+)/) || message.match(/pull request #(\d+)/i);
    return prMatch ? `#${prMatch[1]}` : null;
}

export function getRelativeTime(dateString: Date | string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 365) {
        const years = Math.floor(diffInDays / 365);
        return `about ${years} year${years > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 30) {
        const months = Math.floor(diffInDays / 30);
        return `about ${months} month${months > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 0) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'just now';
    }
}
