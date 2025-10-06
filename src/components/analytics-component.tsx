"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import {
    Activity,
    BarChart3,
    Calendar,
    FileText,
    HardDrive,
    PieChart,
    RefreshCw,
    TrendingUp,
    Users
} from "lucide-react";
import { useState } from "react";

interface AnalyticsProps {
    selectedProject: string | null;
}

export default function AnalyticsComponent({ selectedProject }: AnalyticsProps) {
    const [selectedChart, setSelectedChart] = useState<"languages" | "commits" | "files">("languages");

    // Fetch analytics data using tRPC
    const {
        data: analyticsData,
        isLoading,
        error,
        refetch
    } = api.analytics.getProjectAnalytics.useQuery(
        { projectId: selectedProject! },
        {
            enabled: !!selectedProject,
            staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        }
    );

    // Refresh analytics mutation
    const refreshMutation = api.analytics.refreshAnalytics.useMutation({
        onSuccess: () => {
            void refetch();
        },
    });

    const handleRefresh = () => {
        if (selectedProject) {
            refreshMutation.mutate({ projectId: selectedProject });
        }
    };

    // Create language distribution visualization
    const LanguageChart = () => {
        if (!analyticsData) return null;
        const total = Object.values(analyticsData.languages).reduce((sum, count) => sum + count, 0);
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

        return (
            <div className="space-y-4">
                {Object.entries(analyticsData.languages).map(([language, count], index) => {
                    const percentage = (count / total) * 100;
                    return (
                        <div key={language} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span className="text-sm font-medium">{language}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {count} files ({percentage.toFixed(1)}%)
                                </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                        </div>
                    );
                })}
            </div>
        );
    };

    // Create commit timeline visualization
    const CommitChart = () => {
        if (!analyticsData) return null;
        const months = Object.keys(analyticsData.commitPatterns);
        const commits = Object.values(analyticsData.commitPatterns);
        const maxCommits = Math.max(...commits);

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {months.map((month, index) => {
                        const count = commits[index] || 0;
                        const height = (count / maxCommits) * 100;

                        return (
                            <div key={month} className="text-center space-y-2">
                                <div className="h-32 flex items-end justify-center">
                                    <div
                                        className="bg-primary rounded-t-md w-12 transition-all duration-300 hover:bg-primary/80"
                                        style={{ height: `${height}%`, minHeight: '8px' }}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground">{month}</div>
                                <div className="text-sm font-medium">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Create file types visualization
    const FileTypesChart = () => {
        if (!analyticsData) return null;
        const extensions = Object.entries(analyticsData.fileExtensions);
        const maxCount = Math.max(...Object.values(analyticsData.fileExtensions));

        return (
            <div className="space-y-3">
                {extensions.map(([ext, count]) => {
                    const percentage = (count / maxCount) * 100;
                    return (
                        <div key={ext} className="flex items-center gap-4">
                            <div className="w-16 text-sm font-mono text-muted-foreground">{ext}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="h-6 bg-primary rounded-md" style={{ width: `${percentage}%` }} />
                                    <span className="text-sm text-muted-foreground ml-2">{count}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const getCurrentVisualization = () => {
        switch (selectedChart) {
            case "languages":
                return <LanguageChart />;
            case "commits":
                return <CommitChart />;
            case "files":
                return <FileTypesChart />;
            default:
                return <LanguageChart />;
        }
    };

    if (!selectedProject) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <Card>
                    <CardContent className="text-center py-12">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Project Selected</h3>
                        <p className="text-muted-foreground">
                            Please select a project from the sidebar to view detailed analytics and insights.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <Card>
                    <CardContent className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-foreground mb-2">Loading Analytics</h3>
                        <p className="text-muted-foreground">
                            Analyzing repository data and generating insights...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <Card>
                    <CardContent className="text-center py-12">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Analytics</h3>
                        <p className="text-muted-foreground mb-4">
                            {error.message || "Failed to load analytics data"}
                        </p>
                        <Button onClick={handleRefresh} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show no data state
    if (!analyticsData) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <Card>
                    <CardContent className="text-center py-12">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Analytics Data</h3>
                        <p className="text-muted-foreground">
                            No analytics data available for this project.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Project Analytics
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Comprehensive insights and visualizations for your repository
                    </p>
                </div>

                {/* Chart Selection and Refresh */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshMutation.isPending || isLoading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                        {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
                    </Button>

                    <span className="text-sm text-muted-foreground">View:</span>
                    <Select value={selectedChart} onValueChange={(value: "languages" | "commits" | "files") => setSelectedChart(value)}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="languages">
                                <div className="flex items-center gap-2">
                                    <PieChart className="h-4 w-4" />
                                    Language Distribution
                                </div>
                            </SelectItem>
                            <SelectItem value="commits">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Commit Timeline
                                </div>
                            </SelectItem>
                            <SelectItem value="files">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    File Types
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Key Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Total Files
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{analyticsData.totalFiles}</div>
                        <Badge variant="secondary" className="mt-2">
                            Excluding .git
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Lines of Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {analyticsData.totalLinesOfCode?.toLocaleString() || 'N/A'}
                        </div>
                        <Badge variant="secondary" className="mt-2">
                            Total LOC
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Repository Size
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{analyticsData.repoSize}</div>
                        <Badge variant="secondary" className="mt-2">
                            Estimated
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Contributors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{analyticsData.contributors}</div>
                        <Badge variant="secondary" className="mt-2">
                            Unique authors
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Latest Commit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {analyticsData.latestCommitDate
                                ? new Date(analyticsData.latestCommitDate).toLocaleDateString()
                                : 'No commits yet'
                            }
                        </div>
                        <Badge variant="secondary" className="mt-2">
                            Last activity
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Main Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Interactive Visualization
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading analytics data...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full min-h-[400px] flex items-center justify-center">
                            {getCurrentVisualization()}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Repository Health Score */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Repository Health Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-medium">Overall Health Score</span>
                                <Badge variant={analyticsData.repositoryHealth?.healthScore >= 4 ? "default" : analyticsData.repositoryHealth?.healthScore >= 2 ? "secondary" : "destructive"}>
                                    {analyticsData.repositoryHealth?.healthScore || 0}/5
                                </Badge>
                            </div>
                            <Progress value={(analyticsData.repositoryHealth?.healthScore || 0) * 20} className="h-3" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                {analyticsData.repositoryHealth?.hasReadme ?
                                    <Badge variant="default" className="text-xs">✓</Badge> :
                                    <Badge variant="secondary" className="text-xs">✗</Badge>
                                }
                                <span className="text-sm">README</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {analyticsData.repositoryHealth?.hasLicense ?
                                    <Badge variant="default" className="text-xs">✓</Badge> :
                                    <Badge variant="secondary" className="text-xs">✗</Badge>
                                }
                                <span className="text-sm">License</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {analyticsData.repositoryHealth?.hasTests ?
                                    <Badge variant="default" className="text-xs">✓</Badge> :
                                    <Badge variant="secondary" className="text-xs">✗</Badge>
                                }
                                <span className="text-sm">Tests</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {analyticsData.repositoryHealth?.hasCI ?
                                    <Badge variant="default" className="text-xs">✓</Badge> :
                                    <Badge variant="secondary" className="text-xs">✗</Badge>
                                }
                                <span className="text-sm">CI/CD</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {analyticsData.repositoryHealth?.hasDockerfile ?
                                    <Badge variant="default" className="text-xs">✓</Badge> :
                                    <Badge variant="secondary" className="text-xs">✗</Badge>
                                }
                                <span className="text-sm">Docker</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Project Preview Images */}
            {analyticsData.previewImages && analyticsData.previewImages.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Project Preview Images
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {analyticsData.previewImages.slice(0, 8).map((imagePath, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                        <div className="text-center">
                                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Preview Image</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate" title={imagePath}>
                                        {imagePath.split('/').pop()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {analyticsData.previewImages.length > 8 && (
                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                +{analyticsData.previewImages.length - 8} more preview images found
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}