import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { EXAM_EDITABLE_FIELDS, EXAM_FIELD_ALIASES, EXAM_STATUSES, EXAM_DETAIL_SELECT } from '@/lib/exams';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resolveSchoolId(userId: string) {
  const { data: profile } = await admin.from('users').select('school_id').eq('id', userId).single();
  return profile?.school_id as string | undefined;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const schoolId = await resolveSchoolId(user.id);
    if (!schoolId) return NextResponse.json({ error: 'No school' }, { status: 403 });

    const { data: exam, error } = await admin.from('exams')
      .select(EXAM_DETAIL_SELECT)
      .eq('id', id)
      .eq('school_id', schoolId)
      .order('order_index', { referencedTable: 'exam_questions' })
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    return NextResponse.json({ exam });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const schoolId = await resolveSchoolId(user.id);
    if (!schoolId) return NextResponse.json({ error: 'No school' }, { status: 403 });

    const { data: existing } = await admin.from('exams').select('id').eq('id', id).eq('school_id', schoolId).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const body = await req.json();
    const { status, questions } = body;

    if (body.subject_id !== undefined || body.class_level_id !== undefined) {
      const subjectId = body.subject_id;
      const classLevelId = body.class_level_id;
      const checks = await Promise.all([
        subjectId ? admin.from('subjects').select('id').eq('id', subjectId).eq('school_id', schoolId).maybeSingle() : Promise.resolve({ data: { id: true } }),
        classLevelId ? admin.from('class_levels').select('id').eq('id', classLevelId).eq('school_id', schoolId).maybeSingle() : Promise.resolve({ data: { id: true } }),
      ]);
      if (subjectId && !checks[0].data) return NextResponse.json({ error: 'Subject not found in this school' }, { status: 400 });
      if (classLevelId && !checks[1].data) return NextResponse.json({ error: 'Class level not found in this school' }, { status: 400 });
    }

    const update: Record<string, any> = {};
    for (const field of EXAM_EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }
    for (const [alias, dbField] of Object.entries(EXAM_FIELD_ALIASES)) {
      if (body[alias] !== undefined && update[dbField] === undefined) update[dbField] = body[alias];
    }
    if (status !== undefined) {
      if (!EXAM_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      update.status = status;
    }

    if (Object.keys(update).length > 0) {
      const { error: updateErr } = await admin.from('exams').update(update).eq('id', id);
      if (updateErr) return NextResponse.json({ error: 'Update failed: ' + updateErr.message }, { status: 400 });
    }

    if (Array.isArray(questions)) {
      const { error: delErr } = await admin.from('exam_questions').delete().eq('exam_id', id);
      if (delErr) return NextResponse.json({ error: 'Sync questions failed: ' + delErr.message }, { status: 400 });

      if (questions.length > 0) {
        const rows = questions.map((q: any, i: number) => ({
          exam_id: id,
          question_id: q.question_id,
          order_index: q.display_order ?? i,
          points: q.points ?? 1,
        }));
        const { error: insErr } = await admin.from('exam_questions').insert(rows);
        if (insErr) return NextResponse.json({ error: 'Sync questions failed: ' + insErr.message }, { status: 400 });
      }
    }

    const { data: exam, error: fetchErr } = await admin.from('exams')
      .select(EXAM_DETAIL_SELECT)
      .eq('id', id)
      .order('order_index', { referencedTable: 'exam_questions' })
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

    return NextResponse.json({ exam });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const schoolId = await resolveSchoolId(user.id);
    if (!schoolId) return NextResponse.json({ error: 'No school' }, { status: 403 });

    const { data: existing } = await admin.from('exams').select('id').eq('id', id).eq('school_id', schoolId).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // Hard delete — exam_questions cascades via FK.
    const { error } = await admin.from('exams').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
