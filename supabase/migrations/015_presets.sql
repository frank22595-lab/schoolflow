-- =====================================================
-- Drop 12b: Grade Scale + Assessment Presets
-- =====================================================

-- =====================================================
-- APPLY A GRADE SCALE PRESET
-- Deletes any scale named same, creates new one, seeds bands
-- =====================================================
CREATE OR REPLACE FUNCTION apply_grade_scale_preset(p_school_id UUID, p_preset TEXT)
RETURNS UUID AS $$
DECLARE v_scale_id UUID;
BEGIN
  -- Mark all existing scales as not default
  UPDATE grade_scales SET is_default = false WHERE school_id = p_school_id;

  -- Delete existing preset with same name (idempotent)
  DELETE FROM grade_scales WHERE school_id = p_school_id AND name = CASE p_preset
    WHEN 'waec'       THEN 'WAEC Standard'
    WHEN 'letter'     THEN 'Simple Letter'
    WHEN 'percentage' THEN 'Percentage Bands'
    WHEN 'cambridge'  THEN 'Cambridge / British'
    WHEN 'primary'    THEN 'Primary School'
    WHEN 'gpa'        THEN 'University GPA'
    ELSE p_preset
  END;

  -- Create new scale
  INSERT INTO grade_scales (school_id, name, is_default)
  VALUES (p_school_id, CASE p_preset
    WHEN 'waec'       THEN 'WAEC Standard'
    WHEN 'letter'     THEN 'Simple Letter'
    WHEN 'percentage' THEN 'Percentage Bands'
    WHEN 'cambridge'  THEN 'Cambridge / British'
    WHEN 'primary'    THEN 'Primary School'
    WHEN 'gpa'        THEN 'University GPA'
    ELSE p_preset END, true)
  RETURNING id INTO v_scale_id;

  -- Seed bands based on preset
  IF p_preset = 'waec' THEN
    INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
      (v_scale_id, 'A1', 75, 100,  'Excellent', 4.0, 'emerald', 1),
      (v_scale_id, 'B2', 70, 74.99,'Very Good', 3.6, 'emerald', 2),
      (v_scale_id, 'B3', 65, 69.99,'Good',      3.2, 'sky',     3),
      (v_scale_id, 'C4', 60, 64.99,'Credit',    2.8, 'sky',     4),
      (v_scale_id, 'C5', 55, 59.99,'Credit',    2.4, 'indigo',  5),
      (v_scale_id, 'C6', 50, 54.99,'Credit',    2.0, 'indigo',  6),
      (v_scale_id, 'D7', 45, 49.99,'Pass',      1.6, 'amber',   7),
      (v_scale_id, 'E8', 40, 44.99,'Pass',      1.2, 'amber',   8),
      (v_scale_id, 'F9',  0, 39.99,'Fail',      0.0, 'red',     9);

  ELSIF p_preset = 'letter' THEN
    INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
      (v_scale_id, 'A', 80, 100,  'Excellent', 4.0, 'emerald', 1),
      (v_scale_id, 'B', 70, 79.99,'Very Good', 3.0, 'sky',     2),
      (v_scale_id, 'C', 60, 69.99,'Good',      2.0, 'indigo',  3),
      (v_scale_id, 'D', 50, 59.99,'Pass',      1.0, 'amber',   4),
      (v_scale_id, 'E', 40, 49.99,'Weak Pass', 0.5, 'amber',   5),
      (v_scale_id, 'F',  0, 39.99,'Fail',      0.0, 'red',     6);

  ELSIF p_preset = 'percentage' THEN
    INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
      (v_scale_id, 'Distinction', 75, 100,  'Distinction', 4.0, 'emerald', 1),
      (v_scale_id, 'Credit',      60, 74.99,'Credit',      3.0, 'sky',     2),
      (v_scale_id, 'Pass',        50, 59.99,'Pass',        2.0, 'indigo',  3),
      (v_scale_id, 'Weak Pass',   40, 49.99,'Weak Pass',   1.0, 'amber',   4),
      (v_scale_id, 'Fail',         0, 39.99,'Fail',        0.0, 'red',     5);

  ELSIF p_preset = 'cambridge' THEN
    INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
      (v_scale_id, 'A*', 90, 100,  'Outstanding', 4.0, 'emerald', 1),
      (v_scale_id, 'A',  80, 89.99,'Excellent',   3.7, 'emerald', 2),
      (v_scale_id, 'B',  70, 79.99,'Very Good',   3.0, 'sky',     3),
      (v_scale_id, 'C',  60, 69.99,'Good',        2.0, 'indigo',  4),
      (v_scale_id, 'D',  50, 59.99,'Satisfactory',1.0, 'amber',   5),
      (v_scale_id, 'E',  40, 49.99,'Marginal',    0.5, 'amber',   6),
      (v_scale_id, 'U',   0, 39.99,'Ungraded',    0.0, 'red',     7);

  ELSIF p_preset = 'primary' THEN
    INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
      (v_scale_id, 'Excellent',    80, 100,  'Excellent',    5.0, 'emerald', 1),
      (v_scale_id, 'Very Good',    70, 79.99,'Very Good',    4.0, 'emerald', 2),
      (v_scale_id, 'Good',         60, 69.99,'Good',         3.0, 'sky',     3),
      (v_scale_id, 'Fair',         50, 59.99,'Fair',         2.0, 'indigo',  4),
      (v_scale_id, 'Needs Effort', 40, 49.99,'Needs Effort', 1.0, 'amber',   5),
      (v_scale_id, 'Poor',          0, 39.99,'Poor',         0.0, 'red',     6);

  ELSIF p_preset = 'gpa' THEN
    INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
      (v_scale_id, 'A',  70, 100,  'Excellent',   4.0, 'emerald', 1),
      (v_scale_id, 'B+', 65, 69.99,'Very Good',   3.5, 'emerald', 2),
      (v_scale_id, 'B',  60, 64.99,'Good',        3.0, 'sky',     3),
      (v_scale_id, 'C+', 55, 59.99,'Fairly Good', 2.5, 'sky',     4),
      (v_scale_id, 'C',  50, 54.99,'Fair',        2.0, 'indigo',  5),
      (v_scale_id, 'D',  45, 49.99,'Pass',        1.0, 'amber',   6),
      (v_scale_id, 'F',   0, 44.99,'Fail',        0.0, 'red',     7);
  END IF;

  RETURN v_scale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- APPLY AN ASSESSMENT PRESET
-- Replaces all assessment types for a school
-- =====================================================
CREATE OR REPLACE FUNCTION apply_assessment_preset(p_school_id UUID, p_preset TEXT)
RETURNS INT AS $$
BEGIN
  -- Clear existing
  DELETE FROM assessment_types WHERE school_id = p_school_id;

  IF p_preset = 'standard' THEN
    INSERT INTO assessment_types (school_id, name, short_code, max_score, weight, sequence, is_exam) VALUES
      (p_school_id, 'First CA',  'CA1',  20, 20, 1, false),
      (p_school_id, 'Second CA', 'CA2',  20, 20, 2, false),
      (p_school_id, 'Exam',      'EXAM', 60, 60, 3, true);
    RETURN 3;

  ELSIF p_preset = 'two_cas' THEN
    INSERT INTO assessment_types (school_id, name, short_code, max_score, weight, sequence, is_exam) VALUES
      (p_school_id, 'Continuous Assessment', 'CA', 40, 40, 1, false),
      (p_school_id, 'Exam',                  'EXAM', 60, 60, 2, true);
    RETURN 2;

  ELSIF p_preset = 'with_project' THEN
    INSERT INTO assessment_types (school_id, name, short_code, max_score, weight, sequence, is_exam) VALUES
      (p_school_id, 'First CA',  'CA1',  15, 15, 1, false),
      (p_school_id, 'Second CA', 'CA2',  15, 15, 2, false),
      (p_school_id, 'Project',   'PRJ',  10, 10, 3, false),
      (p_school_id, 'Exam',      'EXAM', 60, 60, 4, true);
    RETURN 4;

  ELSIF p_preset = 'cambridge' THEN
    INSERT INTO assessment_types (school_id, name, short_code, max_score, weight, sequence, is_exam) VALUES
      (p_school_id, 'Coursework', 'CW',   40, 40, 1, false),
      (p_school_id, 'Exam',       'EXAM', 60, 60, 2, true);
    RETURN 2;

  ELSIF p_preset = 'four_cas' THEN
    INSERT INTO assessment_types (school_id, name, short_code, max_score, weight, sequence, is_exam) VALUES
      (p_school_id, 'CA 1', 'CA1',  10, 10, 1, false),
      (p_school_id, 'CA 2', 'CA2',  10, 10, 2, false),
      (p_school_id, 'CA 3', 'CA3',  10, 10, 3, false),
      (p_school_id, 'CA 4', 'CA4',  10, 10, 4, false),
      (p_school_id, 'Exam', 'EXAM', 60, 60, 5, true);
    RETURN 5;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
