import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { QUESTION_TYPES, DIFFICULTIES, QUESTION_SELECT, unwrapAcceptableAnswers, transformQuestionOut } from '@/lib/exams';

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

    const { data: question, error } = await admin.from('questions')
      .select(QUESTION_SELECT)
      .eq('id', id)
      .eq('school_id', schoolId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    return NextResponse.json({ question: transformQuestionOut(question) });
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

    const { data: existing } = await admin.from('questions').select('id, bank_id').eq('id', id).eq('school_id', schoolId).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const body = await req.json();
    const {
      bank_id, question_type, difficulty, topic, question_text, question_image_url,
      options, correct_answer, acceptable_answers, points, explanation,
    } = body;

    const update: Record<string, any> = {};

    if (bank_id !== undefined && bank_id !== existing.bank_id) {
      const { data: bank } = await admin.from('question_banks').select('id, subject_id, class_level_id').eq('id', bank_id).eq('school_id', schoolId).maybeSingle();
      if (!bank) return NextResponse.json({ error: 'Question bank not found in this school' }, { status: 400 });
      update.bank_id = bank_id;
      update.subject_id = bank.subject_id;
      update.class_level_id = bank.class_level_id;
    }
    if (question_type !== undefined) {
      if (!QUESTION_TYPES.includes(question_type)) return NextResponse.json({ error: 'Invalid question_type' }, { status: 400 });
      update.question_type = question_type;
    }
    if (difficulty !== undefined) update.difficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';
    if (topic !== undefined) update.topic = topic || null;
    if (question_text !== undefined) {
      if (!question_text?.trim()) return NextResponse.json({ error: 'question_text is required' }, { status: 400 });
      update.question_text = question_text;
    }
    if (question_image_url !== undefined) update.question_image_url = question_image_url || null;
    if (options !== undefined) update.options = options;
    if (correct_answer !== undefined) update.correct_answer = correct_answer;
    if (acceptable_answers !== undefined) update.acceptable_answers = unwrapAcceptableAnswers(acceptable_answers);
    if (points !== undefined) update.default_points = points;
    if (explanation !== undefined) update.explanation = explanation || null;

    const { data: question, error } = await admin.from('questions')
      .update(update)
      .eq('id', id)
      .select(QUESTION_SELECT)
      .single();
    if (error) return NextResponse.json({ error: 'Update failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ question: transformQuestionOut(question) });
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

    const { data: existing } = await admin.from('questions').select('id').eq('id', id).eq('school_id', schoolId).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    // Hard delete — the questions table has no is_active/soft-delete column.
    // If this question is referenced by exam_questions, that FK is expected
    // to cascade (see the exam builder migration).
    const { error } = await admin.from('questions').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
