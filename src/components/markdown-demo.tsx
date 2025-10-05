"use client";

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer, preprocessGeminiText } from '@/components/ui/markdown-renderer';
import React from 'react';

const sampleGeminiResponse = `# Welcome to Enhanced GitHelp

I'm **GitHelp AI**, your intelligent code assistant! Here's what I can help you with:

## Key Features

### 1. **Code Analysis**
- Deep understanding of your codebase
- Smart suggestions and improvements
- **Context-aware** responses

### 2. **Multiple Languages Support**
- JavaScript/TypeScript
- Python
- Java
- C++
- And many more!

### 3. **Advanced Features**
\`\`\`javascript
// Example: Smart code suggestions
function analyzeCode(input) {
  const result = processInput(input);
  return {
    suggestions: result.improvements,
    errors: result.issues,
    performance: result.metrics
  };
}
\`\`\`

## Formatting Examples

> **Note**: This is a blockquote example showing how important information is displayed.

### Lists Work Great Too!

- **Bold items** stand out
- *Italic text* for emphasis
- \`Inline code\` is highlighted
- [Links](https://github.com) are clickable

#### Numbered Lists:
1. First important point
2. Second **critical** detail
3. Final *emphasized* note

---

**Try asking me questions like:**
- "Explain this function"
- "How can I optimize this code?"
- "What are the best practices for..."

*I'm here to help make your coding experience better!*`;

export function MarkdownDemo() {
    const [showRaw, setShowRaw] = React.useState(false);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">
                    Enhanced Dark Mode & Markdown Demo
                </h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowRaw(!showRaw)}
                        className="text-sm"
                    >
                        {showRaw ? 'Show Rendered' : 'Show Raw'}
                    </Button>
                    <ThemeToggle />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        🤖 Gemini AI Response Example
                        <span className="text-sm font-normal text-muted-foreground">
                            (Enhanced formatting & dark mode support)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {showRaw ? (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border">
                            <code className="text-foreground">{sampleGeminiResponse}</code>
                        </pre>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <MarkdownRenderer
                                content={preprocessGeminiText(sampleGeminiResponse)}
                                className="max-w-none"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>🌟 Dark Mode Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-foreground">
                            ✅ **High contrast text** for better readability
                        </div>
                        <div className="text-foreground">
                            ✅ **Enhanced color scheme** with proper OKLCH values
                        </div>
                        <div className="text-foreground">
                            ✅ **Improved borders** and visual elements
                        </div>
                        <div className="text-foreground">
                            ✅ **Syntax highlighting** for code blocks
                        </div>
                        <div className="text-foreground">
                            ✅ **Proper markdown rendering** with dark mode support
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>🚀 Markdown Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-foreground">
                            ✅ **Bold text** properly rendered instead of **asterisks**
                        </div>
                        <div className="text-foreground">
                            ✅ *Italic text* formatting support
                        </div>
                        <div className="text-foreground">
                            ✅ `Inline code` highlighting
                        </div>
                        <div className="text-foreground">
                            ✅ Code blocks with syntax highlighting
                        </div>
                        <div className="text-foreground">
                            ✅ Headers, lists, and blockquotes
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>💡 Before vs After</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">❌ Before (Raw Text)</h4>
                            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded border border-red-200 dark:border-red-800">
                                <p className="text-sm font-mono text-foreground">
                                    **This is bold text** that shows as asterisks in dark mode with poor visibility.
                                </p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">✅ After (Markdown)</h4>
                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded border border-green-200 dark:border-green-800">
                                <MarkdownRenderer
                                    content="**This is bold text** that renders properly with excellent dark mode visibility!"
                                    variant="compact"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}