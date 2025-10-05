"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ProjectQANavigationProps {
    projectId: string;
    projectName: string;
    qaCount?: number;
}

export default function ProjectQANavigation({
    projectId,
    projectName,
    qaCount = 0
}: ProjectQANavigationProps) {
    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Q&A for {projectName}
                    {qaCount > 0 && <Badge variant="secondary">{qaCount} questions</Badge>}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Ask questions about your project and get AI-powered answers with source citations.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild className="flex items-center gap-2">
                        <Link href={`/projects/${projectId}`}>
                            <ExternalLink className="h-4 w-4" />
                            Project Overview
                        </Link>
                    </Button>

                    <Button variant="outline" asChild className="flex items-center gap-2">
                        <Link href={`/projects/${projectId}/qa`}>
                            <MessageCircle className="h-4 w-4" />
                            Dedicated Q&A
                        </Link>
                    </Button>
                </div>

                {qaCount === 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        💡 Tip: Start by asking about the project structure, main features, or how specific components work.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}