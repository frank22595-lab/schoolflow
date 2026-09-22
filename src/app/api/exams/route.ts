import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { EXAM_EDITABLE_FIELDS, EXAM_LIST_SELECT, EXAM_DETAIL_SELECT } from '@/lib/exams';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });

    const { data: rows, error } = await admin.from('exams')
      .select(EXAM_LIST_SELECT)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const exams = (rows || []).map((r: any) => ({
      ...r,
      question_count: r.exam_questions?.[0]?.count ?? 0,
      exam_questions: undefined,
    }));

    return NextResponse.json({ exams });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });
    const schoolId = profile.school_id;

    const body = await req.json();
    const { status, questions } = body;

    if (!body.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!body.subject_id) return NextResponse.json({ error: 'subject_id is required' }, { status: 400 });
    if (!body.class_level_id) return NextResponse.json({ error: 'class_level_id is required' }, { status: 400 });

    const [{ data: subject }, { data: classLevel }] = await Promise.all([
      admin.from('subjects').select('id').eq('id', body.subject_id).eq('school_id', schoolId).maybeSingle(),
      admin.from('class_levels').select('id').eq('id', body.class_level_id).eq('school_id', schoolId).maybeSingle(),
    ]);
    if (!subject) return NextResponse.json({ error: 'Subject not found in this school' }, { status: 400 });
    if (!classLevel) return NextResponse.json({ error: 'Class level not found in this school' }, { status: 400 });

    const insertRow: Record<string, any> = { school_id: schoolId, created_by: user.id };
    for (const field of EXAM_EDITABLE_FIELDS) {
      if (body[field] !== undefined) insertRow[field] = body[field];
    }
    if (status === 'draft' || status === 'scheduled') insertRow.status = status;

    const { data: exam, error: examErr } = await admin.from('exams').insert(insertRow).select('id').single();
    if (examErr) return NextResponse.json({ error: 'Create exam failed: ' + examErr.message }, { status: 400 });

    if (Array.isArray(questions) && questions.length > 0) {
      const rows = questions.map((q: any, i: number) => ({
        school_id: schoolId,
        exam_id: exam.id,
        question_id: q.question_id,
        display_order: q.display_order ?? i,
        points: q.points ?? 1,
      }));
      const { error: eqErr } = await admin.from('exam_questions').insert(rows);
      if (eqErr) {
        return NextResponse.json({
          error: 'Exam created but adding questions failed: ' + eqErr.message,
          examId: exam.id,
        }, { status: 500 });
      }
    }

    const { data: fullExam, error: fetchErr } = await admin.from('exams')
      .select(EXAM_DETAIL_SELECT)
      .eq('id', exam.id)
      .order('display_order', { referencedTable: 'exam_questions' })
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

    return NextResponse.json({ exam: fullExam });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
