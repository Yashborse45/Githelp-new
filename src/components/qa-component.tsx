"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askQuestion, getQAHistory, type Citation } from "@/lib/ask-api";
import { Bot, Loader2, MessageCircle, Send, User } from "lucide-react";
import { useEffect, useState } from "react";

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
    const [isTyping, setIsTyping] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [pendingAnswer, setPendingAnswer] = useState<QAItem | null>(null);

    // Load Q&A history on component mount and when project changes
    useEffect(() => {
        // Clear previous state when project changes
        setQAHistory([]);
        setQuestion("");
        setError(null);
        setIsTyping(false);
        setCurrentAnswer("");
        setPendingAnswer(null);
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

    // Typing effect for answers - slower and more realistic
    const typeAnswer = (answer: string, qaItem: QAItem) => {
        setIsTyping(true);
        setCurrentAnswer("");
        setPendingAnswer(qaItem);

        let index = 0;
        const typeSpeed = 20; // Slower typing for better UX

        const timer = setInterval(() => {
            if (index < answer.length) {
                setCurrentAnswer(prev => prev + answer[index]);
                index++;
            } else {
                clearInterval(timer);
                // Small delay before finishing typing animation
                setTimeout(() => {
                    setIsTyping(false);
                    // Add the complete answer to history with animation
                    setQAHistory(prev => [qaItem, ...prev]);
                    setPendingAnswer(null);
                    setCurrentAnswer("");
                }, 500);
            }
        }, typeSpeed);
    };

    const handleAskQuestion = async () => {
        if (!question.trim()) return;

        setIsLoading(true);
        setError(null);

        // Clear any ongoing typing animation
        setIsTyping(false);
        setCurrentAnswer("");
        setPendingAnswer(null);

        try {
            const result = await askQuestion(projectId, question);

            if (result.success) {
                setQuestion(""); // Clear the input
                setIsLoading(false);

                // Start typing animation for the answer
                typeAnswer(result.data.answer, result.data);
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Ask a Question
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
                            disabled={!question.trim() || isLoading || isTyping}
                            className="flex items-center gap-2 min-w-[100px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="animate-pulse">Thinking...</span>
                                </>
                            ) : isTyping ? (
                                <>
                                    <Bot className="h-4 w-4 animate-pulse" />
                                    <span className="animate-pulse">Typing...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Ask
                                </>
                            )}
                        </Button>
                    </div>
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md animate-slide-in">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg animate-slide-in">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <div className="flex-1">
                                    <p className="text-blue-800 font-medium">AI is analyzing your question...</p>
                                    <div className="flex gap-1 mt-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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

                {/* Show pending answer with typing animation */}
                {pendingAnswer && (
                    <Card className="border-l-4 border-l-blue-500 animate-in slide-in-from-bottom-5 duration-500">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {/* Question */}
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 mt-1 text-blue-600" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-700 mb-2">You asked:</h4>
                                        <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{pendingAnswer.question}</p>
                                    </div>
                                </div>

                                {/* Typing Answer */}
                                <div className="flex items-start gap-3">
                                    <Bot className="h-5 w-5 mt-1 text-green-600 animate-pulse" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                                            AI Assistant
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                                                typing...
                                            </span>
                                        </h4>
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {currentAnswer}
                                                <span className="inline-block w-0.5 h-5 bg-green-600 ml-1 animate-pulse"></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Existing Q&A History */}
                {qaHistory.length === 0 && !pendingAnswer ? (
                    <Card>
                        <CardContent className="text-center py-8 text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No questions asked yet. Ask your first question above!</p>
                        </CardContent>
                    </Card>
                ) : (
                    qaHistory.map((qa, index) => (
                        <Card
                            key={qa.id}
                            className="border-l-4 border-l-gray-300 animate-in slide-in-from-bottom-5 duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {/* Question */}
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 mt-1 text-blue-600" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-blue-700 mb-2">You asked:</h4>
                                            <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{qa.question}</p>
                                        </div>
                                    </div>

                                    {/* Answer */}
                                    <div className="flex items-start gap-3">
                                        <Bot className="h-5 w-5 mt-1 text-green-600" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-green-700 mb-2">AI Assistant:</h4>
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="text-gray-700 whitespace-pre-wrap">{qa.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Citations */}
                                    {qa.citations && qa.citations.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-2">Sources:</h4>
                                            <div className="space-y-2">
                                                {qa.citations.map((citation, index) => (
                                                    <div
                                                        key={index}
                                                        className="text-sm bg-gray-50 p-2 rounded border-l-2 border-gray-300"
                                                    >
                                                        <div className="font-mono text-xs text-blue-600 mb-1">
                                                            {citation.path}
                                                        </div>
                                                        {citation.excerpt && (
                                                            <div className="text-gray-600 text-xs truncate">
                                                                {citation.excerpt}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div className="text-xs text-gray-500 border-t pt-2">
                                        Asked on {new Date(qa.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}