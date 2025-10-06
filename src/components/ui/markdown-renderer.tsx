"use client";

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
    variant?: 'default' | 'compact';
}

export function MarkdownRenderer({
    content,
    className,
    variant = 'default'
}: MarkdownRendererProps) {
    return (
        <div className={cn(
            "prose prose-sm max-w-none dark:prose-invert",
            variant === 'compact' && "prose-xs",
            "prose-headings:text-foreground",
            "prose-p:text-foreground prose-p:leading-relaxed prose-p:break-words",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-em:text-foreground",
            "prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:break-all",
            "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto",
            "prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:bg-muted/50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic",
            "prose-ul:text-foreground prose-ol:text-foreground",
            "prose-li:text-foreground prose-li:leading-relaxed prose-li:break-words",
            "prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80 prose-a:break-all",
            "prose-hr:border-border",
            "break-words overflow-wrap-anywhere",
            // Dark mode specific enhancements
            "dark:prose-headings:text-foreground",
            "dark:prose-p:text-foreground",
            "dark:prose-strong:text-foreground",
            "dark:prose-code:bg-muted dark:prose-code:text-foreground",
            "dark:prose-pre:bg-muted dark:prose-pre:border-border",
            "dark:prose-blockquote:border-accent dark:prose-blockquote:bg-muted/30",
            "dark:prose-a:text-primary",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom components for better styling
                    h1: ({ children, ...props }) => (
                        <h1 className="text-2xl font-bold mb-4 text-foreground" {...props}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 className="text-xl font-semibold mb-3 text-foreground" {...props}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 className="text-lg font-medium mb-2 text-foreground" {...props}>
                            {children}
                        </h3>
                    ),
                    p: ({ children, ...props }) => (
                        <p className="text-foreground leading-relaxed mb-3" {...props}>
                            {children}
                        </p>
                    ),
                    strong: ({ children, ...props }) => (
                        <strong className="font-semibold text-foreground" {...props}>
                            {children}
                        </strong>
                    ),
                    em: ({ children, ...props }) => (
                        <em className="italic text-foreground" {...props}>
                            {children}
                        </em>
                    ),
                    code: ({ children, className, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code
                                    className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children, ...props }) => (
                        <pre
                            className="bg-muted border border-border rounded p-4 overflow-x-auto mb-4"
                            {...props}
                        >
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children, ...props }) => (
                        <blockquote
                            className="border-l-4 border-accent bg-muted/50 pl-4 py-2 italic mb-4"
                            {...props}
                        >
                            {children}
                        </blockquote>
                    ),
                    ul: ({ children, ...props }) => (
                        <ul className="list-disc list-inside mb-4 text-foreground space-y-1" {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol className="list-decimal list-inside mb-4 text-foreground space-y-1" {...props}>
                            {children}
                        </ol>
                    ),
                    li: ({ children, ...props }) => (
                        <li className="text-foreground leading-relaxed" {...props}>
                            {children}
                        </li>
                    ),
                    a: ({ children, href, ...props }) => (
                        <a
                            href={href}
                            className="text-primary underline hover:text-primary/80 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                    hr: ({ ...props }) => (
                        <hr className="border-border my-6" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

// Utility function to preprocess Gemini response text
export function preprocessGeminiText(text: string): string {
    // Fix common Gemini formatting issues
    return text
        // Ensure proper line breaks for lists
        .replace(/\n\*/g, '\n\n*')
        // Ensure proper spacing around headers
        .replace(/\n(#{1,6})/g, '\n\n$1')
        // Fix bold text spacing
        .replace(/\*\*([^*]+)\*\*/g, '**$1**')
        // Ensure proper spacing around code blocks
        .replace(/\n```/g, '\n\n```')
        .replace(/```\n/g, '```\n\n')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}