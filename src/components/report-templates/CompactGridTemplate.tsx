'use client';

import { ReportTemplateProps } from './types';

export default function CompactGridTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, color,
}: ReportTemplateProps) {
  const primary = color?.primary || '#0f766e'; // Teal default
  const accent = color?.accent || primary;
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const assessmentColumns = scores[0]?.breakdowns || [];

  const stars = (n: number) => {
    const full = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  const gradeColor = (grade: string) => {
    const g = grade?.toUpperCase() || '';
    if (g.startsWith('A')) return '#065f46';
    if (g === 'B2' || g === 'B3') return '#1e40af';
    if (g.startsWith('C')) return '#92400e';
    if (g === 'D7' || g === 'E8') return '#9a3412';
    if (g === 'F9') return '#991b1b';
    return '#6b7280';
  };

  return (
    <div className="cg-page" style={{ '--primary': primary, '--accent': accent } as any}>
      <style>{`
        .cg-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: white;
          padding: 10mm 12mm; box-sizing: border-box;
          font-family: 'Inter', 'Helvetica', sans-serif; color: #111827;
          font-size: 9.5px; line-height: 1.3;
          display: flex; flex-direction: column;
        }
        .cg-page * { box-sizing: border-box; }
        /* Compact header row */
        .cg-header { display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 10px; padding: 6px 8px; background: var(--primary); color: white; margin-bottom: 6px; }
        .cg-logo { width: 48px; height: 48px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 16px; overflow: hidden; }
        .cg-logo img { width: 100%; height: 100%; object-fit: contain; }
        .cg-school h1 { font-size: 17px; font-weight: 800; letter-spacing: 1px; line-height: 1; }
        .cg-school p { font-size: 9px; opacity: 0.9; margin-top: 2px; }
        .cg-report-tag { text-align: right; font-size: 9px; line-height: 1.2; }
        .cg-report-tag .term { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        /* Combined student + summary strip */
        .cg-strip { display: grid; grid-template-columns: 56px 1fr 200px; gap: 8px; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb; margin-bottom: 6px; }
        .cg-photo { width: 56px; height: 68px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); border-radius: 3px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 20px; overflow: hidden; }
        .cg-photo img { width: 100%; height: 100%; object-fit: cover; }
        .cg-details { align-content: center; }
        .cg-details .name { font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 3px; }
        .cg-details .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 8px; font-size: 9px; }
        .cg-details .fact { display: flex; gap: 3px; }
        .cg-details .fact .k { color: #6b7280; font-weight: 500; }
        .cg-details .fact .v { color: #111827; font-weight: 600; }
        .cg-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; align-content: center; }
        .cg-summary-cell { text-align: center; padding: 3px 2px; background: white; border: 1px solid #e5e7eb; border-radius: 2px; }
        .cg-summary-cell.hi { background: var(--primary); color: white; border-color: var(--primary); }
        .cg-summary-cell .num { font-size: 12px; font-weight: 700; line-height: 1; }
        .cg-summary-cell .lbl { font-size: 7px; letter-spacing: 0.3px; text-transform: uppercase; margin-top: 1px; opacity: 0.8; }
        /* Section headers - very compact */
        .cg-section-hd { display: flex; align-items: center; gap: 6px; margin: 5px 0 3px; }
        .cg-section-hd h3 { font-size: 8.5px; font-weight: 700; color: var(--primary); letter-spacing: 1.5px; text-transform: uppercase; }
        .cg-section-hd .line { flex: 1; height: 1px; background: var(--primary); opacity: 0.4; }
        /* Dense scores table */
        .cg-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .cg-table thead th { background: var(--primary); color: white; padding: 3px; text-align: center; font-weight: 600; font-size: 8px; letter-spacing: 0.3px; }
        .cg-table thead th:first-child { text-align: left; padding-left: 6px; }
        .cg-table tbody td { padding: 2.5px 3px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .cg-table tbody td:first-child { text-align: left; padding-left: 6px; font-weight: 500; }
        .cg-table tbody tr:nth-child(even) { background: #fafafa; }
        .cg-grade { font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 9px; }
        .cg-table tfoot td { background: #f3f4f6; padding: 4px 3px; font-weight: 700; border-top: 1.5px solid var(--primary); font-size: 9.5px; }
        /* Middle 3-column strip: cumulative + attendance + grade scale */
        .cg-mid3 { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; margin-top: 4px; }
        .cg-mini-panel { border: 1px solid #e5e7eb; padding: 4px 6px; background: #fafafa; }
        .cg-mini-title { font-size: 8px; font-weight: 700; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; padding-bottom: 2px; border-bottom: 1px solid #e5e7eb; }
        .cg-cum-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
        .cg-cum-cell { text-align: center; padding: 2px; background: white; border-radius: 2px; }
        .cg-cum-cell.current { background: var(--primary); color: white; }
        .cg-cum-cell .lbl { font-size: 7px; opacity: 0.7; }
        .cg-cum-cell .val { font-size: 10px; font-weight: 700; line-height: 1; }
        .cg-att-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
        .cg-att-cell { text-align: center; padding: 2px; background: white; }
        .cg-att-cell .num { font-size: 11px; font-weight: 700; color: var(--primary); }
        .cg-att-cell .lbl { font-size: 7px; color: #6b7280; letter-spacing: 0.3px; text-transform: uppercase; }
        .cg-scale-mini { display: flex; flex-wrap: wrap; gap: 2px; }
        .cg-scale-mini-item { padding: 1px 4px; background: white; border: 1px solid #e5e7eb; border-radius: 2px; font-size: 8px; }
        .cg-scale-mini-item strong { color: var(--primary); font-family: 'JetBrains Mono', monospace; }
        /* Behavior in 2 tight columns */
        .cg-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cg-behavior h4 { font-size: 8px; color: #6b7280; font-weight: 700; margin-bottom: 2px; letter-spacing: 0.3px; text-transform: uppercase; }
        .cg-trait { display: flex; justify-content: space-between; align-items: center; padding: 1px 0; font-size: 9px; border-bottom: 1px dotted #f3f4f6; }
        .cg-stars { color: #f59e0b; font-size: 10px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }
        /* Comments compact */
        .cg-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .cg-comment { padding: 5px 7px; background: #fafafa; border-left: 2px solid var(--primary); font-size: 9.5px; position: relative; }
        .cg-comment .label { font-size: 7.5px; color: #6b7280; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 2px; }
        .cg-comment .text { color: #1f2937; font-style: italic; line-height: 1.3; margin-bottom: 3px; }
        .cg-comment .sig { font-size: 8px; color: #6b7280; text-align: right; }
        .cg-comment .sig strong { color: var(--primary); }
        .cg-sig-img { max-height: 20px; max-width: 60px; }
        .cg-stamp { position: absolute; right: 4px; bottom: 4px; width: 45px; height: 45px; opacity: 0.5; }
        .cg-stamp img { width: 100%; height: 100%; object-fit: contain; }
        /* Footer */
        .cg-footer { margin-top: auto; padding-top: 6px; border-top: 1.5px solid var(--primary); text-align: center; font-size: 8.5px; color: #6b7280; }
        .cg-footer .next { font-weight: 700; color: var(--primary); }
        .cg-footer .brand { font-size: 7px; color: #d1d5db; margin-top: 2px; }
        @media print {
          body { background: white !important; }
          .cg-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Colored header bar */}
      <div className="cg-header">
        <div className="cg-logo">
          {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
        </div>
        <div className="cg-school">
          <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
          <p>{[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="cg-report-tag">
          <div className="term">{term.name?.toUpperCase()}</div>
          <div>{term.session_name}</div>
        </div>
      </div>

      {/* Student + Summary compact strip */}
      <div className="cg-strip">
        {settings?.show_photo !== false && (
          <div className="cg-photo">
            {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
          </div>
        )}
        <div className="cg-details">
          <div className="name">{fullName}</div>
          <div className="facts">
            <div className="fact"><span className="k">Adm:</span><span className="v">{student.admission_number}</span></div>
            <div className="fact"><span className="k">Class:</span><span className="v">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
            {student.gender && <div className="fact"><span className="k">Gender:</span><span className="v">{student.gender}</span></div>}
            {student.date_of_birth && <div className="fact"><span className="k">DOB:</span><span className="v">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
            {settings?.show_house !== false && student.house && <div className="fact"><span className="k">House:</span><span className="v">{student.house}</span></div>}
            <div className="fact"><span className="k">Subjects:</span><span className="v">{scores.length}</span></div>
          </div>
        </div>
        <div className="cg-summary-grid">
          <div className="cg-summary-cell hi">
            <div className="num">{summary.average?.toFixed(1) || '—'}</div>
            <div className="lbl">Average</div>
          </div>
          <div className="cg-summary-cell hi">
            <div className="num">{summary.overall_grade || '—'}</div>
            <div className="lbl">Grade</div>
          </div>
          {settings?.show_position !== false && (
            <div className="cg-summary-cell">
              <div className="num" style={{color: 'var(--primary)'}}>{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div>
              <div className="lbl" style={{color: '#6b7280'}}>Position</div>
            </div>
          )}
          <div className="cg-summary-cell">
            <div className="num" style={{color: 'var(--primary)'}}>{summary.total_marks}</div>
            <div className="lbl" style={{color: '#6b7280'}}>Total</div>
          </div>
        </div>
      </div>

      {/* Scores table */}
      <div className="cg-section-hd"><h3>Academic Performance</h3><div className="line"></div></div>
      <table className="cg-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Subject</th>
            {assessmentColumns.map((c, i) => <th key={i}>{c.name}<br/>{c.max}</th>)}
            <th>Tot<br/>100</th>
            <th>Grd</th>
            {settings?.show_subject_position !== false && <th>Pos</th>}
            {settings?.show_class_avg !== false && <th>Avg</th>}
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i}>
              <td>{s.subject_name}</td>
              {s.breakdowns.map((b, bi) => <td key={bi}>{b.score ?? '—'}</td>)}
              <td><strong>{s.total ?? '—'}</strong></td>
              <td><span className="cg-grade" style={{ color: gradeColor(s.grade || '') }}>{s.grade || '—'}</span></td>
              {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
              {settings?.show_class_avg !== false && <td>{s.class_avg ? s.class_avg.toFixed(1) : '—'}</td>}
              <td>{s.remark || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL ({scores.length})</td>
            <td colSpan={assessmentColumns.length} style={{ textAlign: 'center', color: '#6b7280' }}>{summary.total_marks}/{scores.length * 100}</td>
            <td><strong>{summary.average?.toFixed(1)}</strong></td>
            <td><span className="cg-grade" style={{ color: gradeColor(summary.overall_grade || '') }}>{summary.overall_grade || '—'}</span></td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 6 }}>Term Average</td>
          </tr>
        </tfoot>
      </table>

      {/* 3-col middle strip: cumulative + attendance + grade scale */}
      <div className="cg-mid3">
        {settings?.show_cumulative !== false && (
          <div className="cg-mini-panel">
            <div className="cg-mini-title">Cumulative</div>
            <div className="cg-cum-row">
              <div className={`cg-cum-cell ${term.name?.includes('First') ? 'current' : ''}`}><div className="lbl">T1</div><div className="val">{cumulative?.term1_avg?.toFixed(1) || '—'}</div></div>
              <div className={`cg-cum-cell ${term.name?.includes('Second') ? 'current' : ''}`}><div className="lbl">T2</div><div className="val">{cumulative?.term2_avg?.toFixed(1) || '—'}</div></div>
              <div className={`cg-cum-cell ${term.name?.includes('Third') ? 'current' : ''}`}><div className="lbl">T3</div><div className="val">{cumulative?.term3_avg?.toFixed(1) || '—'}</div></div>
              <div className="cg-cum-cell"><div className="lbl">Cum</div><div className="val">{cumulative?.cumulative_avg?.toFixed(1) || '—'}</div></div>
            </div>
          </div>
        )}
        {settings?.show_attendance !== false && (
          <div className="cg-mini-panel">
            <div className="cg-mini-title">Attendance</div>
            <div className="cg-att-grid">
              <div className="cg-att-cell"><div className="num">{attendance?.present ?? '—'}</div><div className="lbl">Pres</div></div>
              <div className="cg-att-cell"><div className="num">{attendance?.absent ?? '—'}</div><div className="lbl">Abs</div></div>
              <div className="cg-att-cell"><div className="num">{attendance?.late ?? '—'}</div><div className="lbl">Late</div></div>
              <div className="cg-att-cell"><div className="num">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</div><div className="lbl">Rate</div></div>
            </div>
          </div>
        )}
        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="cg-mini-panel">
            <div className="cg-mini-title">Grading Scale</div>
            <div className="cg-scale-mini">
              {grade_scale.map((g, i) => (
                <div key={i} className="cg-scale-mini-item"><strong>{g.grade}</strong> {g.min}-{g.max}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Behavior */}
      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="cg-section-hd"><h3>Behavior & Skills</h3><div className="line"></div></div>
          <div className="cg-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective (Character)</h4>
                {behavior.affective.slice(0, 7).map((t, i) => (
                  <div key={i} className="cg-trait"><span>{t.name}</span><span className="cg-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor (Skills)</h4>
                {behavior.psychomotor.slice(0, 7).map((t, i) => (
                  <div key={i} className="cg-trait"><span>{t.name}</span><span className="cg-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments */}
      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <>
          <div className="cg-section-hd"><h3>Remarks</h3><div className="line"></div></div>
          <div className="cg-comments">
            {settings?.show_teacher_comment !== false && (
              <div className="cg-comment">
                <div className="label">Class Teacher</div>
                <div className="text">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                <div className="sig"><strong>{comments?.teacher_name || 'Class Teacher'}</strong></div>
              </div>
            )}
            {settings?.show_principal_comment !== false && (
              <div className="cg-comment">
                <div className="label">Principal</div>
                <div className="text">"{comments?.principal_comment || 'Comment pending.'}"</div>
                <div className="sig">
                  {school.principal_signature_url && <img className="cg-sig-img" src={school.principal_signature_url} alt="Signature" />}
                  <div><strong>{school.principal_name || 'Principal'}</strong></div>
                </div>
                {school.stamp_url && <div className="cg-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="cg-footer">
        {term.next_term_begins && <div className="next">Next Term: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>}
        <div className="brand">SchoolFlow · schoolflow.ng</div>
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
