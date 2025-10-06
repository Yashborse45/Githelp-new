"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Citation } from "@/lib/ask-api";
import { Code2, Database, File, FileCode, FileImage, FileText, Settings } from "lucide-react";
import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";

// Simple dark theme style object to avoid import issues
const darkStyle = {
    'code[class*="language-"]': {
        color: '#ccc',
        background: 'none',
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '1em',
        textAlign: 'left' as const,
        whiteSpace: 'pre' as const,
        wordSpacing: 'normal',
        wordBreak: 'normal' as const,
        wordWrap: 'normal' as const,
        lineHeight: '1.5',
        tabSize: 4,
        hyphens: 'none' as const,
    },
    'pre[class*="language-"]': {
        color: '#ccc',
        background: '#2d2d2d',
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '1em',
        textAlign: 'left' as const,
        whiteSpace: 'pre' as const,
        wordSpacing: 'normal',
        wordBreak: 'normal' as const,
        wordWrap: 'normal' as const,
        lineHeight: '1.5',
        tabSize: 4,
        hyphens: 'none' as const,
        padding: '1em',
        margin: '.5em 0',
        overflow: 'auto',
    },
};

interface CodeReferencesProps {
    citations: Citation[];
}

// Helper function to get file icon based on extension
const getFileIcon = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, any> = {
        'ts': FileCode,
        'tsx': FileCode,
        'js': FileCode,
        'jsx': FileCode,
        'py': FileCode,
        'java': FileCode,
        'cpp': FileCode,
        'c': FileCode,
        'cs': FileCode,
        'php': FileCode,
        'rb': FileCode,
        'go': FileCode,
        'rs': FileCode,
        'sql': Database,
        'json': Settings,
        'yaml': Settings,
        'yml': Settings,
        'xml': Settings,
        'html': FileCode,
        'css': FileCode,
        'scss': FileCode,
        'md': FileText,
        'sh': Settings,
        'dockerfile': Settings,
        'png': FileImage,
        'jpg': FileImage,
        'jpeg': FileImage,
        'svg': FileImage,
    };
    const IconComponent = iconMap[extension || ''] || File;
    return IconComponent;
};

// Helper function to determine language from file extension
const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'tsx',
        'js': 'javascript',
        'jsx': 'jsx',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'sql': 'sql',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'xml': 'xml',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'md': 'markdown',
        'sh': 'bash',
        'dockerfile': 'dockerfile',
    };
    return languageMap[extension || ''] || 'text';
};

// Helper function to extract filename from path
const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
};

export default function CodeReferences({ citations }: CodeReferencesProps) {
    if (!citations || citations.length === 0) {
        return null;
    }

    // Group citations by file path to handle multiple chunks from same file
    const fileGroups = citations.reduce((acc, citation) => {
        if (!acc[citation.path]) {
            acc[citation.path] = [];
        }
        acc[citation.path]!.push(citation);
        return acc;
    }, {} as Record<string, Citation[]>);

    const fileNames = Object.keys(fileGroups);

    // Use the first file as the active tab
    const [activeTab, setActiveTab] = useState<string>(fileNames[0] || '');

    // If only one file, show simple view
    if (fileNames.length === 1 && fileNames[0]) {
        const filePath = fileNames[0];
        const FileIcon = getFileIcon(filePath);

        return (
            <Card className="mt-4">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Code2 className="h-5 w-5" />
                        <span>Referenced File</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* File header */}
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm text-foreground">{filePath}</span>
                            <div className="ml-auto flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {getLanguageFromPath(filePath)}
                                </Badge>
                            </div>
                        </div>

                        {fileGroups[filePath]?.map((citation, index) => (
                            <div key={index} className="space-y-2">
                                {(fileGroups[filePath]?.length || 0) > 1 && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Code chunk {citation.chunkIndex + 1}</span>
                                    </div>
                                )}
                                <div className="border rounded-lg overflow-hidden bg-[#1e1e1e]">
                                    <SyntaxHighlighter
                                        language={getLanguageFromPath(citation.path)}
                                        style={darkStyle}
                                        customStyle={{
                                            margin: 0,
                                            fontSize: '0.875rem',
                                            lineHeight: '1.6',
                                            padding: '1rem',
                                            background: 'transparent',
                                        }}
                                        showLineNumbers={true}
                                        wrapLines={true}
                                        lineNumberStyle={{
                                            color: '#6b7280',
                                            fontSize: '0.75rem',
                                            paddingRight: '1rem',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {citation.excerpt || '// No code content available'}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        )) || []}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Multiple files - show tab interface
    return (
        <div className="mt-4">
            {/* Tab Header */}
            <div className="bg-muted/20 border border-border rounded-t-lg">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Referenced Files</span>
                        <Badge variant="secondary" className="text-xs">
                            {fileNames.length} files
                        </Badge>
                    </div>
                </div>

                {/* Chrome-like Tab Bar */}
                <div className="flex overflow-x-auto scrollbar-hide bg-muted/10">
                    {fileNames.map((filePath) => {
                        const FileIcon = getFileIcon(filePath);
                        const isActive = activeTab === filePath;
                        return (
                            <button
                                key={filePath}
                                onClick={() => setActiveTab(filePath)}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 text-xs whitespace-nowrap 
                                    border-r border-border/50 min-w-fit flex-shrink-0 
                                    transition-all duration-200 relative
                                    ${isActive
                                        ? 'bg-background text-foreground border-b-2 border-b-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                    }
                                `}
                            >
                                <FileIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="font-medium">{getFileName(filePath)}</span>
                                {(fileGroups[filePath]?.length || 0) > 1 && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-xs bg-primary/10 text-primary border-0 flex-shrink-0">
                                        {fileGroups[filePath]?.length || 0}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <Card className="rounded-t-none border-t-0">
                <CardContent className="p-4">
                    {fileNames.map((filePath) => {
                        const FileIcon = getFileIcon(filePath);
                        if (activeTab !== filePath) return null;

                        return (
                            <div key={filePath} className="space-y-3">
                                {/* File header */}
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-sm text-foreground">{filePath}</span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {getLanguageFromPath(filePath)}
                                        </Badge>
                                    </div>
                                </div>

                                {fileGroups[filePath]?.map((citation, index) => (
                                    <div key={index} className="space-y-2">
                                        {(fileGroups[filePath]?.length || 0) > 1 && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>Code chunk {citation.chunkIndex + 1}</span>
                                            </div>
                                        )}
                                        <div className="border rounded-lg overflow-hidden bg-[#1e1e1e]">
                                            <SyntaxHighlighter
                                                language={getLanguageFromPath(citation.path)}
                                                style={darkStyle}
                                                customStyle={{
                                                    margin: 0,
                                                    fontSize: '0.875rem',
                                                    lineHeight: '1.6',
                                                    padding: '1rem',
                                                    background: 'transparent',
                                                }}
                                                showLineNumbers={true}
                                                wrapLines={true}
                                                lineNumberStyle={{
                                                    color: '#6b7280',
                                                    fontSize: '0.75rem',
                                                    paddingRight: '1rem',
                                                    userSelect: 'none',
                                                }}
                                            >
                                                {citation.excerpt || '// No code content available'}
                                            </SyntaxHighlighter>
                                        </div>
                                    </div>
                                )) || []}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}