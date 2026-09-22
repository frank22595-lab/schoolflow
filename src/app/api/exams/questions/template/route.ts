import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

const HEADERS = [
  'subject', 'class_level', 'question_type', 'difficulty', 'topic', 'question_text',
  'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'points', 'explanation',
];

// 3 example rows per question type, so teachers can see the expected shape for each.
// correct_answer conventions:
//   mcq_single   -> one letter, e.g. "B"
//   mcq_multiple -> comma-separated letters, e.g. "A,C"
//   true_false   -> "TRUE" or "FALSE"
//   fill_blank   -> acceptable answers separated by ";"
//   short_answer / essay -> left blank (manually graded)
const EXAMPLE_ROWS: Array<Record<string, string | number>> = [
  { subject: 'Mathematics', class_level: 'JSS 1', question_type: 'mcq_single', difficulty: 'easy', topic: 'Basic Operations', question_text: 'What is 7 x 8?', option_a: '54', option_b: '56', option_c: '58', option_d: '60', correct_answer: 'B', points: 1, explanation: '7 multiplied by 8 equals 56.' },
  { subject: 'English Language', class_level: 'JSS 2', question_type: 'mcq_single', difficulty: 'medium', topic: 'Parts of Speech', question_text: 'Which of the following is a noun?', option_a: 'Run', option_b: 'Quickly', option_c: 'Teacher', option_d: 'Beautiful', correct_answer: 'C', points: 1, explanation: "'Teacher' is a naming word (noun)." },
  { subject: 'Basic Science', class_level: 'Primary 5', question_type: 'mcq_single', difficulty: 'easy', topic: 'Human Body', question_text: 'Which organ pumps blood around the body?', option_a: 'Lungs', option_b: 'Heart', option_c: 'Kidney', option_d: 'Liver', correct_answer: 'B', points: 2, explanation: 'The heart pumps blood through the circulatory system.' },

  { subject: 'Chemistry', class_level: 'SSS 2', question_type: 'mcq_multiple', difficulty: 'medium', topic: 'States of Matter', question_text: 'Which of the following are physical changes? (select all that apply)', option_a: 'Melting ice', option_b: 'Burning wood', option_c: 'Boiling water', option_d: 'Rusting iron', correct_answer: 'A,C', points: 2, explanation: 'Melting and boiling are physical changes; burning and rusting are chemical changes.' },
  { subject: 'Government', class_level: 'SSS 1', question_type: 'mcq_multiple', difficulty: 'medium', topic: 'Arms of Government', question_text: 'Which of these are arms of government in a democracy? (select all that apply)', option_a: 'Executive', option_b: 'Judiciary', option_c: 'Legislature', option_d: 'Monarchy', correct_answer: 'A,B,C', points: 2, explanation: 'The three arms of government are Executive, Legislature and Judiciary.' },
  { subject: 'Biology', class_level: 'SSS 3', question_type: 'mcq_multiple', difficulty: 'hard', topic: 'Classification', question_text: 'Which of these are vertebrates? (select all that apply)', option_a: 'Fish', option_b: 'Earthworm', option_c: 'Snake', option_d: 'Housefly', correct_answer: 'A,C', points: 2, explanation: 'Fish and snakes have a backbone; earthworms and houseflies are invertebrates.' },

  { subject: 'Basic Science', class_level: 'Primary 4', question_type: 'true_false', difficulty: 'easy', topic: 'Plants', question_text: 'Plants make their own food through photosynthesis.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'TRUE', points: 1, explanation: 'Photosynthesis lets plants produce food using sunlight.' },
  { subject: 'Mathematics', class_level: 'JSS 3', question_type: 'true_false', difficulty: 'medium', topic: 'Geometry', question_text: 'A triangle has four sides.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'FALSE', points: 1, explanation: 'A triangle has three sides, not four.' },
  { subject: 'History', class_level: 'SSS 1', question_type: 'true_false', difficulty: 'medium', topic: 'Nigerian History', question_text: 'Nigeria gained independence in 1960.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'TRUE', points: 1, explanation: "Nigeria became independent from Britain on 1 October 1960." },

  { subject: 'English Language', class_level: 'Primary 6', question_type: 'fill_blank', difficulty: 'easy', topic: 'Vocabulary', question_text: 'The capital city of Nigeria is ______.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'Abuja;abuja', points: 1, explanation: "Abuja has been Nigeria's capital since 1991." },
  { subject: 'Mathematics', class_level: 'JSS 1', question_type: 'fill_blank', difficulty: 'easy', topic: 'Fractions', question_text: 'Half of 20 is ______.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '10;ten', points: 1, explanation: '20 divided by 2 is 10.' },
  { subject: 'Chemistry', class_level: 'SSS 2', question_type: 'fill_blank', difficulty: 'medium', topic: 'Periodic Table', question_text: 'The chemical symbol for Sodium is ______.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'Na;na', points: 1, explanation: "Sodium's symbol comes from its Latin name, Natrium." },

  { subject: 'Literature-in-English', class_level: 'SSS 2', question_type: 'short_answer', difficulty: 'medium', topic: 'Poetry', question_text: "Briefly explain the theme of the poem 'The Road Not Taken'.", option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 5, explanation: 'Manually graded — award marks for mentioning choice and its consequences.' },
  { subject: 'Civic Education', class_level: 'JSS 3', question_type: 'short_answer', difficulty: 'medium', topic: 'Citizenship', question_text: 'State two responsibilities of a good citizen.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 4, explanation: 'Manually graded — accept any two valid responsibilities.' },
  { subject: 'Economics', class_level: 'SSS 1', question_type: 'short_answer', difficulty: 'easy', topic: 'Basic Concepts', question_text: "Define the term 'scarcity' in economics.", option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 3, explanation: 'Manually graded — look for the idea of limited resources vs unlimited wants.' },

  { subject: 'English Language', class_level: 'SSS 3', question_type: 'essay', difficulty: 'hard', topic: 'Composition', question_text: 'Write an essay on the causes and effects of examination malpractice in Nigerian schools.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 20, explanation: "Manually graded using the school's essay rubric." },
  { subject: 'Government', class_level: 'SSS 2', question_type: 'essay', difficulty: 'hard', topic: 'Democracy', question_text: 'Discuss the advantages and disadvantages of democracy as a system of government.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 20, explanation: 'Manually graded — assess structure, argument, and examples.' },
  { subject: 'Agricultural Science', class_level: 'SSS 1', question_type: 'essay', difficulty: 'medium', topic: 'Farming Systems', question_text: 'Compare and contrast subsistence farming and commercial farming.', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 15, explanation: 'Manually graded — award marks for accurate comparison points.' },
];

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = [HEADERS, ...EXAMPLE_ROWS.map(r => HEADERS.map(h => r[h]))];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 46 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="question_bank_template.xlsx"',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
