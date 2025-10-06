"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoadingState } from "@/hooks/use-loading"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { CheckCircle, Database, Loader2 } from "lucide-react"
import { useState } from "react"

interface CreateProjectFormProps {
  onProjectCreated?: () => void
}

export function CreateProjectForm({ onProjectCreated }: CreateProjectFormProps = {}) {
  const [projectName, setProjectName] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [currentStep, setCurrentStep] = useState<'form' | 'processing' | 'complete'>('form')
  const [processingStats, setProcessingStats] = useState<{ totalFiles: number; processedFiles: number } | null>(null)
  const { toast } = useToast()
  const { loadingState, startLoading, updateProgress, setMessage, finishLoading } = useLoadingState()

  const utils = api.useContext()

  // Get repository size for time estimation
  const getTimeEstimate = (totalFiles: number): string => {
    if (totalFiles < 50) return "1-2 minutes ☕"
    if (totalFiles < 200) return "3-5 minutes ☕☕"
    if (totalFiles < 500) return "5-10 minutes ☕☕☕"
    return "10-15 minutes - perfect time for a coffee break! ☕☕☕☕"
  }

  const ingestMutation = api.project.ingest.useMutation({
    onSuccess: (result) => {
      setProcessingStats(result)
      setMessage('Repository processing completed successfully!')
      setTimeout(() => {
        finishLoading()
        setCurrentStep('complete')
        toast({
          title: "🎉 All Done!",
          description: `Processed ${result.processedFiles} files. Your project is ready for AI Q&A!`,
        })

        // Reset form after a delay
        setTimeout(() => {
          setCurrentStep('form')
          setProjectName("")
          setGithubUrl("")
          setGithubToken("")
          setProcessingStats(null)
          onProjectCreated?.()
        }, 3000)
      }, 1500)
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      })
      finishLoading()
      setCurrentStep('form')
    },
  })

  const createProjectMutation = api.project.create.useMutation({
    onSuccess: async (project) => {
      toast({
        title: "✅ Project created successfully!",
        description: `${project.name} has been linked to your account.`,
      })

      // Invalidate projects list
      utils.project.list.invalidate()

      // Move to processing step
      setCurrentStep('processing')

      // Get repository info for time estimate
      try {
        const planResult = await utils.project.ingestPlan.fetch({ projectId: project.id })
        const estimate = getTimeEstimate(planResult.totalFiles)

        toast({
          title: "🔄 Starting repository analysis...",
          description: `Found ${planResult.totalFiles} files. Estimated time: ${estimate}`,
        })

        // Start the loading state with progress simulation
        startLoading('Initializing repository analysis...', 'Connecting to repository')

        // Simulate progress updates
        setTimeout(() => updateProgress(20, 'Fetching repository contents...', `Processing ${planResult.totalFiles} files`), 500)
        setTimeout(() => updateProgress(40, 'Processing code files...', 'Analyzing structure'), 2000)
        setTimeout(() => updateProgress(60, 'Generating embeddings...', 'AI processing'), 4000)
        setTimeout(() => updateProgress(80, 'Storing in knowledge base...', 'Almost done!'), 6000)

        // Start actual ingestion
        await ingestMutation.mutateAsync({ projectId: project.id })

      } catch (error) {
        toast({
          title: "Failed to process repository",
          description: "Project created but processing failed. You can retry from the project page.",
          variant: "destructive",
        })
        setCurrentStep('form')
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim() || !githubUrl.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide both project name and GitHub URL.",
        variant: "destructive",
      })
      return
    }

    // Basic GitHub URL validation
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/?$/
    if (!githubUrlPattern.test(githubUrl.trim())) {
      toast({
        title: "Invalid GitHub URL",
        description: "Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository)",
        variant: "destructive",
      })
      return
    }

    createProjectMutation.mutate({
      name: projectName.trim(),
      repoUrl: githubUrl.trim(),
      token: githubToken.trim() || undefined,
    })
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full flex items-center gap-16">
        {/* Illustration */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            {/* Person illustration */}
            <div className="relative">
              {/* Head */}
              <div className="w-16 h-16 bg-pink-300 rounded-full relative mb-4 mx-auto">
                {/* Hair */}
                <div className="absolute -top-2 -left-2 w-20 h-12 bg-primary rounded-full"></div>
              </div>

              {/* Laptop */}
              <div className="w-32 h-20 bg-gray-700 rounded-lg relative mx-auto">
                {/* Screen */}
                <div className="w-28 h-16 bg-gray-800 rounded-t-lg absolute top-1 left-2">
                  <div className="w-3 h-3 bg-primary rounded-full absolute top-6 left-12"></div>
                </div>
                {/* Base */}
                <div className="w-36 h-4 bg-gray-600 rounded-lg absolute -bottom-2 -left-2"></div>
              </div>
            </div>

            {/* Blue squares pattern */}
            <div className="absolute -right-8 top-0">
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${Math.random() > 0.3 ? "bg-primary" : "bg-primary/20"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Link your GitHub Repository</h1>
            <p className="text-muted-foreground">Enter the URL of your repository to link it to GitHelp</p>
          </div>

          {currentStep === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full"
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="text-sm font-medium">
                  Github URL
                </Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full"
                  placeholder="https://github.com/username/repository"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubToken" className="text-sm font-medium">
                  Github Token (Optional)
                </Label>
                <Input
                  id="githubToken"
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full"
                  placeholder="Enter your GitHub token"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  "Create & Process Repository"
                )}
              </Button>
            </form>
          )}

          {currentStep === 'processing' && (
            <div className="space-y-6">
              <div className="text-center">
                <Database className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
                <h2 className="text-xl font-semibold mb-2">Processing Repository</h2>
                <p className="text-muted-foreground">
                  We're analyzing your code and creating embeddings for AI-powered Q&A
                </p>
              </div>

              {loadingState.isLoading && (
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${loadingState.progress}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{loadingState.title}</p>
                    <p className="text-sm text-muted-foreground">{loadingState.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Repository Ready!</h2>
                <p className="text-muted-foreground">
                  {processingStats && `Successfully processed ${processingStats.processedFiles} files.`}
                  <br />Your project is now ready for AI-powered Q&A!
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Redirecting to projects in a moment...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
