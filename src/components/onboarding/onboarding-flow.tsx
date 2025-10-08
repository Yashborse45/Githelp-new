"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/trpc/react';
import { useUser } from '@clerk/nextjs';
import { ArrowRight, BookOpen, CheckCircle, Circle, MessageSquare, Rocket, Settings, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    completed: boolean;
    action?: () => void;
    autoComplete?: boolean;
}

interface OnboardingFlowProps {
    onComplete?: () => void;
    onSkip?: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Check user's progress
    const { data: projects = [] } = api.project.list.useQuery();
    const hasProjects = projects.length > 0;
    // For now, we'll check if any projects exist as a proxy for Q&A activity
    // This can be enhanced later with actual Q&A data
    const hasQA = hasProjects; // Simplified for now

    const [steps, setSteps] = useState<OnboardingStep[]>([
        {
            id: 'welcome',
            title: 'Welcome to RepoMind! 🎉',
            description: 'Let\'s get you started with AI-powered code assistance',
            icon: BookOpen,
            completed: true,
            autoComplete: true,
        },
        {
            id: 'create-project',
            title: 'Create Your First Project',
            description: 'Connect a GitHub repository to start analyzing your code',
            icon: Settings,
            completed: hasProjects,
            action: () => {
                onComplete?.();
                // Will be handled by parent component
            },
        },
        {
            id: 'ask-question',
            title: 'Ask Your First Question',
            description: 'Try asking about your code structure, patterns, or implementation',
            icon: MessageSquare,
            completed: hasQA,
        },
        {
            id: 'explore',
            title: 'Explore Advanced Features',
            description: 'Discover repository ingestion, detailed analysis, and more',
            icon: Zap,
            completed: false,
        },
    ]);

    // Update step completion based on user progress
    useEffect(() => {
        setSteps(prev => prev.map(step => ({
            ...step,
            completed: step.id === 'welcome' ? true :
                step.id === 'create-project' ? hasProjects :
                    step.id === 'ask-question' ? hasQA :
                        step.completed,
        })));
    }, [hasProjects, hasQA]);

    const completedSteps = steps.filter(step => step.completed).length;
    const progress = (completedSteps / steps.length) * 100;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        onComplete?.();
    };

    const handleSkip = () => {
        setIsVisible(false);
        onSkip?.();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl mb-2">
                        Welcome to RepoMind, {user?.firstName || 'there'}! 👋
                    </CardTitle>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">
                        {completedSteps} of {steps.length} steps completed
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Current Step */}
                    <div className="border rounded-lg p-6 bg-primary/5">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-primary/10">
                                {React.createElement(steps[currentStep]?.icon || Rocket, {
                                    className: "h-6 w-6 text-primary"
                                })}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">
                                    {steps[currentStep]?.title || "Welcome"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {steps[currentStep]?.description || "Let's get started!"}
                                </p>

                                {steps[currentStep]?.completed && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Completed
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* All Steps Overview */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Getting Started Checklist</h4>
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${index === currentStep ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                                    }`}
                            >
                                {step.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                    <p className={`text-sm ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {step.title}
                                    </p>
                                </div>
                                {index === currentStep && (
                                    <ArrowRight className="h-4 w-4 text-primary" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Connect repositories to get AI insights about your code</li>
                            <li>• Ask questions in natural language about your projects</li>
                            <li>• Use the repository ingestion feature for deeper analysis</li>
                            <li>• View Q&A history to track your learning journey</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={handleSkip}>
                            Skip Tour
                        </Button>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                >
                                    Previous
                                </Button>
                            )}
                            <Button onClick={handleNext}>
                                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Hook to manage onboarding state
export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && user) {
            // Check if user has seen onboarding
            const hasSeenOnboarding = localStorage.getItem(`onboarding-${user.id}`);
            if (!hasSeenOnboarding) {
                setShowOnboarding(true);
            }
        }
    }, [isLoaded, user]);

    const completeOnboarding = () => {
        if (user) {
            localStorage.setItem(`onboarding-${user.id}`, 'true');
        }
        setShowOnboarding(false);
    };

    const skipOnboarding = () => {
        if (user) {
            localStorage.setItem(`onboarding-${user.id}`, 'skipped');
        }
        setShowOnboarding(false);
    };

    const resetOnboarding = () => {
        if (user) {
            localStorage.removeItem(`onboarding-${user.id}`);
        }
        setShowOnboarding(true);
    };

    return {
        showOnboarding,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
    };
}
