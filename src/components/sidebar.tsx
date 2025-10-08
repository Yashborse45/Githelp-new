"use client"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { useClerk, useUser } from "@clerk/nextjs"
import { BarChart3, ExternalLink, LogOut, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  selectedProject: string | null
  onProjectChange: (projectId: string | null) => void
}

export function Sidebar({ activeView, onViewChange, selectedProject, onProjectChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // Fetch projects from the API
  const { data: projects = [], isLoading: projectsLoading } = api.project.list.useQuery()

  const handleDashboardClick = () => {
    onViewChange("dashboard")
  }

  const handleDashboardDoubleClick = () => {
    if (activeView === "dashboard") {
      onViewChange("")
    }
  }

  const handleQAClick = () => {
    onViewChange("qa")
  }

  const handleQADoubleClick = () => {
    if (activeView === "qa") {
      onViewChange("")
    }
  }

  const handleAnalyticsClick = () => {
    onViewChange("analytics")
  }

  const handleAnalyticsDoubleClick = () => {
    if (activeView === "analytics") {
      onViewChange("")
    }
  }

  const handleProjectClick = (projectId: string) => {
    if (selectedProject === projectId) {
      // If already selected, navigate to project page
      router.push(`/projects/${projectId}`)
    } else {
      onProjectChange(projectId)
    }
  }

  return (
    <div
      className={cn(
        "border-r border-border bg-background flex flex-col h-screen relative z-20 shadow-lg transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            {!isCollapsed && <span className="text-xl font-bold text-foreground">RepoMind</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </Button>
        </div>
      </div>

      <div className="p-4">
        <nav className="space-y-2">
          <button
            onClick={handleDashboardClick}
            onDoubleClick={handleDashboardDoubleClick}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              activeView === "dashboard" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
          </button>

          <button
            onClick={handleQAClick}
            onDoubleClick={handleQADoubleClick}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              activeView === "qa" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium">Q&A</span>}
          </button>

          <button
            onClick={handleAnalyticsClick}
            onDoubleClick={handleAnalyticsDoubleClick}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              activeView === "analytics" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            {!isCollapsed && <span className="text-sm font-medium">Analytics</span>}
          </button>
        </nav>
      </div>

      {/* Projects List */}
      {!isCollapsed && (
        <div className="flex-1 px-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Projects</h3>
            <div className="space-y-1">
              {projectsLoading ? (
                <div className="text-sm text-muted-foreground px-3 py-2">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-sm text-muted-foreground px-3 py-2">No projects yet. Create your first project!</div>
              ) : (
                projects.map((project) => {
                  const initial = project.name.charAt(0).toUpperCase()
                  const isSelected = selectedProject === project.id
                  return (
                    <ContextMenu key={project.id}>
                      <ContextMenuTrigger asChild>
                        <button
                          onClick={() => handleProjectClick(project.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2",
                            "hover:bg-muted hover:text-foreground",
                            isSelected ? "bg-primary text-primary-foreground" : "text-foreground",
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center text-xs font-medium flex-shrink-0",
                              isSelected ? "bg-primary-foreground text-primary" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {initial}
                          </div>
                          <span className="truncate">{project.name}</span>
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Project Page
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => router.push(`/projects/${project.id}/qa`)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Q&A Page
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => window.open(project.repoUrl, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on GitHub
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <Button
            onClick={() => onViewChange("create-project")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </Button>
        )}

        {/* User Profile */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.imageUrl || "/placeholder.svg?height=32&width=32"}
                      alt={user?.fullName || user?.username || "User"}
                    />
                    <AvatarFallback>
                      {(user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {!isLoaded ? "Loading..." : user?.fullName || user?.username || "User"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {!isLoaded
                        ? "Fetching user…"
                        : user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ""}
                    </div>
                  </div>
                </div>

                <ThemeToggle />
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.imageUrl || "/placeholder.svg?height=32&width=32"}
                    alt={user?.fullName || user?.username || "User"}
                  />
                  <AvatarFallback>
                    {(user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    try {
                      await signOut({ redirectUrl: "/" })
                    } catch (e) {
                      console.error("Sign out failed", e)
                      router.push("/")
                    }
                  }}
                  title={isSignedIn ? "Log Out" : "Sign In"}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={async () => {
                try {
                  await signOut({ redirectUrl: "/" })
                } catch (e) {
                  console.error("Sign out failed", e)
                  router.push("/")
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSignedIn ? "Log Out" : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
