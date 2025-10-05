"use client"

import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"

import { DashboardContent } from "@/components/dashboard-content"
import { OnboardingFlow, useOnboarding } from "@/components/onboarding/onboarding-flow"
import { Sidebar } from "@/components/sidebar"
import { ErrorBoundaryDisplay } from "@/components/ui/error-display"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { useErrorHandler } from "@/hooks/use-error-handler"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  // Enhanced error handling
  const { errors, handleError, clearErrors } = useErrorHandler()

  // Onboarding system
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding()

  // Client-side guard to avoid any flash of protected content if server redirect is bypassed momentarily.
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      const errorInfo = handleError(
        { message: "Authentication required", code: "401" },
        { showToast: false }
      )
      toast({
        title: "Authentication required",
        description: "Please sign in to access your dashboard.",
        variant: "destructive",
      })
      router.replace("/login")
    }
  }, [isLoaded, isSignedIn, router, toast, handleError])

  const handleOnboardingComplete = () => {
    completeOnboarding()
    if (activeView === "dashboard") {
      setActiveView("create-project")
    }
  }

  // While auth state resolving OR redirecting, render enhanced loading placeholder
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingIndicator
          loadingState={{
            isLoading: true,
            message: "Checking authentication...",
            stage: "Please wait while we verify your credentials"
          }}
          compact={false}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-background" />
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-gradient-primary opacity-3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-primary opacity-5 rounded-full blur-3xl" />

        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
        />

        <main className="flex-1 overflow-auto relative z-10 bg-background/80 backdrop-blur-sm">
          {/* Error Display */}
          {errors.length > 0 && (
            <div className="p-4 border-b bg-background/95">
              <ErrorBoundaryDisplay
                errors={errors}
                onClearAll={clearErrors}
                maxVisible={2}
              />
            </div>
          )}

          <DashboardContent
            activeView={activeView}
            selectedProject={selectedProject}
            onViewChange={setActiveView}
            onProjectChange={setSelectedProject}
          />
        </main>
      </div>

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={skipOnboarding}
        />
      )}
    </>
  )
}
