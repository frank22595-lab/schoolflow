import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react';

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const [{ data: currentTerm }, { data: terms }] = await Promise.all([
    supabase.from('terms').select('*, sessions(name, is_current)').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('terms').select('*, sessions(name, is_current)').eq('school_id', schoolId).order('start_date', { ascending: false }).limit(15),
  ]);

  if (terms?.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            No terms found. <Link href="/dashboard/settings/academic" className="font-semibold underline">Set up sessions and terms</Link> first.
          </div>
        </div>
      </div>
    );
  }

  // If there's a current term and no other action, jump directly to its dashboard
  const currentTerms = terms?.filter(t => t.sessions?.is_current) || [];
  const pastTerms = terms?.filter(t => !t.sessions?.is_current) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Grades & Results</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Grades & Results</h1>
        <p className="text-gray-500 mt-1 text-sm">Pick a term to enter scores, behavior, comments, and print reports</p>
      </div>

      {currentTerm && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Current term
          </div>
          <Link href={`/dashboard/grades/term/${currentTerm.id}`}
            className="block bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 lg:p-5 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900">{currentTerm.name}</div>
                <div className="text-sm text-gray-600 mt-0.5">{currentTerm.sessions?.name}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      )}

      {currentTerms.filter(t => t.id !== currentTerm?.id).length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Other terms this session</div>
          <div className="space-y-2">
            {currentTerms.filter(t => t.id !== currentTerm?.id).map(t => (
              <TermCard key={t.id} term={t} />
            ))}
          </div>
        </div>
      )}

      {pastTerms.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Past terms</div>
          <div className="space-y-2">
            {pastTerms.map(t => <TermCard key={t.id} term={t} muted />)}
          </div>
        </div>
      )}
    </div>
  );
}

function TermCard({ term, muted }: any) {
  return (
    <Link href={`/dashboard/grades/term/${term.id}`}
      className={`block bg-white border border-gray-200 rounded-lg p-3 lg:p-4 hover:border-indigo hover:shadow-sm transition-all group ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{term.name}</div>
          <div className="text-xs text-gray-500">{term.sessions?.name}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
