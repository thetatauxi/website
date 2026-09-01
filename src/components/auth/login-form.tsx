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
      {error && (
        <p className="text-red-500 text-sm text-center">
          Incorrect username or password
        </p>
      )}
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
