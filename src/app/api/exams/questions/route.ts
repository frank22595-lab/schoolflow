import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { QUESTION_TYPES, DIFFICULTIES, QUESTION_SELECT, unwrapAcceptableAnswers, transformQuestionOut } from '@/lib/exams';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subject_id');
    const classLevelId = searchParams.get('class_level_id');

    let query = admin.from('questions')
      .select(QUESTION_SELECT)
      .eq('school_id', profile.school_id);
    if (subjectId) query = query.eq('subject_id', subjectId);
    if (classLevelId) query = query.eq('class_level_id', classLevelId);

    const { data: questions, error } = await query.order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ questions: (questions || []).map(transformQuestionOut) });
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

    const {
      bank_id, question_type, difficulty, topic, question_text, question_image_url,
      options, correct_answer, acceptable_answers, points, explanation,
    } = await req.json();

    if (!bank_id) return NextResponse.json({ error: 'bank_id is required' }, { status: 400 });
    if (!QUESTION_TYPES.includes(question_type)) return NextResponse.json({ error: 'Invalid question_type' }, { status: 400 });
    if (!question_text?.trim()) return NextResponse.json({ error: 'question_text is required' }, { status: 400 });

    const { data: bank } = await admin.from('question_banks').select('id, subject_id, class_level_id').eq('id', bank_id).eq('school_id', schoolId).maybeSingle();
    if (!bank) return NextResponse.json({ error: 'Question bank not found in this school' }, { status: 400 });

    const { data: question, error } = await admin.from('questions')
      .insert({
        school_id: schoolId,
        bank_id,
        subject_id: bank.subject_id,
        class_level_id: bank.class_level_id,
        question_type,
        difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : 'medium',
        topic: topic || null,
        question_text,
        question_image_url: question_image_url || null,
        options: options ?? null,
        correct_answer: correct_answer ?? null,
        acceptable_answers: unwrapAcceptableAnswers(acceptable_answers),
        default_points: points ?? 1,
        explanation: explanation || null,
        created_by: user.id,
      })
      .select(QUESTION_SELECT)
      .single();
    if (error) return NextResponse.json({ error: 'Create question failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ question: transformQuestionOut(question) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
