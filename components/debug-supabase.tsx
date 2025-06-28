"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function DebugSupabase() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // Get environment variables from the client side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    const debug = {
      envVars: {
        supabaseUrl: {
          exists: !!supabaseUrl,
          value: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
          isPlaceholder: supabaseUrl === 'your_supabase_project_url_here',
          isValidUrl: supabaseUrl ? isValidUrl(supabaseUrl) : false,
        },
        supabaseAnonKey: {
          exists: !!supabaseAnonKey,
          value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
          isPlaceholder: supabaseAnonKey === 'your_supabase_anon_key_here',
          startsWithEyJ: supabaseAnonKey ? supabaseAnonKey.startsWith('eyJ') : false,
        }
      },
      checks: {
        bothExist: !!supabaseUrl && !!supabaseAnonKey,
        neitherPlaceholder: supabaseUrl !== 'your_supabase_project_url_here' && supabaseAnonKey !== 'your_supabase_anon_key_here',
        urlValid: supabaseUrl ? isValidUrl(supabaseUrl) : false,
        keyValid: supabaseAnonKey ? supabaseAnonKey.startsWith('eyJ') : false,
      }
    }

    setDebugInfo(debug)
  }, [])

  if (!debugInfo) return <div>Loading debug info...</div>

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"}>
        {condition ? trueText : falseText}
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Supabase Configuration Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Variables */}
        <div>
          <h3 className="font-semibold mb-3">Environment Variables</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">NEXT_PUBLIC_SUPABASE_URL</div>
                <div className="text-sm text-muted-foreground">
                  Value: {debugInfo.envVars.supabaseUrl.value}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(debugInfo.envVars.supabaseUrl.exists)}
                {getStatusBadge(
                  !debugInfo.envVars.supabaseUrl.isPlaceholder,
                  "Real Value",
                  "Placeholder"
                )}
                {getStatusBadge(
                  debugInfo.envVars.supabaseUrl.isValidUrl,
                  "Valid URL",
                  "Invalid URL"
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                <div className="text-sm text-muted-foreground">
                  Value: {debugInfo.envVars.supabaseAnonKey.value}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(debugInfo.envVars.supabaseAnonKey.exists)}
                {getStatusBadge(
                  !debugInfo.envVars.supabaseAnonKey.isPlaceholder,
                  "Real Value",
                  "Placeholder"
                )}
                {getStatusBadge(
                  debugInfo.envVars.supabaseAnonKey.startsWithEyJ,
                  "Valid JWT",
                  "Invalid JWT"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div>
          <h3 className="font-semibold mb-3">Configuration Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Both variables exist</span>
              {getStatusIcon(debugInfo.checks.bothExist)}
            </div>
            <div className="flex items-center justify-between">
              <span>Neither are placeholders</span>
              {getStatusIcon(debugInfo.checks.neitherPlaceholder)}
            </div>
            <div className="flex items-center justify-between">
              <span>URL is valid</span>
              {getStatusIcon(debugInfo.checks.urlValid)}
            </div>
            <div className="flex items-center justify-between">
              <span>Key is valid JWT</span>
              {getStatusIcon(debugInfo.checks.keyValid)}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Next Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check your <code>.env.local</code> file in the project root</li>
            <li>Ensure the Supabase URL starts with <code>https://</code></li>
            <li>Ensure the anon key starts with <code>eyJ</code></li>
            <li>Restart your development server after making changes</li>
            <li>Clear your browser cache if needed</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}