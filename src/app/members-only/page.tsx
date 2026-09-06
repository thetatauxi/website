import { redirect } from 'next/navigation'
import { Calendar, Users, ExternalLink, Megaphone, Shield, Link as LinkIcon, CheckCircle2, XCircle, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCalendarFromSheet, getLinksFromSheet } from '@/lib/google-sheets'
import SyncPanel from '@/components/members/sync-panel'
import { Medal } from '@/components/members/medal'
import CommunityLinks, { type CommunityLink } from '@/components/members/community-links'

export const dynamic = 'force-dynamic'

export default async function MembersOnlyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const upcomingEvents = await getCalendarFromSheet()
  const importantLinks = await getLinksFromSheet()

  // Fetch full profile of current user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch initial community links
  const { data: rawCommunityLinks } = await supabase
    .from('community_links')
    .select('*')
    .order('created_at', { ascending: false })

  const initialCommunityLinks = (rawCommunityLinks || []) as CommunityLink[]

  // Fetch leaderboard data
  const { data: leaderboard } = await supabase
    .from('profiles')
    .select('first_name, last_name, username, attendance_points')
    .order('attendance_points', { ascending: false })
    .limit(10)

  const dbRole = profile?.role || 'Member'

  // Map database role to UI role
  const getUIRole = (role: string): 'member' | 'exec' | 'rush' | 'admin' => {
    const r = role.toLowerCase()
    if (['corresponding secretary', 'treasurer', 'marshall', 'general chair'].includes(r)) {
      return 'exec'
    }
    if (r === 'rush chair') {
      return 'rush'
    }
    if (['regent', 'vice regent', 'scribe', 'website chair', 'web chair', 'website'].includes(r)) {
      return 'admin'
    }
    return 'member'
  }

  const userRole = getUIRole(dbRole)
  const showAnnouncement = false

  const firstName = profile?.first_name && profile.first_name !== 'TEMP'
    ? profile.first_name
    : (profile?.username || 'Brother');

  const authorDisplayName = profile?.first_name && profile.first_name !== 'TEMP'
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : (profile?.username || 'Brother');

  return (
    <div className="min-h-screen bg-background pt-10 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
            {profile?.role || 'Member'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Side: Modular System */}
          <div className="flex-1 space-y-8">

            {/* My Status Card */}
            {profile && (
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                  {/* Left Column: Status info and Points */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-6">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight mb-4">
                        My Status
                      </h2>

                      <div className="flex flex-col space-y-2">
                        {/* Dues Status */}
                        <div className="flex items-center gap-2 font-bold tracking-wider text-sm sm:text-base">
                          {profile.dues_paid ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-2 uppercase">
                              Dues <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span className="text-red-700 dark:text-red-500 flex items-center gap-2 uppercase">
                              Dues <XCircle className="h-6 w-6 stroke-[2.5]" />
                            </span>
                          )}
                        </div>

                        {/* Concessions Status */}
                        <div className="flex items-center gap-2 font-bold tracking-wider text-sm sm:text-base">
                          {profile.concessions_done ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-2 uppercase">
                              Concessions <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span className="text-red-700 dark:text-red-500 flex items-center gap-2 uppercase">
                              Concessions <XCircle className="h-6 w-6 stroke-[2.5]" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Points Counter */}
                    <div className="mt-2">
                      <div className="text-5xl sm:text-6xl font-bold text-red-800 dark:text-red-500 leading-none tracking-tight">
                        {profile.attendance_points || 0}
                      </div>
                      <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-gray-100 tracking-widest mt-1">
                        POINTS
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Staggered Medals */}
                  <div className="md:col-span-7 flex items-center justify-center">
                    <div className="relative w-full h-[320px] max-w-[420px] mx-auto -translate-x-6 sm:-translate-x-10">

                      {/* Brotherhood - Top Center */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2">
                        <Medal
                          earned={!!profile.brotherhood_met}
                          name="Brotherhood"
                          showLabel={false}
                        >
                          <img src="/images/medals/brotherhood.png" alt="Brotherhood" />
                        </Medal>
                      </div>

                      {/* Professional Development - Bottom Left (Higher and wider) */}
                      <div className="absolute top-[40%] left-0">
                        <Medal
                          earned={!!profile.prof_dev_met}
                          name="Professional Development"
                          showLabel={false}
                        >
                          <img src="/images/medals/pd.png" alt="Professional Development" />
                        </Medal>
                      </div>

                      {/* Community Service - Bottom Right (Higher and wider) */}
                      <div className="absolute top-[40%] right-0">
                        <Medal
                          earned={!!profile.comm_service_met}
                          name="Community Service"
                          showLabel={false}
                        >
                          <img src="/images/medals/community-service.png" alt="Community Service" />
                        </Medal>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Announcement Block (Toggleable) */}
            {showAnnouncement && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                <Megaphone className="h-6 w-6 text-red-700 dark:text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Important Announcement: Rush Voting</h3>
                  <p className="text-red-800 dark:text-red-300 mt-1 text-sm">
                    Mandatory rush voting will take place this Thursday at 7:00 PM in the main hall. Please review the candidate profiles before attending.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
                  <Users className="h-8 w-8 text-red-700 dark:text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Rush Management Tool</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Track PNM attendance and generate summaries for deliberations</p>
                  <a href="https://rmt.thetatauxi.org/" target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Open RMT &rarr;</a>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
                  <Users className="h-8 w-8 text-red-700 dark:text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Alumni Directory</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Access contact information for alumni</p>
                  <a href="#" target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">View Alumni &rarr;</a>
                </div>

              </div>

            </div>

            {/* Role Specific Section: E-Board */}
            {userRole === 'admin' && (
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-700 dark:text-red-500" />
                  E-Board Tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Manage Finances</h3>
                    <button className="text-sm text-red-700 hover:text-red-800 dark:text-red-400">Open Dashboard &rarr;</button>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Google Sheets Sync</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Sync member status, roster, calendar, and sheet data with Supabase.</p>
                    <SyncPanel userRole={dbRole} />
                  </div>
                </div>
              </div>
            )}

            {/* Role Specific Section: Rush */}
            {userRole === 'rush' && (
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-700 dark:text-red-500" />
                  Rush Tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Manage Rushees</h3>
                    <button className="text-sm text-red-700 hover:text-red-800 dark:text-red-400">Open Dashboard &rarr;</button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Side: Narrow Sidebar (Calendar & Links) */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">

            {/* Attendance Leaderboard */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-red-800 px-6 py-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-white" />
                <h2 className="text-lg font-semibold text-white">Attendance Leaderboard</h2>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[350px] overflow-y-auto">
                  {leaderboard && leaderboard.length > 0 ? (
                    leaderboard.map((member, index) => {
                      const displayName = member.first_name && member.first_name !== 'TEMP'
                        ? `${member.first_name} ${member.last_name}`
                        : member.username;
                      const isCurrentUser = member.username === profile?.username;
                      return (
                        <li key={member.username} className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${isCurrentUser ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400' :
                                index === 2 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'text-gray-400 dark:text-gray-500'
                              }`}>
                              {index + 1}
                            </span>
                            <span className={`text-sm ${isCurrentUser ? 'font-semibold text-red-900 dark:text-red-400' : 'text-gray-950 dark:text-gray-100'}`}>
                              {displayName}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {member.attendance_points || 0} pts
                          </span>
                        </li>
                      );
                    })
                  ) : (
                    <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No points recorded yet
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-red-800 px-6 py-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-white" />
                <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <li key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{event.title}</span>
                          <span className="text-xs text-red-700 dark:text-red-400 font-medium mt-1">{event.date}</span>
                          {event.location && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.location}</span>
                          )}
                          {event.details && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic bg-gray-50 dark:bg-zinc-800/70 p-2 rounded">
                              {event.details}
                            </p>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No upcoming events
                    </li>
                  )}
                </ul>
                <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 text-center">
                  <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-xs font-medium text-gray-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                    View full Google Calendar
                  </a>
                </div>
              </div>
            </div>

            {/* Important Links */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-red-700 dark:text-red-500" />
                Important Links
              </h2>
              <ul className="space-y-4">
                {importantLinks.length > 0 ? (
                  importantLinks.map((link) => (
                    <li key={link.id}>
                      <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        <LinkIcon className="h-4 w-4" />
                        {link.title}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 dark:text-gray-400">
                    No links available
                  </li>
                )}
              </ul>
            </div>

            {/* Community Links */}
            <CommunityLinks
              currentUserId={user.id}
              currentAuthorName={authorDisplayName}
              initialLinks={initialCommunityLinks}
            />

          </div>

        </div>
      </div>
    </div>
  )
}

