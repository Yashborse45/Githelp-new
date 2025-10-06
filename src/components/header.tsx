"use client"

import { GradientButton } from "@/components/gradient-button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function Header() {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-primary">
              <Logo className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">GitHelp</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/demo')}>
              Demo
            </Button>
          </nav>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => router.push('/login')}>Log In</Button>
          <GradientButton onClick={() => router.push('/register')}>Sign Up</GradientButton>
        </div>
      </div>
    </header>
  )
}
