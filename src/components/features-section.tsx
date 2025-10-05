import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, Github, HelpCircle, MessageSquare, Mic, Sparkles, Zap } from "lucide-react"

const features = [
  {
    icon: HelpCircle,
    title: "Codebase Q&A",
    description:
      "Connect a repository and ask complex questions in natural language. Get answers with direct links to the source code.",
  },
  {
    icon: GitBranch,
    title: "AI Commit Summaries",
    description: "Instantly understand team progress with AI-generated summaries of new commits.",
  },
  {
    icon: Mic,
    title: "Meeting Analysis",
    description: "Upload technical meetings to get summaries and ask questions. Ensure no key decision is ever lost.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-royal opacity-40" />
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-primary opacity-5 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-gradient-primary opacity-8 rounded-full blur-3xl" />

      <div className="container mx-auto max-w-screen-xl px-4 relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-card/60 backdrop-blur-sm ring-1 ring-border">
              <Sparkles className="mr-2 h-4 w-4 text-gradient-primary" />
              <span className="text-gradient-primary">Powerful Features</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Everything you need to understand your code
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful AI tools designed specifically for developers and engineering teams.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-gradient bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

              <CardHeader className="pb-4 relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-lg">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground group-hover:text-gradient-primary transition-all duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mt-20 mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-card/60 backdrop-blur-sm ring-1 ring-border">
                <Zap className="mr-2 h-4 w-4 text-gradient-primary" />
                <span className="text-gradient-primary">How It Works</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground mb-4">
              Get Started in 3 Simple Steps
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect your repository and start getting AI-powered insights in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <Card className="relative overflow-hidden border-gradient bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 group h-full">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

                <CardHeader className="pb-4 relative z-10 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-lg">
                        <Github className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                        1
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Connect Repository
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 text-center">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    Link your GitHub repository to GitHelp. We'll analyze your codebase and make it searchable with AI.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Connector Line */}
              <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-primary opacity-30"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <Card className="relative overflow-hidden border-gradient bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 group h-full">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

                <CardHeader className="pb-4 relative z-10 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-lg">
                        <MessageSquare className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                        2
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Ask Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 text-center">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    Ask questions about your code in natural language. Our AI understands your codebase and provides accurate answers.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Connector Line */}
              <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-primary opacity-30"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <Card className="relative overflow-hidden border-gradient bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 group h-full">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

                <CardHeader className="pb-4 relative z-10 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-lg">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                        3
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Get AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 text-center">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    Receive detailed explanations, code references, and insights. Understand your codebase like never before.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-4 bg-card/60 backdrop-blur-sm ring-1 ring-border rounded-full px-6 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Ready to explore your code with AI?
              </div>
              <button className="bg-gradient-primary text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105">
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
