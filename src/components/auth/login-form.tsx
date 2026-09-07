"use client"

import React, { useRef } from "react"
import { useAuthLoading } from "@/components/providers/auth-loading-provider"
import { loginAction } from "@/app/actions"

export default function LoginForm({ error }: { error?: string }) {
  const { showAuthLoading } = useAuthLoading()
  const formRef = useRef<HTMLFormElement | null>(null)

  const handleSubmit = () => {
    // Instantly trigger authenticating animation on submit
    showAuthLoading()
  }

  return (
    <form
      ref={formRef}
      className="mt-8 space-y-6"
      action={loginAction}
      onSubmit={handleSubmit}
    >
      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
            placeholder="Username (e.g. jsmith)"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
            placeholder="Enter password"
          />
        </div>
      </div>
      {(() => {
        if (!error) return null
        const lower = error.toLowerCase()
        if (lower.includes('expired') || lower.includes('invalid') || lower === 'otp_expired' || lower === 'invite-expired') {
          return (
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs text-center leading-relaxed">
              This invitation link is expired or has already been used. Please request a new invite from an administrator.
            </div>
          )
        }
        if (lower.includes('auth-failed') || lower.includes('unauthorized') || lower.includes('redirect')) {
          return (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs text-center leading-relaxed">
              Unable to verify authentication link. Please request a new invite or verify your login credentials.
            </div>
          )
        }
        return (
          <p className="text-red-500 text-sm text-center">
            Incorrect username or password
          </p>
        )
      })()}
      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm active:scale-[0.99]"
        >
          Sign in
        </button>
      </div>
    </form>
  )
}
