import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { QUESTION_SELECT, transformQuestionOut } from '@/lib/exams';

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

    const { data: original } = await admin.from('questions').select('*').eq('id', id).eq('school_id', schoolId).maybeSingle();
    if (!original) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const { data: copy, error } = await admin.from('questions')
      .insert({
        school_id: original.school_id,
        bank_id: original.bank_id,
        subject_id: original.subject_id,
        class_level_id: original.class_level_id,
        passage_id: original.passage_id,
        question_type: original.question_type,
        difficulty: original.difficulty,
        topic: original.topic,
        question_text: `${original.question_text} (Copy)`,
        question_image_url: original.question_image_url,
        options: original.options,
        correct_answer: original.correct_answer,
        acceptable_answers: original.acceptable_answers,
        default_points: original.default_points,
        explanation: original.explanation,
        tags: original.tags,
        created_by: user.id,
      })
      .select(QUESTION_SELECT)
      .single();
    if (error) return NextResponse.json({ error: 'Duplicate failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ question: transformQuestionOut(copy) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
