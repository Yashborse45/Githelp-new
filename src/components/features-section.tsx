import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, HelpCircle, Mic, Monitor, Sparkles } from "lucide-react"
import Image from "next/image"

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

        {/* Dashboard Preview Section */}
        <div className="mt-20 mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-card/60 backdrop-blur-sm ring-1 ring-border">
                <Monitor className="mr-2 h-4 w-4 text-gradient-primary" />
                <span className="text-gradient-primary">Dashboard Preview</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground mb-4">
              Experience GitHelp in Action
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how GitHelp transforms your development workflow with an intuitive dashboard,
              powerful AI-driven insights, and seamless GitHub integration.
            </p>
          </div>

          <Card className="relative overflow-hidden border-gradient bg-card/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <CardContent className="p-8 relative z-10">
              <div className="rounded-lg overflow-hidden shadow-2xl border border-border/50">
                <div className="bg-muted/20 px-4 py-2 border-b border-border/50 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">GitHelp Dashboard</div>
                </div>

                {/* Dashboard Preview Image */}
                <div className="relative bg-background aspect-video">
                  <Image
                    src="/images/dashboard-preview.png"
                    alt="GitHelp Dashboard Preview - See how our AI-powered interface helps you understand your codebase"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
