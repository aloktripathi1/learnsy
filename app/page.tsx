"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Play,
  BookOpen,
  Target,
  Zap,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  Github,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { signInWithGoogle, error } = useAuth()

  const handleSignIn = async () => {
    if (error) {
      alert("Authentication is not configured. Please set up Supabase environment variables.")
      return
    }

    try {
      setIsLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error("Sign in error:", error)
      alert("Failed to sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: BookOpen,
      title: "Structured Learning",
      description: "Transform YouTube playlists into organized courses with clear progress tracking and navigation.",
    },
    {
      icon: Target,
      title: "Progress Tracking",
      description: "Monitor your learning journey with completion stats, streak calendars, and detailed analytics.",
    },
    {
      icon: Zap,
      title: "Distraction-Free",
      description: "Clean interface designed for focus, with note-taking, bookmarks, and keyboard shortcuts.",
    },
  ]

  const stats = [
    { icon: Users, label: "Active Learners", value: "100+" },
    { icon: Clock, label: "Hours Learned", value: "250+" },
    { icon: TrendingUp, label: "Completion Rate", value: "85%" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">
                Learn<span className="text-primary">sy</span>
              </span>
            </div>

            {/* Desktop Sign In */}
            <div className="hidden sm:block">
              <Button onClick={handleSignIn} disabled={isLoading || !!error} size="lg" className="gap-2 touch-target">
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="touch-target"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 pb-4 border-t pt-4">
              <Button onClick={handleSignIn} disabled={isLoading || !!error} className="w-full gap-2 touch-target">
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4">
        {/* Configuration Error Alert */}
        {error && (
          <Alert className="mb-4 sm:mb-8 max-w-2xl mx-auto mt-4 sm:mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="responsive-text">
              <strong>Setup Required:</strong> {error}
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Please configure your Supabase environment variables to enable authentication.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <section className="py-12 sm:py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              Learn Smarter with
              <span className="text-primary block">YouTube Playlists</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed responsive-text">
              Transform any YouTube playlist into a structured learning experience. Track progress, take notes, and stay
              focused without distractions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleSignIn} disabled={isLoading || !!error} size="lg" className="gap-2 touch-target">
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Get Started 
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-16 border-y bg-muted/30">
          <div className="responsive-stats-grid text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto" />
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <div className="text-muted-foreground responsive-text">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="responsive-heading font-bold mb-4">Everything you need to learn effectively</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto responsive-text">
              Powerful features designed to enhance your learning experience and help you achieve your goals.
            </p>
          </div>

          <div className="responsive-grid mb-12 sm:mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow touch-target">
                <CardHeader className="text-center">
                  <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="responsive-title">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center responsive-text leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="responsive-title font-bold">Built for serious learners</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium responsive-text">Progress Tracking</div>
                    <div className="text-sm text-muted-foreground">
                      Visual progress indicators and completion statistics
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium responsive-text">Smart Notes</div>
                    <div className="text-sm text-muted-foreground">Take notes linked to specific videos and topics</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium responsive-text">Bookmarks</div>
                    <div className="text-sm text-muted-foreground">Save important moments for quick reference</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium responsive-text">Keyboard Shortcuts</div>
                    <div className="text-sm text-muted-foreground">Navigate efficiently with keyboard controls</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 sm:p-8 text-center">
              <div className="bg-background rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="h-24 sm:h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <Play className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                </div>
                <div className="text-sm font-medium mb-2">Course Progress</div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-muted-foreground">12 of 16 videos completed</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 text-center bg-muted/30 rounded-lg">
          <div className="max-w-2xl mx-auto">
            <h2 className="responsive-heading font-bold mb-4">Ready to transform your learning?</h2>
            <p className="text-lg text-muted-foreground mb-6 sm:mb-8 responsive-text">
              Join thousands of learners who have already improved their study habits with Learnsy.
            </p>
            <Button onClick={handleSignIn} disabled={isLoading || !!error} size="lg" className="gap-2 touch-target">
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Start Learning Today
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 text-center border-t mt-12 sm:mt-20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold">
              Learn<span className="text-primary">sy</span>
            </span>
          </div>
          <p className="text-muted-foreground mb-2 responsive-text">© 2025 Learnsy. Built for focused learning.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Made by</span>
            <a
              href="https://github.com/aloktripathi1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors touch-target"
            >
              <Github className="h-4 w-4" />
              Alok Tripathi
            </a>
            <span className="text-red-500">❤️</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
