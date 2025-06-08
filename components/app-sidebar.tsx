"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Bookmark, Home, StickyNote, Play, Moon, Sun, LogOut, User, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-provider"
import { useState, useEffect } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "My Courses",
    url: "/courses",
    icon: BookOpen,
  },
  {
    title: "Bookmarks",
    url: "/bookmarks",
    icon: Bookmark,
    count: 0,
  },
  {
    title: "Notes",
    url: "/notes",
    icon: StickyNote,
    count: 0,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { state, toggleSidebar } = useSidebar()

  const [notesCount, setNotesCount] = useState(0)
  const [bookmarksCount, setBookmarksCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadCounts()
    }
  }, [user])

  useEffect(() => {
    const handleNotesUpdate = () => {
      console.log("Notes updated, refreshing sidebar counts")
      loadCounts()
    }

    const handleBookmarksUpdate = () => {
      console.log("Bookmarks updated, refreshing sidebar counts")
      loadCounts()
    }

    const handleProgressUpdate = () => {
      console.log("Progress updated, refreshing sidebar counts")
      loadCounts()
    }

    window.addEventListener("notesUpdated", handleNotesUpdate)
    window.addEventListener("bookmarksUpdated", handleBookmarksUpdate)
    window.addEventListener("progressUpdated", handleProgressUpdate)

    return () => {
      window.removeEventListener("notesUpdated", handleNotesUpdate)
      window.removeEventListener("bookmarksUpdated", handleBookmarksUpdate)
      window.removeEventListener("progressUpdated", handleProgressUpdate)
    }
  }, [])

  const loadCounts = async () => {
    if (!user) return

    try {
      const { DatabaseService } = await import("@/lib/database")
      const [notes, bookmarks] = await Promise.all([
        DatabaseService.getNotes(user.id),
        DatabaseService.getBookmarks(user.id),
      ])

      // Filter to ensure we only count valid notes and bookmarks
      const validNotes = notes.filter(
        (note) => note.notes && note.notes.trim() !== "" && note.videos && note.videos.courses,
      )

      const validBookmarks = bookmarks.filter(
        (bookmark) => bookmark.bookmarked === true && bookmark.videos && bookmark.videos.courses,
      )

      console.log("Sidebar counts updated:", { notes: validNotes.length, bookmarks: validBookmarks.length })
      setNotesCount(validNotes.length)
      setBookmarksCount(validBookmarks.length)
    } catch (error) {
      console.error("Error loading sidebar counts:", error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  const isCollapsed = state === "collapsed"

  const updatedNavigation = navigation.map((item) => {
    if (item.title === "Bookmarks") {
      return { ...item, count: bookmarksCount }
    }
    if (item.title === "Notes") {
      return { ...item, count: notesCount }
    }
    return item
  })

  return (
    <Sidebar collapsible="icon" className="sidebar-transition hidden md:flex">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          {!isCollapsed && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/dashboard">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Play className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Learnsy</span>
                      <span className="text-xs">Study Platform</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {updatedNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={isCollapsed ? user?.user_metadata?.full_name || "User" : undefined}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                      alt={user?.user_metadata?.full_name}
                    />
                    <AvatarFallback className="rounded-lg">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.user_metadata?.full_name || "User"}</span>
                      <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                    </div>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
