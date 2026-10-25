import { getAlumniListAction } from '@/app/alumni/actions';
import AlumniClient from '@/app/alumni/alumni-client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alumni Directory | Theta Tau Xi Chapter',
  description: 'Theta Tau Xi Chapter Alumni Database and Contact Network',
};

export default async function AlumniPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role || '').toLowerCase();
  const isOfficer = [
    'regent', 'vice regent', 'corresponding secretary', 'scribe',
    'treasurer', 'marshal', 'general chair', 'admin', 'website chair', 'web chair', 'website'
  ].includes(userRole);

  const { alumni } = await getAlumniListAction();

  return (
    <AlumniClient
      initialAlumni={alumni}
      isOfficer={isOfficer}
    />
  );
}
