'use client';

import { ReportTemplateProps } from './types';

export default function ModernMinimalTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, color,
}: ReportTemplateProps) {
  const primary = color?.primary || '#4f46e5';
  const accent = color?.accent || primary;
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();

  // Grade badge color
  const gradeColor = (grade: string) => {
    const g = grade?.toUpperCase() || '';
    if (g.startsWith('A')) return { bg: '#d1fae5', fg: '#065f46' };
    if (g === 'B2') return { bg: '#dbeafe', fg: '#1e40af' };
    if (g === 'B3') return { bg: '#e0e7ff', fg: '#3730a3' };
    if (g.startsWith('C')) return { bg: '#fef3c7', fg: '#92400e' };
    if (g === 'D7' || g === 'E8') return { bg: '#fed7aa', fg: '#9a3412' };
    if (g === 'F9') return { bg: '#fecaca', fg: '#991b1b' };
    return { bg: '#f3f4f6', fg: '#6b7280' };
  };

  const stars = (n: number) => {
    const full = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="report-page" style={{ '--primary': primary, '--accent': accent } as any}>
      <style>{`
        .report-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: white;
          padding: 12mm 14mm; box-sizing: border-box;
          font-family: 'Inter', -apple-system, sans-serif; color: #1f2937;
          font-size: 10.5px; line-height: 1.35;
          display: flex; flex-direction: column;
        }
        .report-page * { box-sizing: border-box; }
        .rp-header { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 3px solid var(--primary); margin-bottom: 8px; }
        .rp-logo { width: 56px; height: 56px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 20px; flex-shrink: 0; overflow: hidden; }
        .rp-logo img { width: 100%; height: 100%; object-fit: contain; }
        .rp-school h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #111827; line-height: 1.1; }
        .rp-school p { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .rp-school .motto { font-style: italic; color: var(--primary); font-size: 9px; margin-top: 2px; }
        .rp-title { text-align: center; padding: 5px 8px; background: linear-gradient(to right, color-mix(in srgb, var(--primary) 12%, white), color-mix(in srgb, var(--accent) 12%, white)); border-radius: 6px; margin-bottom: 8px; }
        .rp-title h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 13px; font-weight: 600; color: var(--primary); letter-spacing: 1.5px; }
        .rp-top { display: grid; grid-template-columns: 1fr 210px; gap: 8px; margin-bottom: 8px; }
        .rp-student { display: grid; grid-template-columns: 64px 1fr; gap: 10px; padding: 8px; background: #fafafa; border-radius: 6px; border: 1px solid #e5e7eb; }
        .rp-photo { width: 64px; height: 78px; border-radius: 6px; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, white), color-mix(in srgb, var(--accent) 30%, white)); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 22px; overflow: hidden; flex-shrink: 0; }
        .rp-photo img { width: 100%; height: 100%; object-fit: cover; }
        .rp-details { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; align-content: center; font-size: 10px; }
        .rp-details .name { grid-column: 1 / -1; font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 3px; }
        .rp-details .item { display: flex; gap: 4px; }
        .rp-details .label { color: #6b7280; font-weight: 500; min-width: 52px; }
        .rp-details .value { color: #111827; font-weight: 500; }
        .rp-pos-badge { background: #10b981; color: white; padding: 1px 6px; border-radius: 10px; font-size: 10px; font-weight: 700; }
        .rp-att { padding: 8px; background: #fafafa; border-radius: 6px; border: 1px solid #e5e7eb; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; align-content: center; }
        .rp-att-item { text-align: center; }
        .rp-att-item .num { font-size: 14px; font-weight: 700; color: var(--primary); line-height: 1.1; }
        .rp-att-item .lbl { font-size: 8px; color: #6b7280; letter-spacing: 0.3px; text-transform: uppercase; }
        .rp-section-hd { margin: 6px 0 4px; padding-bottom: 2px; border-bottom: 1.5px solid #e5e7eb; }
        .rp-section-hd h3 { font-size: 10px; font-weight: 700; color: var(--primary); letter-spacing: 1px; text-transform: uppercase; }
        .rp-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .rp-table thead th { background: var(--primary); color: white; padding: 4px; text-align: center; font-weight: 600; font-size: 9px; letter-spacing: 0.3px; }
        .rp-table thead th:first-child { text-align: left; padding-left: 8px; }
        .rp-table tbody td { padding: 3px 4px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .rp-table tbody td:first-child { text-align: left; padding-left: 8px; font-weight: 500; }
        .rp-table tbody tr:nth-child(even) { background: #fafafa; }
        .rp-grade { display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 700; font-size: 9px; font-family: 'JetBrains Mono', monospace; }
        .rp-table tfoot td { background: #f9fafb; padding: 5px 4px; font-weight: 700; border-top: 2px solid var(--primary); font-size: 10.5px; }
        .rp-mid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
        .rp-cum { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .rp-cum-cell { text-align: center; padding: 4px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; }
        .rp-cum-cell.current { background: color-mix(in srgb, var(--primary) 10%, white); border-color: var(--primary); }
        .rp-cum-cell .lbl { font-size: 8px; color: #6b7280; letter-spacing: 0.3px; text-transform: uppercase; }
        .rp-cum-cell .val { font-size: 12px; font-weight: 700; color: #111827; }
        .rp-cum-cell.current .val { color: var(--primary); }
        .rp-summary { padding: 6px 8px; background: linear-gradient(to right, color-mix(in srgb, var(--primary) 12%, white), color-mix(in srgb, var(--accent) 12%, white)); border-radius: 4px; border: 1px solid color-mix(in srgb, var(--primary) 30%, white); display: flex; align-items: center; justify-content: space-around; gap: 6px; }
        .rp-summary .item { text-align: center; }
        .rp-summary .lbl { font-size: 8px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.3px; }
        .rp-summary .val { font-size: 13px; font-weight: 700; color: var(--primary); }
        .rp-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rp-behavior h4 { font-size: 9px; color: #6b7280; font-weight: 600; margin-bottom: 2px; letter-spacing: 0.3px; text-transform: uppercase; }
        .rp-trait { display: flex; justify-content: space-between; align-items: center; padding: 1.5px 0; font-size: 10px; border-bottom: 1px dashed #f3f4f6; }
        .rp-stars { color: #fbbf24; font-size: 11px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }
        .rp-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .rp-comment { padding: 6px 8px; background: #fafafa; border-radius: 4px; border-left: 2px solid var(--primary); font-size: 10px; position: relative; }
        .rp-comment .label { font-size: 8px; color: #6b7280; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 2px; }
        .rp-comment .text { color: #1f2937; font-style: italic; line-height: 1.35; margin-bottom: 4px; }
        .rp-comment .sig { font-size: 9px; color: #6b7280; text-align: right; }
        .rp-comment .sig strong { color: var(--primary); }
        .rp-sig-img { max-height: 24px; max-width: 80px; float: right; margin-top: 2px; }
        .rp-stamp { position: absolute; right: 6px; bottom: 6px; width: 60px; height: 60px; opacity: 0.6; }
        .rp-stamp img { width: 100%; height: 100%; object-fit: contain; }
        .rp-footer { margin-top: auto; padding-top: 6px; border-top: 1.5px solid #e5e7eb; }
        .rp-scale { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-bottom: 6px; font-size: 8.5px; }
        .rp-scale-item { background: #f3f4f6; padding: 2px 5px; border-radius: 3px; color: #6b7280; }
        .rp-scale-item strong { color: #111827; font-family: 'JetBrains Mono', monospace; }
        .rp-ft-text { text-align: center; font-size: 9px; color: #6b7280; }
        .rp-ft-text .next { font-weight: 600; color: var(--primary); }
        .rp-ft-text .brand { font-size: 8px; color: #d1d5db; margin-top: 2px; }
        @media print {
          body { background: white !important; }
          .report-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="rp-header">
        <div className="rp-logo">
          {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
        </div>
        <div className="rp-school">
          <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
          <p>
            {[school.address, school.phone, school.email].filter(Boolean).join(' · ')}
          </p>
          {school.motto && <p className="motto">"{school.motto}"</p>}
        </div>
      </div>

      {/* Title */}
      <div className="rp-title">
        <h2>STUDENT ACADEMIC REPORT · {term.name?.toUpperCase()} · {term.session_name}</h2>
      </div>

      {/* Student + Attendance */}
      <div className="rp-top">
        <div className="rp-student">
          {settings?.show_photo !== false && (
            <div className="rp-photo">
              {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
            </div>
          )}
          <div className="rp-details">
            <div className="name">{fullName}</div>
            <div className="item"><span className="label">Adm No:</span><span className="value">{student.admission_number}</span></div>
            <div className="item"><span className="label">Class:</span><span className="value">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
            {student.gender && <div className="item"><span className="label">Gender:</span><span className="value">{student.gender}</span></div>}
            {settings?.show_house !== false && student.house && <div className="item"><span className="label">House:</span><span className="value">{student.house}</span></div>}
            {student.date_of_birth && <div className="item"><span className="label">DOB:</span><span className="value">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
            {settings?.show_position !== false && summary.position_in_class && (
              <div className="item"><span className="label">Position:</span><span className="value"><span className="rp-pos-badge">{ordinal(summary.position_in_class)} of {summary.students_in_class}</span></span></div>
            )}
          </div>
        </div>
        {settings?.show_attendance !== false && (
          <div className="rp-att">
            <div className="rp-att-item"><div className="num">{attendance?.present ?? '—'}</div><div className="lbl">Present</div></div>
            <div className="rp-att-item"><div className="num">{attendance?.absent ?? '—'}</div><div className="lbl">Absent</div></div>
            <div className="rp-att-item"><div className="num">{attendance?.late ?? '—'}</div><div className="lbl">Late</div></div>
            <div className="rp-att-item"><div className="num">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</div><div className="lbl">Rate</div></div>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="rp-section-hd"><h3>Academic Performance</h3></div>
      <table className="rp-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Subject</th>
            <th>CA1<br/>(20)</th>
            <th>CA2<br/>(20)</th>
            <th>Exam<br/>(60)</th>
            <th>Total<br/>(100)</th>
            <th>Grade</th>
            {settings?.show_subject_position !== false && <th>Pos</th>}
            {settings?.show_class_avg !== false && <th>Class Avg</th>}
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => {
            const gc = gradeColor(s.grade || '');
            return (
              <tr key={i}>
                <td>{s.subject_name}</td>
                <td>{s.ca1 ?? '—'}</td>
                <td>{s.ca2 ?? '—'}</td>
                <td>{s.exam ?? '—'}</td>
                <td><strong>{s.total ?? '—'}</strong></td>
                <td><span className="rp-grade" style={{ background: gc.bg, color: gc.fg }}>{s.grade || '—'}</span></td>
                {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
                {settings?.show_class_avg !== false && <td>{s.class_avg ? s.class_avg.toFixed(1) : '—'}</td>}
                <td>{s.remark || '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL / AVERAGE ({scores.length} subjects)</td>
            <td colSpan={3} style={{ textAlign: 'center', color: '#6b7280' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td><strong>{summary.average?.toFixed(1)}</strong></td>
            <td>{(() => { const gc = gradeColor(summary.overall_grade || ''); return <span className="rp-grade" style={{ background: gc.bg, color: gc.fg }}>{summary.overall_grade || '—'}</span>; })()}</td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 8 }}>Overall term performance</td>
          </tr>
        </tfoot>
      </table>

      {/* Cumulative + Summary */}
      {settings?.show_cumulative !== false && (
        <div className="rp-mid">
          <div>
            <div className="rp-section-hd"><h3>Cumulative</h3></div>
            <div className="rp-cum">
              <div className={`rp-cum-cell ${term.name?.includes('First') ? 'current' : ''}`}><div className="lbl">1st Term</div><div className="val">{cumulative?.term1_avg?.toFixed(1) || '—'}</div></div>
              <div className={`rp-cum-cell ${term.name?.includes('Second') ? 'current' : ''}`}><div className="lbl">2nd Term</div><div className="val">{cumulative?.term2_avg?.toFixed(1) || '—'}</div></div>
              <div className={`rp-cum-cell ${term.name?.includes('Third') ? 'current' : ''}`}><div className="lbl">3rd Term</div><div className="val">{cumulative?.term3_avg?.toFixed(1) || '—'}</div></div>
              <div className="rp-cum-cell"><div className="lbl">Overall</div><div className="val">{cumulative?.cumulative_avg?.toFixed(1) || '—'}</div></div>
            </div>
          </div>
          <div>
            <div className="rp-section-hd"><h3>Summary</h3></div>
            <div className="rp-summary">
              {settings?.show_position !== false && <div className="item"><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
              <div className="item"><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
              <div className="item"><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Behavior */}
      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="rp-section-hd"><h3>Behavior & Skills</h3></div>
          <div className="rp-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective (Character)</h4>
                {behavior.affective.slice(0, 7).map((t, i) => (
                  <div key={i} className="rp-trait"><span>{t.name}</span><span className="rp-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor (Skills)</h4>
                {behavior.psychomotor.slice(0, 7).map((t, i) => (
                  <div key={i} className="rp-trait"><span>{t.name}</span><span className="rp-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments */}
      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <>
          <div className="rp-section-hd"><h3>Remarks</h3></div>
          <div className="rp-comments">
            {settings?.show_teacher_comment !== false && (
              <div className="rp-comment">
                <div className="label">Class Teacher</div>
                <div className="text">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                <div className="sig"><strong>{comments?.teacher_name || 'Class Teacher'}</strong></div>
              </div>
            )}
            {settings?.show_principal_comment !== false && (
              <div className="rp-comment">
                <div className="label">Principal</div>
                <div className="text">"{comments?.principal_comment || 'Comment pending.'}"</div>
                <div className="sig">
                  {school.principal_signature_url && <img className="rp-sig-img" src={school.principal_signature_url} alt="Signature" />}
                  <div><strong>{school.principal_name || 'Principal'}</strong></div>
                </div>
                {school.stamp_url && <div className="rp-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="rp-footer">
        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="rp-scale">
            {grade_scale.map((g, i) => (
              <div key={i} className="rp-scale-item"><strong>{g.grade}</strong> {g.min}-{g.max}</div>
            ))}
          </div>
        )}
        <div className="rp-ft-text">
          {term.next_term_begins && <div className="next">Next Term Begins: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          <div className="brand">Computer-generated · SchoolFlow · schoolflow.ng</div>
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
