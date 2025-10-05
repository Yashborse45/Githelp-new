import IngestProject from "@/components/ingest-project";
import QAComponent from "@/components/qa-component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Calendar, ExternalLink, GitBranch, Github } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface ProjectPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    // Await params to fix Next.js 15 issue
    const { id } = await params;

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
        redirect("/login");
    }

    // Fetch project details
    const project = await db.project.findUnique({
        where: {
            id: id,
            ownerId: userId // Ensure user owns this project
        },
        include: {
            commits: {
                orderBy: { timestamp: "desc" },
                take: 5, // Get latest 5 commits for preview
            },
            answers: {
                orderBy: { createdAt: "desc" },
                take: 3, // Get latest 3 Q&As for preview
            },
        },
    });

    if (!project) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Back to Dashboard */}
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">
                                {project.name}
                            </h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Github className="h-4 w-4" />
                                <span>{project.repoOwner}/{project.repoName}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" asChild>
                                <Link href={project.repoUrl} target="_blank">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View on GitHub
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/projects/${project.id}/qa`}>
                                    Full Q&A Page
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Project Stats */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4" />
                            {project.commits.length} commits tracked
                        </div>
                        <Badge variant="secondary">{project.answers.length} Q&As</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Q&A Component */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ask Questions About This Project</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <QAComponent projectId={project.id} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Recent Commits */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Commits</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {project.commits.length > 0 ? (
                                    project.commits.map((commit) => (
                                        <div key={commit.id} className="border-l-2 border-primary/20 pl-3">
                                            <div className="font-medium text-sm truncate">
                                                {commit.message}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {commit.author && <span>by {commit.author} • </span>}
                                                {commit.timestamp && (
                                                    <time>
                                                        {new Date(commit.timestamp).toLocaleDateString()}
                                                    </time>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No commits found yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Repository Knowledge Base */}
                        <IngestProject projectId={project.id} />

                        {/* Recent Q&As Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Questions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {project.answers.length > 0 ? (
                                    project.answers.map((answer) => (
                                        <div key={answer.id} className="border-b border-border pb-2 last:border-b-0">
                                            <div className="font-medium text-sm text-primary mb-1">
                                                {answer.question.length > 60
                                                    ? `${answer.question.substring(0, 60)}...`
                                                    : answer.question}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(answer.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No questions asked yet. Ask your first question!
                                    </p>
                                )}
                                {project.answers.length > 0 && (
                                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                                        <Link href={`/projects/${project.id}/qa`}>
                                            View All Q&As
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Project Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Project Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Repository:</span>
                                    <Link
                                        href={project.repoUrl}
                                        target="_blank"
                                        className="ml-2 text-primary hover:underline"
                                    >
                                        {project.repoOwner}/{project.repoName}
                                    </Link>
                                </div>
                                <div>
                                    <span className="font-medium">Created:</span>
                                    <span className="ml-2">
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Last Updated:</span>
                                    <span className="ml-2">
                                        {new Date(project.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}