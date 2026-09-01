"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import AuthenticatingScreen from "@/components/ui/authenticating-screen"

interface AuthLoadingContextType {
  isLoading: boolean
  showAuthLoading: () => void
  hideAuthLoading: () => void
}

const AuthLoadingContext = createContext<AuthLoadingContextType>({
  isLoading: false,
  showAuthLoading: () => {},
  hideAuthLoading: () => {},
})

export function useAuthLoading() {
  return useContext(AuthLoadingContext)
}

function RouteChangeListener({ onReset }: { onReset: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    onReset()
  }, [pathname, searchParams, onReset])

  return null
}

export function AuthLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  const showAuthLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const hideAuthLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Safety timeout: If navigation hangs or fails, auto dismiss after 10s
  useEffect(() => {
    if (!isLoading) return
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 10000)
    return () => clearTimeout(timer)
  }, [isLoading])

  return (
    <AuthLoadingContext.Provider value={{ isLoading, showAuthLoading, hideAuthLoading }}>
      <Suspense fallback={null}>
        <RouteChangeListener onReset={hideAuthLoading} />
      </Suspense>
      {children}
      {isLoading && <AuthenticatingScreen />}
    </AuthLoadingContext.Provider>
  )
}
