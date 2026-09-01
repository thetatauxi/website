import LoginForm from '@/components/auth/login-form'

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-8 rounded-xl shadow-lg transition-colors duration-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Member Login
          </h2>
        </div>
        <LoginForm error={searchParams?.error} />
      </div>
    </div>
  )
}

