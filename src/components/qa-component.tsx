"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer, preprocessGeminiText } from "@/components/ui/markdown-renderer";
import { Textarea } from "@/components/ui/textarea";
import { askQuestion, getQAHistory, type Citation } from "@/lib/ask-api";
import { Bot, Cloud, Loader2, MessageCircle, Send, User } from "lucide-react";
import { useEffect, useState } from "react";
import CodeReferences from "./code-references";

interface QAComponentProps {
    projectId: string;
}

interface QAItem {
    id: string;
    question: string;
    answer: string;
    citations: Citation[];
    createdAt: string;
}

export default function QAComponent({ projectId }: QAComponentProps) {
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [qaHistory, setQAHistory] = useState<QAItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Load Q&A history on component mount and when project changes
    useEffect(() => {
        // Clear previous state when project changes
        setQAHistory([]);
        setQuestion("");
        setError(null);
        loadQAHistory();
    }, [projectId]);

    const loadQAHistory = async () => {
        const result = await getQAHistory(projectId);
        if (result.success) {
            setQAHistory(result.data);
        } else {
            setError(result.error);
        }
    };

    const handleAskQuestion = async () => {
        if (!question.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Use Gemini for all questions
            const result = await askQuestion(projectId, question);

            if (result.success) {
                setQuestion(""); // Clear the input
                setIsLoading(false);

                // Show answer immediately without typing animation
                setQAHistory(prev => [result.data, ...prev]);
            } else {
                setError(result.error);
                setIsLoading(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            handleAskQuestion();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Question Input */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Ask a Question
                        <Badge variant="secondary" className="ml-2">
                            <Cloud className="h-3 w-3 mr-1" />
                            Powered by Gemini AI
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Ask anything about this project... (Ctrl+Enter to send)"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={3}
                        className="resize-none"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                            Press Ctrl+Enter to send
                        </span>
                        <Button
                            onClick={handleAskQuestion}
                            disabled={!question.trim() || isLoading}
                            className="flex items-center gap-2 min-w-[100px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="animate-pulse">Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Send
                                </>
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg animate-slide-in">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                                <div className="flex-1">
                                    <p className="text-blue-800 dark:text-blue-200 font-medium">AI is analyzing your question...</p>
                                    <div className="flex gap-1 mt-2">
                                        <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Q&A History */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Conversation</h3>

                {/* Existing Q&A History */}
                {qaHistory.length === 0 ? (
                    <Card className="w-full">
                        <CardContent className="text-center py-8 text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-foreground">No questions asked yet. Ask your first question above!</p>
                        </CardContent>
                    </Card>
                ) : (
                    qaHistory.map((qa, index) => (
                        <Card
                            key={qa.id}
                            className="border-l-4 border-l-gray-300 animate-in slide-in-from-bottom-5 duration-300 w-full"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {/* Question */}
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 mt-1 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">You asked:</h4>
                                            <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 break-words overflow-wrap-anywhere max-w-full">{qa.question}</p>
                                        </div>
                                    </div>

                                    {/* Answer */}
                                    <div className="flex items-start gap-3">
                                        <Bot className="h-5 w-5 mt-1 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">AI Assistant:</h4>
                                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800 overflow-x-auto">
                                                <MarkdownRenderer
                                                    content={preprocessGeminiText(qa.answer)}
                                                    variant="compact"
                                                    className="break-words max-w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Code References */}
                                    {qa.citations && qa.citations.length > 0 && (
                                        <CodeReferences citations={qa.citations} />
                                    )}

                                    {/* Timestamp */}
                                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                                        Asked on {new Date(qa.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div >
    );
}