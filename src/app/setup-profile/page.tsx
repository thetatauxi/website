'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { verifySetupTokenAction, completeProfileSetupAction } from '@/app/actions'

export default function SetupProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)
  const [setupToken, setSetupToken] = useState<string | null>(null)

  // Form state
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [major, setMajor] = useState('')
  const [pledgeClass, setPledgeClass] = useState('')
  const [graduationYear, setGraduationYear] = useState('')

  // Fixed role
  const role = 'Member'

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadProfileData = async (user: { id: string; email?: string }) => {
      if (!isMounted) return
      setUserId(user.id)

      // Always populate username immediately from email prefix as default
      const defaultUsername = user.email ? user.email.split('@')[0] : ''
      if (defaultUsername) {
        setUsername(defaultUsername)
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (isMounted && profile) {
          if (profile.username) {
            setUsername(profile.username)
          }
          if (profile.first_name && profile.first_name !== 'TEMP') {
            setFirstName(profile.first_name)
            setIsRecovery(true)
          }
          if (profile.last_name && profile.last_name !== 'TEMP') {
            setLastName(profile.last_name)
          }
          if (profile.major && profile.major !== 'TEMP') {
            setMajor(profile.major)
          }
          if (profile.pledge_class && profile.pledge_class !== 'TEMP') {
            setPledgeClass(profile.pledge_class)
          }
          if (profile.graduation_year && profile.graduation_year !== 0) {
            setGraduationYear(profile.graduation_year.toString())
          }
        }
      } catch (err) {
        console.warn('Error fetching profile details:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const initAuth = async () => {
      // 0. Check for resilient custom setup token in URL search params (?token=...)
      if (typeof window !== 'undefined') {
        const queryParams = new URLSearchParams(window.location.search)
        const tokenParam = queryParams.get('token')
        if (tokenParam && tokenParam.trim().length >= 16) {
          const cleanToken = tokenParam.trim()
          setSetupToken(cleanToken)
          try {
            const result = await verifySetupTokenAction(cleanToken)
            if (!isMounted) return

            if (result.valid) {
              setUserId(result.userId || '')
              setUsername(result.username || '')
              if (result.firstName) setFirstName(result.firstName)
              if (result.lastName) setLastName(result.lastName)
              if (result.major) setMajor(result.major)
              if (result.pledgeClass) setPledgeClass(result.pledgeClass)
              if (result.graduationYear) setGraduationYear(result.graduationYear)
              if (result.isReset) setIsRecovery(true)
              setLoading(false)
              return
            } else {
              setError(result.message || 'This setup link is invalid or has expired.')
              setLoading(false)
              return
            }
          } catch (err: unknown) {
            if (!isMounted) return
            const msg = err instanceof Error ? err.message : 'Error validating setup link.'
            setError(msg)
            setLoading(false)
            return
          }
        }
      }

      // 1. Check if an invite/recovery hash is present in the URL (legacy fallback)
      if (typeof window !== 'undefined') {
        if (window.location.search.includes('type=recovery')) {
          setIsRecovery(true)
        }
      }

      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        if (params.get('type') === 'recovery') {
          setIsRecovery(true)
        }
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const errorParam = params.get('error')
        const errorDesc = params.get('error_description')

        if (errorParam || errorDesc) {
          if (isMounted) {
            setError(errorDesc || errorParam || 'Invalid or expired invitation link.')
            setLoading(false)
          }
          return
        }

        if (accessToken && refreshToken) {
          // Explicitly set the active session using the new invite tokens
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionErr) {
            console.error('Error activating invite session:', sessionErr)
            if (isMounted) {
              setError('Unable to activate invitation session. Please request a new invite.')
              setLoading(false)
            }
            return
          }

          if (sessionData.session?.user && isMounted) {
            await loadProfileData(sessionData.session.user)
            return
          }
        }
      }

      // 2. Validate current session against Supabase Auth server
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        if (isMounted) {
          await supabase.auth.signOut().catch(() => {})
          setError('Please use the setup link sent to your email to configure your profile.')
          setLoading(false)
        }
      } else if (isMounted) {
        await loadProfileData(user)
      }
    }

    // Subscribe to auth state changes as a backup
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (event === 'SIGNED_IN' && session?.user && !setupToken) {
        await loadProfileData(session.user)
      }
    })

    initAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setSaving(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setSaving(false)
      return
    }

    if (!firstName || !lastName || !major || !pledgeClass || !graduationYear) {
      setError('Please fill out all fields.')
      setSaving(false)
      return
    }

    // PATH A: Use custom resilient setup token (immune to email scanner link burn)
    if (setupToken) {
      try {
        const res = await completeProfileSetupAction({
          token: setupToken,
          password,
          firstName,
          lastName,
          major,
          pledgeClass,
          graduationYear,
        })

        if (!res.success) {
          setError(res.message || 'Failed to complete profile setup.')
          setSaving(false)
          return
        }

        // Automatically sign in the user with their newly confirmed credentials
        if (res.email) {
          await supabase.auth.signInWithPassword({
            email: res.email,
            password,
          }).catch(() => {})
        }

        setSuccess(true)
        setSaving(false)
        setTimeout(() => {
          router.push('/members-only')
        }, 2000)
        return
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to save profile'
        setError(msg)
        setSaving(false)
        return
      }
    }

    // PATH B: Legacy session-based update
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const { error: updateAuthError } = await supabase.auth.updateUser({
      password: password,
      data: {
        full_name: fullName,
        name: fullName,
        display_name: fullName,
      },
    })

    if (updateAuthError) {
      if (
        updateAuthError.message.includes('sub claim') ||
        updateAuthError.message.includes('not exist')
      ) {
        await supabase.auth.signOut().catch(() => {})
        setError('Your session has expired or the user account was reset. Please request a new invite.')
      } else {
        setError(updateAuthError.message)
      }
      setSaving(false)
      return
    }

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        major: major,
        pledge_class: pledgeClass,
        graduation_year: parseInt(graduationYear),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateProfileError) {
      setError(updateProfileError.message)
      setSaving(false)
    } else {
      setSuccess(true)
      setSaving(false)
      setTimeout(() => {
        router.push('/members-only')
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-black px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-8 rounded-xl shadow-lg transition-colors duration-200">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isRecovery ? 'Reset Password & Profile' : 'Setup Your Profile'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isRecovery
              ? 'Set a new password and review or update your member details below.'
              : 'Complete your profile and set a password to access the portal.'}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300 p-4 rounded-lg text-center">
            {isRecovery
              ? 'Password and profile updated successfully! Redirecting you to the portal...'
              : 'Profile saved successfully! Redirecting you to the portal...'}
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300 p-4 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Username (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={username}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed sm:text-sm"
                />
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Min 6 chars"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Match password"
                  />
                </div>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              {/* Role (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  disabled
                  value={role}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Roles are manually assigned by administrators.</p>
              </div>

              {/* Major */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Major
                </label>
                <select
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                  <option value="" disabled>Select your major</option>
                  <option value="Aerospace Engineering">Aerospace Engineering</option>
                  <option value="Agricultural and Biosystems Engineering">Agricultural and Biosystems Engineering</option>
                  <option value="Biological Systems Engineering">Biological Systems Engineering</option>
                  <option value="Biomedical Engineering">Biomedical Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Engineering Mechanics">Engineering Mechanics</option>
                  <option value="Geological Engineering">Geological Engineering</option>
                  <option value="Industrial Engineering">Industrial Engineering</option>
                  <option value="Materials Science & Engineering">Materials Science & Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Nuclear Engineering">Nuclear Engineering</option>
                  <option value="Undeclared Engineering">Undeclared Engineering</option>
                  <option value="Not Listed">Other Engineering</option>
                </select>
              </div>

              {/* Pledge Class */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pledge Class
                  </label>
                  <select
                    required
                    value={pledgeClass}
                    onChange={(e) => setPledgeClass(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="" disabled>Select</option>
                    {['Fall 2023', 'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026', 'Fall 2026'].map((pc) => (
                      <option key={pc} value={pc}>{pc}</option>
                    ))}
                  </select>
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Graduation Year
                  </label>
                  <select
                    required
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="" disabled>Select</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : isRecovery
                  ? 'Update Profile & Set New Password'
                  : 'Save Profile & Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
