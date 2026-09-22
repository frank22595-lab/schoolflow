import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { QUESTION_TYPES, DIFFICULTIES, type QuestionType } from '@/lib/exams';
import * as XLSX from 'xlsx';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 2000;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

type RawRow = Record<string, any>;
type ImportError = { row: number; error: string };

function str(v: any): string {
  return v === undefined || v === null ? '' : String(v).trim();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });
    const schoolId = profile.school_id;

    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 });
    if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: 'Please upload a .xlsx file' }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      return NextResponse.json({ error: 'Could not read file — is it a valid .xlsx?' }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return NextResponse.json({ error: 'Workbook has no sheets' }, { status: 400 });
    const rows: RawRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (rows.length === 0) return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
    if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Too many rows — max ${MAX_ROWS} per upload` }, { status: 400 });

    // ---- Reference data: subjects & class levels, case-insensitive by name ----
    const [{ data: subjects }, { data: classLevels }, { data: existingBanks }] = await Promise.all([
      admin.from('subjects').select('id, name').eq('school_id', schoolId).eq('is_active', true),
      admin.from('class_levels').select('id, name').eq('school_id', schoolId).eq('is_active', true),
      admin.from('question_banks').select('id, subject_id, class_level_id').eq('school_id', schoolId),
    ]);

    const subjectByName = new Map((subjects || []).map((s: any) => [s.name.toLowerCase(), s.id as string]));
    const classLevelByName = new Map((classLevels || []).map((c: any) => [c.name.toLowerCase(), c.id as string]));
    const bankByCombo = new Map((existingBanks || []).map((b: any) => [`${b.subject_id}|${b.class_level_id}`, b.id as string]));

    async function findOrCreateBank(subjectId: string, classLevelId: string): Promise<string> {
      const key = `${subjectId}|${classLevelId}`;
      const cached = bankByCombo.get(key);
      if (cached) return cached;
      const { data: bank, error } = await admin.from('question_banks')
        .insert({ school_id: schoolId, subject_id: subjectId, class_level_id: classLevelId, name: 'Default' })
        .select('id').single();
      if (error || !bank) throw new Error('Could not create question bank: ' + (error?.message || 'unknown error'));
      bankByCombo.set(key, bank.id);
      return bank.id;
    }

    let imported = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // account for header row
      const raw = rows[i];

      try {
        const subjectName = str(raw.subject);
        const classLevelName = str(raw.class_level);
        const questionType = str(raw.question_type).toLowerCase() as QuestionType;
        const questionText = str(raw.question_text);
        const rawDifficulty = str(raw.difficulty).toLowerCase();
        const topic = str(raw.topic) || null;
        const explanation = str(raw.explanation) || null;
        const rawPoints = parseFloat(str(raw.points));
        const points = Number.isFinite(rawPoints) && rawPoints > 0 ? rawPoints : 1;
        const difficulty = (DIFFICULTIES as readonly string[]).includes(rawDifficulty) ? rawDifficulty : 'medium';

        if (!subjectName) { errors.push({ row: rowNum, error: 'subject is required' }); continue; }
        const subjectId = subjectByName.get(subjectName.toLowerCase());
        if (!subjectId) { errors.push({ row: rowNum, error: `Subject "${subjectName}" not found` }); continue; }

        if (!classLevelName) { errors.push({ row: rowNum, error: 'class_level is required' }); continue; }
        const classLevelId = classLevelByName.get(classLevelName.toLowerCase());
        if (!classLevelId) { errors.push({ row: rowNum, error: `Class level "${classLevelName}" not found` }); continue; }

        if (!QUESTION_TYPES.includes(questionType)) {
          errors.push({ row: rowNum, error: `Invalid question_type "${raw.question_type}" — must be one of: ${QUESTION_TYPES.join(', ')}` });
          continue;
        }
        if (!questionText) { errors.push({ row: rowNum, error: 'question_text is required' }); continue; }

        let options: any = null;
        let correctAnswer: any = null;
        let acceptableAnswers: string[] | null = null;

        if (questionType === 'mcq_single' || questionType === 'mcq_multiple') {
          const optionTexts = OPTION_LETTERS.map(l => str(raw[`option_${l.toLowerCase()}`]));
          const filled = OPTION_LETTERS.map((l, idx) => ({ letter: l, text: optionTexts[idx] })).filter(o => o.text);
          if (filled.length < 2) { errors.push({ row: rowNum, error: 'At least 2 options (option_a..option_d) are required' }); continue; }

          const correctLetters = str(raw.correct_answer).toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
          const validLetters = correctLetters.filter(l => filled.some(f => f.letter === l));
          if (validLetters.length === 0) { errors.push({ row: rowNum, error: 'correct_answer must reference a filled option letter (A-D)' }); continue; }
          if (questionType === 'mcq_single' && validLetters.length > 1) {
            errors.push({ row: rowNum, error: 'mcq_single requires exactly one correct_answer letter' });
            continue;
          }

          options = filled.map(o => ({ id: o.letter.toLowerCase(), text: o.text, image_url: null, is_correct: validLetters.includes(o.letter) }));
        } else if (questionType === 'true_false') {
          const v = str(raw.correct_answer).toLowerCase();
          if (['true', 't', '1', 'yes'].includes(v)) correctAnswer = { correct: true };
          else if (['false', 'f', '0', 'no'].includes(v)) correctAnswer = { correct: false };
          else { errors.push({ row: rowNum, error: 'correct_answer must be TRUE or FALSE' }); continue; }
        } else if (questionType === 'fill_blank') {
          const answers = str(raw.correct_answer).split(';').map(s => s.trim()).filter(Boolean);
          if (answers.length === 0) { errors.push({ row: rowNum, error: 'At least one acceptable answer required (separate multiple with ;)' }); continue; }
          acceptableAnswers = answers;
        }
        // short_answer / essay: no answer payload — manually graded

        const bankId = await findOrCreateBank(subjectId, classLevelId);

        const { error: insertErr } = await admin.from('questions').insert({
          school_id: schoolId,
          bank_id: bankId,
          subject_id: subjectId,
          class_level_id: classLevelId,
          question_type: questionType,
          difficulty,
          topic,
          question_text: questionText,
          options,
          correct_answer: correctAnswer,
          acceptable_answers: acceptableAnswers,
          default_points: points,
          explanation,
          created_by: user.id,
        });
        if (insertErr) { errors.push({ row: rowNum, error: insertErr.message }); continue; }

        imported++;
      } catch (rowErr) {
        errors.push({ row: rowNum, error: rowErr instanceof Error ? rowErr.message : 'Unknown error' });
      }
    }

    return NextResponse.json({ success: true, imported, failed: errors.length, errors });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
