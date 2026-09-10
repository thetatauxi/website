import React from 'react';
import LoadingLink from '@/components/ui/loading-link';
import { checkInWithQrCodeAction } from '@/app/attendance/actions';
import { CheckCircle2, XCircle, LogIn, ArrowRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    code: string;
  };
}

export default async function QrScanPage({ params }: PageProps) {
  const { code } = params;

  // Run the check-in server action
  const result = await checkInWithQrCodeAction(code);

  const formattedTime = result.scannedAt
    ? new Date(result.scannedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Unauthenticated State */}
        {result.status === 'unauthenticated' && (
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
              <LogIn className="h-10 w-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Member Authentication Required
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Sign In to Check In
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                Please log in with your Theta Tau member account to verify your identity and record your attendance.
              </p>
            </div>

            <div className="pt-2">
              <LoadingLink href={`/login?redirect=/attendance/scan/${code}`}>
                <Button className="w-full bg-red-700 hover:bg-red-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-md">
                  <span>Sign In with NetID</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </LoadingLink>
            </div>
          </div>
        )}

        {/* Inactive Event State */}
        {result.status === 'inactive' && (
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner animate-in bounce-in duration-300">
              <XCircle className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Check-In Closed
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {result.eventName || 'Event Check-In'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                {result.message || 'Check-in is currently closed for this event. Please ask the Scribe to activate it.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <LoadingLink href="/attendance">
                <Button variant="outline" className="w-full rounded-xl text-xs">
                  View My Attendance
                </Button>
              </LoadingLink>
              <LoadingLink href="/members-only">
                <Button variant="ghost" className="w-full text-xs text-gray-500">
                  Return to Member Portal
                </Button>
              </LoadingLink>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {result.status === 'not_found' && (
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
              <XCircle className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Invalid QR Code
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Event Not Found
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                This QR code does not correspond to an active chapter event.
              </p>
            </div>

            <div className="pt-2">
              <LoadingLink href="/attendance">
                <Button className="w-full bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs">
                  Go to Attendance Portal
                </Button>
              </LoadingLink>
            </div>
          </div>
        )}

        {/* Already Checked In State */}
        {result.status === 'already_checked_in' && (
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Already Recorded
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {result.eventName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                {result.message}
              </p>
              {formattedTime && (
                <div className="text-[11px] font-mono text-gray-400 mt-1">
                  Checked in at {formattedTime}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <LoadingLink href="/attendance">
                <Button className="w-full bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs h-11">
                  View Attendance Score
                </Button>
              </LoadingLink>
              <LoadingLink href="/members-only">
                <Button variant="ghost" className="w-full text-xs text-gray-500">
                  Return to Member Portal
                </Button>
              </LoadingLink>
            </div>
          </div>
        )}

        {/* Success State */}
        {result.status === 'success' && (
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Check-In Confirmed!
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
                {result.eventName}
              </h1>

              {/* Point Value Card */}
              {typeof result.points === 'number' && result.points > 0 ? (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-extrabold text-sm">
                    +{result.points} Attendance Point{result.points > 1 ? 's' : ''} Awarded
                  </span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Your attendance has been recorded for this event.
                </p>
              )}

              {formattedTime && (
                <div className="text-[11px] font-mono text-gray-400 mt-2">
                  Timestamp: {formattedTime}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <LoadingLink href="/attendance">
                <Button className="w-full bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs h-11 flex items-center justify-center gap-1.5 shadow-md">
                  <span>View Updated Score</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </LoadingLink>
              <LoadingLink href="/members-only">
                <Button variant="ghost" className="w-full text-xs text-gray-500">
                  Return to Member Portal
                </Button>
              </LoadingLink>
            </div>
          </div>
        )}

        {/* Error State */}
        {result.status === 'error' && (
          <div className="space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
              <XCircle className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Check-In Failed
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Unable to Record Attendance
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                {result.message || 'An error occurred while saving your attendance.'}
              </p>
            </div>

            <div className="pt-2">
              <LoadingLink href="/attendance">
                <Button variant="outline" className="w-full rounded-xl text-xs">
                  Go to Attendance
                </Button>
              </LoadingLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
