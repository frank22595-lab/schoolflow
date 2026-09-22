import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });
    const schoolId = profile.school_id;

    const [{ data: exam }, { count: questionCount }] = await Promise.all([
      admin.from('exams').select('id, start_at, passing_score').eq('id', id).eq('school_id', schoolId).maybeSingle(),
      admin.from('exam_questions').select('id', { count: 'exact', head: true }).eq('exam_id', id),
    ]);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    if (!questionCount) return NextResponse.json({ error: 'Exam must have at least one question before publishing' }, { status: 400 });
    if (exam.passing_score === null || exam.passing_score === undefined) {
      return NextResponse.json({ error: 'Passing score must be set before publishing' }, { status: 400 });
    }

    const newStatus = exam.start_at && new Date(exam.start_at) > new Date() ? 'scheduled' : 'live';

    const { error } = await admin.from('exams').update({ status: newStatus }).eq('id', id);
    if (error) return NextResponse.json({ error: 'Publish failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
