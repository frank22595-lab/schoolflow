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
export const EXAM_EDITABLE_FIELDS = [
  'name', 'description', 'instructions', 'subject_id', 'class_level_id', 'term_id',
  'duration_minutes', 'start_at', 'end_at', 'passing_score',
  'randomize_questions', 'randomize_options', 'show_results_immediately', 'allow_calculator',
  'attempts_allowed', 'require_fullscreen', 'prevent_copy_paste', 'detect_tab_switch',
  'auto_submit_on_time_up', 'auto_post_to_grades',
] as const;

export const EXAM_LIST_SELECT =
  '*, subject:subjects(name), class_level:class_levels(name), term:terms(name), exam_questions(count)';

export const EXAM_DETAIL_SELECT = `
  *,
  subject:subjects(id, name),
  class_level:class_levels(id, name),
  term:terms(id, name),
  exam_questions(
    id, points, display_order, question_id,
    question:questions(
      id, question_type, difficulty, topic, question_text, points,
      bank:question_banks(subject:subjects(id, name), class_level:class_levels(id, name))
    )
  )
`;
