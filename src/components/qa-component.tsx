"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer, preprocessGeminiText } from "@/components/ui/markdown-renderer";
import { Textarea } from "@/components/ui/textarea";
import { askQuestion, getQAHistory, type Citation } from "@/lib/ask-api";
import { Bot, Cloud, Loader2, MessageCircle, Send, User, X } from "lucide-react";
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
    const [showAnswerPopup, setShowAnswerPopup] = useState(false);
    const [latestAnswer, setLatestAnswer] = useState<QAItem | null>(null);

    // Load Q&A history on component mount and when project changes
    useEffect(() => {
        // Clear previous state when project changes
        setQAHistory([]);
        setQuestion("");
        setError(null);
        loadQAHistory();
    }, [projectId]);

    // Handle Escape key to close popup
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showAnswerPopup) {
                setShowAnswerPopup(false);
            }
        };

        if (showAnswerPopup) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when popup is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [showAnswerPopup]);

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

                // Show answer immediately in popup
                setLatestAnswer(result.data);
                setShowAnswerPopup(true);
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
            {/* Answer Popup Modal */}
            {showAnswerPopup && latestAnswer && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setShowAnswerPopup(false)}
                    />

                    {/* Popup Card */}
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-10 pointer-events-none overflow-y-auto">
                        <Card className="w-full max-w-5xl max-h-[calc(100vh-5rem)] overflow-y-auto pointer-events-auto animate-in slide-in-from-top-10 duration-300 shadow-2xl border-2 my-auto">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-b sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Bot className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 animate-pulse" />
                                        <CardTitle className="text-green-700 dark:text-green-400 text-lg">AI Response Ready! </CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowAnswerPopup(false)}
                                        className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0"
                                        title="Close (Esc)"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6 space-y-6 pb-6">
                                {/* Question */}
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 mt-1 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 text-sm">Your Question:</h4>
                                        <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 break-words text-sm">
                                            {latestAnswer.question}
                                        </p>
                                    </div>
                                </div>

                                {/* Answer */}
                                <div className="flex items-start gap-3">
                                    <Bot className="h-5 w-5 mt-1 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 text-sm">AI Answer:</h4>
                                        <div className="bg-green-50 dark:bg-green-950/30 p-5 rounded-lg border border-green-200 dark:border-green-800">
                                            <MarkdownRenderer
                                                content={preprocessGeminiText(latestAnswer.answer)}
                                                variant="compact"
                                                className="break-words text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Code References - Always show if available */}
                                {latestAnswer.citations && latestAnswer.citations.length > 0 && (
                                    <div className="animate-in slide-in-from-bottom-5 duration-300 border-t pt-6">
                                        <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2 text-sm">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                            Referenced Files ({latestAnswer.citations.length})
                                        </h4>
                                        <CodeReferences citations={latestAnswer.citations} />
                                    </div>
                                )}

                                {/* Close Button at Bottom */}
                                <div className="flex justify-end pt-4 border-t gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAnswerPopup(false)}
                                        className="text-sm"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => setShowAnswerPopup(false)}
                                        className="bg-primary hover:bg-primary/90 text-sm"
                                    >
                                        Got it, thanks! 👍
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

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
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            💡 <strong>Pro Tip:</strong> For best results, include "in this repo" or "in this project" in your questions
                            <br />
                            <span className="text-[10px] mt-1 block opacity-80">Example: "How does authentication work <strong>in this repo</strong>?"</span>
                        </p>
                    </div>
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