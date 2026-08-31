'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetupProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Your invitation link is expired or invalid. Please request a new invite.')
        setLoading(false)
        return
      }

      setUserId(session.user.id)

      // Fetch the profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        // Do not overwrite with TEMP or 0 if we can avoid it, or clear them if they are placeholders
        setFirstName(profile.first_name === 'TEMP' ? '' : profile.first_name || '')
        setLastName(profile.last_name === 'TEMP' ? '' : profile.last_name || '')
        setMajor(profile.major === 'TEMP' ? '' : profile.major || '')
        setPledgeClass(profile.pledge_class === 'TEMP' ? '' : profile.pledge_class || '')
        setGraduationYear(profile.graduation_year === 0 ? '' : profile.graduation_year?.toString() || '')
      }
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

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

    // 1. Update password
    const { error: updateAuthError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateAuthError) {
      setError(updateAuthError.message)
      setSaving(false)
      return
    }

    // 2. Update profile
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        major: major,
        pledge_class: pledgeClass,
        graduation_year: parseInt(graduationYear),
        updated_at: new Date().toISOString()
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
    <div className="min-h-screen py-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Setup Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Complete your profile and set a password to access the portal.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300 p-4 rounded-lg text-center">
            Profile saved successfully! Redirecting you to the portal...
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
                  <option value="Biomedical Engineering">Biomedical Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Industrial Engineering">Industrial Engineering</option>
                  <option value="Materials Science and Engineering">Materials Science and Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Nuclear Engineering">Nuclear Engineering</option>
                  <option value="Undeclared Engineering">Undeclared Engineering</option>
                  <option value="Other Engineering">Other Engineering</option>
                  <option value="Non-Engineering">Non-Engineering</option>
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
                {saving ? 'Saving...' : 'Save Profile & Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
