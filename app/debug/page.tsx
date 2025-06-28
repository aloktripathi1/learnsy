"use client"

import { DebugSupabase } from "@/components/debug-supabase"

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Supabase Configuration</h1>
      <DebugSupabase />
    </div>
  )
}