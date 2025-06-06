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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 enhanced-mobile-nav flex justify-around items-center h-16 px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full rounded-lg transition-all duration-200",
              "text-muted-foreground hover:text-foreground",
              isActive && "text-primary bg-primary/10 shadow-sm",
            )}
          >
            <item.icon className={cn("h-5 w-5 mb-1 transition-transform duration-200", isActive && "scale-110")} />
            <span className={cn("text-xs font-medium", isActive && "font-semibold")}>{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
