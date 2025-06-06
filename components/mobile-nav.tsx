"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BookOpen, Bookmark, Home, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  // Don't show mobile nav on study pages
  if (pathname.includes("/study/")) {
    return null
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Courses",
      href: "/courses",
      icon: BookOpen,
    },
    {
      title: "Bookmarks",
      href: "/bookmarks",
      icon: Bookmark,
    },
    {
      title: "Notes",
      href: "/notes",
      icon: StickyNote,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex justify-around items-center h-16 px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              "text-muted-foreground hover:text-foreground transition-colors",
              isActive && "text-primary",
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
