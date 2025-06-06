"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/components/auth-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/")
      } else {
        setIsLoading(false)
      }
    }
  }, [user, loading, router])

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="content-transition pb-16 md:pb-0">
        <main className="flex-1 overflow-auto">{children}</main>
        <MobileNav />
      </SidebarInset>
      <KeyboardShortcuts />
    </SidebarProvider>
  )
}
