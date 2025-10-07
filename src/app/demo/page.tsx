import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Code, GitBranch, MessageSquare, Plus, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GitBranch className="h-6 w-6" />
                            <span className="text-xl font-bold">GitHelp</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost">Home</Button>
                            </Link>
                            <Link href="/login">
                                <Button>Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">How to Use GitHelp</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Learn how to leverage AI-powered code understanding to get instant answers about your repositories
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1 */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                                    1
                                </div>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Create a Project
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Start by connecting your GitHub repository to GitHelp. The AI will analyze your codebase and create a searchable knowledge base.
                            </p>
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">What happens during project creation:</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Repository code is fetched and analyzed</li>
                                    <li>• Files are processed and indexed using AI embeddings</li>
                                    <li>• Code structure and dependencies are mapped</li>
                                    <li>• Project becomes ready for intelligent Q&A</li>
                                </ul>
                            </div>
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <Zap className="h-3 w-3" />
                                Takes 2-3 minutes for most repositories
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Step 2 */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                                    2
                                </div>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Ask Questions About Your Code
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Use natural language to ask questions about your codebase. Get instant, context-aware answers with relevant code snippets.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-muted p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">Example Questions:</h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• "How does user authentication work?"</li>
                                        <li>• "What APIs are available in this project?"</li>
                                        <li>• "How is the database schema structured?"</li>
                                        <li>• "Where is error handling implemented?"</li>
                                        <li>• "How do I add a new feature?"</li>
                                    </ul>
                                </div>
                                <div className="bg-muted p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">AI-Powered Features:</h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• Context-aware responses</li>
                                        <li>• Relevant code snippets included</li>
                                        <li>• File references with syntax highlighting</li>
                                        <li>• Cross-file relationship understanding</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 3 */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                                    3
                                </div>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    View Code References
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Every answer includes relevant code snippets with syntax highlighting and file references, making it easy to understand the context.
                            </p>
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Code Reference Features:</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Syntax-highlighted code snippets</li>
                                    <li>• File path and line number references</li>
                                    <li>• Expandable/collapsible code blocks</li>
                                    <li>• Multiple file tabs for complex answers</li>
                                    <li>• Jump to specific code chunks</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 4 */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                                    4
                                </div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Track Analytics
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Monitor your project's Q&A activity, popular questions, and usage patterns through comprehensive analytics.
                            </p>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-muted p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-primary mb-1">156</div>
                                    <div className="text-sm text-muted-foreground">Total Questions</div>
                                </div>
                                <div className="bg-muted p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-primary mb-1">23</div>
                                    <div className="text-sm text-muted-foreground">Files Referenced</div>
                                </div>
                                <div className="bg-muted p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-primary mb-1">89%</div>
                                    <div className="text-sm text-muted-foreground">Answer Accuracy</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA Section */}
                <div className="text-center mt-12">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="py-8">
                            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Create your first project and start getting AI-powered insights about your codebase in minutes.
                            </p>
                            <Link href="/register">
                                <Button size="lg" className="mr-4">
                                    Create Account
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg">
                                    Sign In
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}