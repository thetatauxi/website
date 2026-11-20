import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMemberRosterAction } from '@/app/roster/actions';
import RosterClient from '@/app/roster/roster-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Member Roster | Theta Tau Xi Chapter',
  description: 'Full Active and PNM chapter roster with distribution insights, filtering, and export.',
};

export default async function MemberRosterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { members, isPnmUser, error } = await getMemberRosterAction();

  if (isPnmUser) {
    redirect('/attendance');
  }

  return <RosterClient initialMembers={members} error={error} />;
}
