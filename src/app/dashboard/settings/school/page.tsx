import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SchoolProfileForm from '@/components/SchoolProfileForm';

export default async function SchoolProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('*, schools(*)').eq('id', user!.id).single();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/settings" className="hover:text-indigo">Settings</Link>
          <span className="text-gray-300">/</span>
          <span>School Profile</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">School Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Basic information about your school. This appears on receipts, report cards, and the public page.
        </p>
      </div>

      <SchoolProfileForm school={profile?.schools} />
    </div>
  );
}
