import { GradientButton } from "@/components/gradient-button"
import { Button } from "@/components/ui/button"
import { Code, Play, Sparkles } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-royal opacity-60" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-primary opacity-15 rounded-full blur-3xl" />

      <div className="container mx-auto max-w-screen-xl px-4 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative rounded-full px-4 py-2 text-sm leading-6 text-muted-foreground ring-1 ring-border bg-card/50 backdrop-blur-sm">
              <Sparkles className="inline h-4 w-4 mr-2 text-gradient-primary" />
              Powered by AI. Built for Developers.
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gradient-primary text-balance">Your Codebase Has Answers.</span>
            <br />
            <span className="text-foreground text-balance">Start Asking.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
            RepoMind is the AI assistant that instantly understands your GitHub repositories. Ask questions about your code, get comprehensive analytics, and onboard faster than ever.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <GradientButton size="lg" className="text-lg px-8 py-6 shadow-2xl" asChild>
              <Link href="/register">Get Started Free</Link>
            </GradientButton>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/demo" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Feature highlights instead of dashboard preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 ring-1 ring-border">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Smart Q&A</h3>
                <p className="text-sm text-muted-foreground">Ask questions about your code in natural language</p>
              </div>
            </div>

            <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 ring-1 ring-border">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">Deep insights into your repository structure and patterns</p>
              </div>
            </div>

            <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 ring-1 ring-border">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">Advanced Gemini AI understands your codebase context</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
