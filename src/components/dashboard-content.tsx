"use client"

import { CommitCard } from "@/components/commit-card"
import { CreateProjectForm } from "@/components/create-project-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/trpc/react"
import { useState } from "react"

const savedQuestions = [
  {
    id: 1,
    question: "Where do I change the pdf loading logic?",
    timestamp: "10/17/2024",
    preview:
      "You're looking to change how the PDF is loaded, right? Let's dive into the code! The 'PDFViewer' component currently uses Google Docs Viewer to...",
    author: "John Doe",
  },
  {
    id: 2,
    question: "How do I add authentication to my app?",
    timestamp: "10/16/2024",
    preview:
      "To add authentication, you'll want to use a library like NextAuth.js or implement your own auth system. Here's how to get started...",
    author: "Jane Smith",
  },
]

interface DashboardContentProps {
  activeView: string
  selectedProject: string | null
  onViewChange?: (view: string) => void
}

function CitationsList({ citationsJson }: { citationsJson: string }) {
  try {
    const citations = JSON.parse(citationsJson)
    if (!Array.isArray(citations) || citations.length === 0) return null
    
    return (
      <div className="mt-3 border-t border-border/50 pt-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">References:</h4>
        <div className="space-y-1">
          {citations.map((citation: any, index: number) => (
            <div key={index} className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              {citation.fileName}: {citation.content?.substring(0, 100)}...
            </div>
          ))}
        </div>
      </div>
    )
  } catch {
    return null
  }
}

export function DashboardContent({ activeView, selectedProject, onViewChange }: DashboardContentProps) {
  // Local state for Q&A interaction
  const [question, setQuestion] = useState("")
  const [dashboardQuestion, setDashboardQuestion] = useState("Which file should I edit to change the home page?")
  const [showAnswerBox, setShowAnswerBox] = useState(false)
  
  // Fetch projects data
  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery()
  
  // Fetch commits for selected project
  const { data: commits = [], isLoading: commitsLoading } = api.commit.getRecent.useQuery(
    { projectId: selectedProject!, limit: 5 },
    { enabled: !!selectedProject }
  )
  
  const qaMutation = api.qa.ask.useMutation({
    onSuccess: () => setShowAnswerBox(true),
  })

  const loading = qaMutation.status === "pending"
  const error = qaMutation.status === "error" ? qaMutation.error : null

  // Find the selected project
  const currentProject = selectedProject ? projects.find(p => p.id === selectedProject) : null

  const handleAsk = () => {
    if (!selectedProject || !question.trim()) return
    qaMutation.mutate({ projectId: selectedProject, question })
  }

  const handleDashboardAsk = () => {
    if (!selectedProject || !dashboardQuestion.trim()) {
      // If no project selected, suggest creating one
      onViewChange?.("create-project")
      return
    }
    // Switch to QA view and set the question
    setQuestion(dashboardQuestion)
    onViewChange?.("qa")
  }

  if (activeView === "create-project") {
    return (
      <CreateProjectForm 
        onProjectCreated={() => {
          // Switch back to dashboard view after project creation
          onViewChange?.("dashboard")
        }} 
      />
    )
  }

  if (activeView === "qa") {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Ask a question</h1>
          <div className="mb-4 w-full max-w-2xl space-y-2">
            <Input
              placeholder="Ask something about this repo..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleAsk()
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                disabled={!question.trim() || loading || !selectedProject}
                onClick={handleAsk}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? "Thinking..." : "Ask GitHelp!"}
              </Button>
              {error && <span className="text-destructive text-sm">{error.message}</span>}
            </div>
            {showAnswerBox && (
              <div className="mt-4 border border-border rounded-md p-4 bg-card/50 backdrop-blur">
                <h3 className="text-sm font-semibold mb-2">Answer</h3>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {qaMutation.data?.answer?.answer || (loading ? "Generating..." : "")}
                </p>
                {qaMutation.data?.answer?.citations && (
                  <CitationsList citationsJson={qaMutation.data.answer.citations} />
                )}
              </div>
            )}
          </div>
        </div>

        {selectedProject && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Saved Questions</h2>
            <div className="grid gap-3">
              {savedQuestions.map((sq) => (
                <div
                  key={sq.id}
                  className="border border-border rounded-lg p-4 bg-card hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => setQuestion(sq.question)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground">{sq.question}</h3>
                    <span className="text-xs text-muted-foreground">{sq.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sq.preview}</p>
                  <div className="mt-2 text-xs text-muted-foreground">by {sq.author}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Dashboard view (when activeView === "dashboard")
  if (activeView === "dashboard") {
    if (projectsLoading) {
      return (
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your projects...</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          {/* Project info section */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm">📁</span>
              </div>
              <span className="text-sm">This project is linked to</span>
            </div>
            
            {currentProject ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>{currentProject.repoOwner?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{currentProject.repoOwner}/{currentProject.repoName}</p>
                    <p className="text-sm text-muted-foreground">{currentProject.repoUrl}</p>
                  </div>
                </div>
                
                {/* Ask question section */}
                <div className="mt-6 space-y-3">
                  <Input
                    placeholder="Which file should I edit to change the home page?"
                    value={dashboardQuestion}
                    onChange={(e) => setDashboardQuestion(e.target.value)}
                    className="bg-background"
                  />
                  <Button
                    onClick={handleDashboardAsk}
                    disabled={!dashboardQuestion.trim() || loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? "Thinking..." : "Ask GitHelp!"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No project selected</p>
                <Button 
                  onClick={() => onViewChange?.("create-project")}
                  variant="outline"
                >
                  Create New Project
                </Button>
              </div>
            )}
          </div>

          {/* Recent Commits Section */}
          {currentProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recent commits</h2>
                {commitsLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </div>
              <div className="space-y-3">
                {commits.length > 0 ? (
                  commits.map((commit) => (
                    <CommitCard 
                      key={commit.sha} 
                      author={commit.author || "Unknown"}
                      message={commit.message}
                      pullRequest={commit.pullRequest}
                      changes={commit.changes || []}
                      timestamp={new Date(commit.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      htmlUrl={commit.htmlUrl}
                    />
                  ))
                ) : !commitsLoading ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground mb-2">No commits found</p>
                    <p className="text-sm text-muted-foreground">This could be due to repository permissions or network issues.</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* No projects state */}
          {!projectsLoading && projects.length === 0 && (
            <div className="text-center py-12">
              <Alert className="max-w-md mx-auto">
                <AlertDescription>
                  You haven't created any projects yet. Create your first project to get started with GitHelp!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fallback for unknown activeView
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unknown view: {activeView}</p>
      </div>
    </div>
  )
}
