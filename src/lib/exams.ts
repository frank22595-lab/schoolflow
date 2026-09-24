// Shared constants for the CBT question bank + exam builder API routes.

export const QUESTION_TYPES = [
  'mcq_single', 'mcq_multiple', 'true_false', 'fill_blank', 'short_answer', 'essay',
] as const;
export type QuestionType = typeof QUESTION_TYPES[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = typeof DIFFICULTIES[number];

export const EXAM_STATUSES = ['draft', 'scheduled', 'live', 'ended', 'archived'] as const;
export type ExamStatus = typeof EXAM_STATUSES[number];

// The exam fields ExamBuilder reads/writes directly (excludes id, school_id,
// status, total_points, timestamps — those are handled separately by each route).
// Named exactly as the exams table's real columns (verified against the live
// schema — see EXAM_FIELD_ALIASES for the one place the frontend's field name
// doesn't match).
export const EXAM_EDITABLE_FIELDS = [
  'name', 'description', 'instructions', 'subject_id', 'class_level_id', 'term_id',
  'duration_minutes', 'start_at', 'end_at', 'passing_score',
  'randomize_questions', 'randomize_options', 'show_result_immediately', 'allow_calculator',
  'attempts_allowed', 'require_fullscreen', 'prevent_copy_paste', 'detect_tab_switch',
  'auto_submit_on_time_up', 'auto_post_to_grades',
] as const;

// ExamBuilder.tsx's payload key -> the exams table's actual column name, for the
// one field where they diverge (the DB column is singular "result").
export const EXAM_FIELD_ALIASES: Record<string, string> = {
  show_results_immediately: 'show_result_immediately',
};

// default_points is the real column; aliased to `points` because every consumer
// (QuestionForm.tsx, the question bank list, ExamBuilder's picker) reads `.points`.
export const QUESTION_SELECT =
  '*, points:default_points, bank:question_banks(id, name, subject_id, class_level_id, subject:subjects(name), class_level:class_levels(name))';

// questions.acceptable_answers is a plain text[] in the DB, but QuestionForm.tsx
// and the question bank list both still read/write the older
// { acceptable_answers: string[], case_sensitive: boolean } wrapper shape.
// These translate between the two so the DB stays a plain array while the
// existing frontend contract keeps working unchanged.
export function unwrapAcceptableAnswers(input: any): string[] | null {
  let arr: any[] | null = null;
  if (Array.isArray(input)) arr = input;
  else if (input && typeof input === 'object' && Array.isArray(input.acceptable_answers)) arr = input.acceptable_answers;
  if (!arr) return null;
  const cleaned = arr.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
  return cleaned.length > 0 ? cleaned : null;
}

export function wrapAcceptableAnswers(raw: any): { acceptable_answers: string[]; case_sensitive: boolean } | null {
  const arr = unwrapAcceptableAnswers(raw);
  return arr ? { acceptable_answers: arr, case_sensitive: false } : null;
}

export function transformQuestionOut<T extends { acceptable_answers?: any }>(q: T): T {
  return { ...q, acceptable_answers: wrapAcceptableAnswers(q.acceptable_answers) };
}

export const EXAM_LIST_SELECT =
  '*, subject:subjects(name), class_level:class_levels(name), term:terms(name), exam_questions(count)';

export const EXAM_DETAIL_SELECT = `
  *,
  subject:subjects(id, name),
  class_level:class_levels(id, name),
  term:terms(id, name),
  exam_questions(
    id, points, order_index, question_id,
    question:questions(
      id, question_type, difficulty, topic, question_text, points:default_points,
      bank:question_banks(subject:subjects(id, name), class_level:class_levels(id, name))
    )
  )
`;
