import QAComponent from "@/components/qa-component";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface ProjectQAPageProps {
    params: {
        id: string;
    };
}

export default async function ProjectQAPage({ params }: ProjectQAPageProps) {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
        redirect("/login");
    }

    // Fetch project to verify it exists and user has access
    const project = await db.project.findUnique({
        where: {
            id: params.id,
            ownerId: userId // Ensure user owns this project
        },
        select: {
            id: true,
            name: true,
            repoUrl: true,
            repoOwner: true,
            repoName: true,
        },
    });

    if (!project) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/projects/${params.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Project
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Q&A for {project.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Repository: {project.repoOwner}/{project.repoName}
                        </p>
                    </div>
                </div>

                {/* Q&A Component */}
                <QAComponent projectId={project.id} />
            </div>
        </div>
    );
}