import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { EXAM_EDITABLE_FIELDS, EXAM_DETAIL_SELECT } from '@/lib/exams';

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

    const { data: original } = await admin.from('exams').select('*, exam_questions(question_id, order_index, points)')
      .eq('id', id).eq('school_id', schoolId).maybeSingle();
    if (!original) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const insertRow: Record<string, any> = { school_id: schoolId, created_by: user.id, status: 'draft' };
    for (const field of EXAM_EDITABLE_FIELDS) insertRow[field] = (original as any)[field];
    insertRow.name = `${original.name} (Copy)`;

    const { data: copy, error: examErr } = await admin.from('exams').insert(insertRow).select('id').single();
    if (examErr) return NextResponse.json({ error: 'Duplicate failed: ' + examErr.message }, { status: 400 });

    const originalQuestions = (original as any).exam_questions || [];
    if (originalQuestions.length > 0) {
      const rows = originalQuestions.map((eq: any) => ({
        exam_id: copy.id,
        question_id: eq.question_id,
        order_index: eq.order_index,
        points: eq.points,
      }));
      const { error: eqErr } = await admin.from('exam_questions').insert(rows);
      if (eqErr) {
        return NextResponse.json({
          error: 'Exam duplicated but copying questions failed: ' + eqErr.message,
          examId: copy.id,
        }, { status: 500 });
      }
    }

    const { data: exam, error: fetchErr } = await admin.from('exams')
      .select(EXAM_DETAIL_SELECT)
      .eq('id', copy.id)
      .order('order_index', { referencedTable: 'exam_questions' })
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

    return NextResponse.json({ exam });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
