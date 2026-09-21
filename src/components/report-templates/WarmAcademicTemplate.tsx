'use client';

import { ReportTemplateProps } from './types';

export default function WarmAcademicTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, color,
}: ReportTemplateProps) {
  const primary = color?.primary || '#7c2d12'; // Burgundy default
  const accent = color?.accent || '#a16207'; // Warm ochre
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const assessmentColumns = scores[0]?.breakdowns || [];

  const stars = (n: number) => {
    const full = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="wa-page" style={{ '--primary': primary, '--accent': accent } as any}>
      <style>{`
        .wa-page {
          width: 210mm; min-height: 297mm; margin: 0 auto;
          background: linear-gradient(180deg, #fefdf8, #fefaf1);
          padding: 12mm 14mm; box-sizing: border-box;
          font-family: 'Lora', 'Georgia', serif; color: #3f2f24;
          font-size: 10.5px; line-height: 1.4;
          display: flex; flex-direction: column;
        }
        .wa-page * { box-sizing: border-box; }
        /* Ornamental header */
        .wa-header { text-align: center; padding-bottom: 10px; margin-bottom: 8px; position: relative; }
        .wa-ornament { text-align: center; font-size: 14px; color: var(--accent); letter-spacing: 8px; margin-bottom: 4px; }
        .wa-header-inner { display: flex; align-items: center; justify-content: center; gap: 16px; }
        .wa-logo { width: 62px; height: 62px; border: 2px solid var(--primary); background: linear-gradient(135deg, #fef9ef, #fef3d7); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 22px; overflow: hidden; font-family: 'Playfair Display', serif; }
        .wa-logo img { width: 100%; height: 100%; object-fit: contain; }
        .wa-school h1 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--primary); letter-spacing: 2px; }
        .wa-school p { font-size: 10px; color: #6b5544; margin-top: 3px; font-style: italic; }
        .wa-school .motto { color: var(--accent); font-size: 10px; margin-top: 3px; font-family: 'Playfair Display', serif; font-style: italic; letter-spacing: 1px; }
        .wa-divider { text-align: center; font-size: 12px; color: var(--accent); letter-spacing: 6px; margin: 8px 0 6px; }
        /* Title */
        .wa-title { text-align: center; padding: 8px 0; margin-bottom: 10px; border-top: 2px solid var(--primary); border-bottom: 2px solid var(--primary); background: linear-gradient(to right, transparent, #fef3d7, transparent); }
        .wa-title h2 { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: var(--primary); letter-spacing: 4px; }
        .wa-title .sub { font-size: 11px; color: var(--accent); margin-top: 3px; letter-spacing: 2px; font-style: italic; font-family: 'Playfair Display', serif; }
        /* Student card */
        .wa-top { display: grid; grid-template-columns: 100px 1fr 190px; gap: 12px; margin-bottom: 10px; padding: 10px; background: linear-gradient(135deg, #fef9ef, white); border: 1px solid #e7d9c1; border-radius: 6px; }
        .wa-photo { width: 100px; height: 120px; border: 3px solid var(--primary); background: white; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 30px; overflow: hidden; font-family: 'Playfair Display', serif; box-shadow: 0 2px 4px rgba(124,45,18,0.15); }
        .wa-photo img { width: 100%; height: 100%; object-fit: cover; }
        .wa-details { align-content: center; display: grid; gap: 3px; font-size: 11px; }
        .wa-details .name { font-size: 15px; font-weight: 700; color: var(--primary); margin-bottom: 4px; font-family: 'Playfair Display', serif; letter-spacing: 1px; padding-bottom: 4px; border-bottom: 1px dashed var(--accent); }
        .wa-details .row { display: grid; grid-template-columns: 110px 1fr; }
        .wa-details .label { color: #6b5544; font-weight: 500; font-style: italic; }
        .wa-details .value { color: var(--primary); font-weight: 600; font-family: 'Playfair Display', serif; }
        .wa-att-panel { border: 1px solid var(--accent); border-radius: 4px; padding: 6px; background: linear-gradient(135deg, white, #fef3d7); }
        .wa-att-title { text-align: center; font-size: 9px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; padding-bottom: 4px; border-bottom: 1px solid var(--accent); margin-bottom: 5px; font-family: 'Playfair Display', serif; }
        .wa-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
        .wa-att-cell { text-align: center; padding: 2px; }
        .wa-att-cell .num { font-size: 14px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; }
        .wa-att-cell .lbl { font-size: 8px; color: #6b5544; letter-spacing: 0.5px; text-transform: uppercase; font-style: italic; }
        /* Section headers */
        .wa-section-hd { text-align: center; margin: 8px 0 4px; padding: 4px 0; position: relative; }
        .wa-section-hd h3 { font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 700; color: var(--primary); letter-spacing: 3px; text-transform: uppercase; background: linear-gradient(180deg, #fefdf8, #fefaf1); padding: 0 12px; display: inline-block; position: relative; z-index: 1; }
        .wa-section-hd::before { content: ''; position: absolute; left: 15%; right: 15%; top: 50%; height: 1px; background: var(--primary); z-index: 0; }
        /* Table */
        .wa-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .wa-table thead th { background: var(--primary); color: #fef9ef; padding: 5px 4px; text-align: center; font-weight: 600; font-size: 9.5px; letter-spacing: 0.5px; font-family: 'Playfair Display', serif; text-transform: uppercase; }
        .wa-table thead th:first-child { text-align: left; padding-left: 8px; }
        .wa-table tbody td { padding: 4px; text-align: center; border-bottom: 1px solid #e7d9c1; }
        .wa-table tbody td:first-child { text-align: left; padding-left: 8px; font-weight: 500; }
        .wa-table tbody tr:nth-child(even) { background: #fef9ef; }
        .wa-grade { display: inline-block; padding: 1px 6px; border: 1px solid var(--accent); border-radius: 3px; font-weight: 700; font-size: 10px; color: var(--primary); background: white; font-family: 'Playfair Display', serif; }
        .wa-grade.fail { color: #7f1d1d; border-color: #7f1d1d; background: #fee2e2; }
        .wa-table tfoot td { background: linear-gradient(to right, #fef3d7, white, #fef3d7); padding: 6px 4px; font-weight: 700; border-top: 2px solid var(--primary); border-bottom: 2px solid var(--primary); font-size: 11px; color: var(--primary); font-family: 'Playfair Display', serif; }
        /* Mid strip */
        .wa-mid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; margin-top: 6px; }
        .wa-cum-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .wa-cum-table th, .wa-cum-table td { padding: 4px; text-align: center; border: 1px solid var(--accent); }
        .wa-cum-table th { background: var(--primary); color: #fef9ef; font-weight: 600; font-size: 9px; letter-spacing: 0.5px; text-transform: uppercase; font-family: 'Playfair Display', serif; }
        .wa-cum-table td.current { background: #fef3d7; color: var(--primary); font-weight: 700; font-family: 'Playfair Display', serif; }
        .wa-summary-box { border: 2px solid var(--primary); border-radius: 6px; padding: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; background: linear-gradient(135deg, #fef9ef, white); }
        .wa-summary-box .lbl { font-size: 9px; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; font-style: italic; }
        .wa-summary-box .val { font-size: 18px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1px; }
        /* Behavior */
        .wa-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 8px; background: linear-gradient(135deg, #fef9ef, white); border: 1px solid #e7d9c1; border-radius: 4px; }
        .wa-behavior h4 { font-size: 10px; color: var(--primary); font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; text-transform: uppercase; text-align: center; padding-bottom: 3px; border-bottom: 1px dashed var(--accent); font-family: 'Playfair Display', serif; }
        .wa-trait { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px; font-size: 10.5px; border-bottom: 1px dotted #e7d9c1; }
        .wa-stars { color: var(--accent); font-size: 12px; letter-spacing: 1px; line-height: 1; font-family: sans-serif; }
        /* Comments */
        .wa-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .wa-comment { padding: 10px; border: 1px solid var(--primary); border-radius: 4px; background: linear-gradient(135deg, white, #fef9ef); font-size: 11px; position: relative; min-height: 65px; }
        .wa-comment .label { font-size: 9px; color: var(--primary); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px dashed var(--accent); font-family: 'Playfair Display', serif; }
        .wa-comment .text { color: #3f2f24; font-style: italic; line-height: 1.45; margin-bottom: 5px; }
        .wa-comment .sig-row { border-top: 1px dotted var(--accent); padding-top: 4px; text-align: right; font-size: 9.5px; color: #6b5544; font-style: italic; }
        .wa-comment .sig-row strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 11px; font-style: normal; letter-spacing: 0.5px; }
        .wa-sig-img { max-height: 22px; max-width: 75px; }
        .wa-stamp { position: absolute; right: 8px; bottom: 8px; width: 62px; height: 62px; opacity: 0.55; }
        .wa-stamp img { width: 100%; height: 100%; object-fit: contain; }
        /* Footer */
        .wa-footer { margin-top: auto; padding-top: 8px; border-top: 2px solid var(--primary); }
        .wa-scale { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-bottom: 6px; font-size: 9.5px; }
        .wa-scale-item { padding: 2px 7px; border: 1px solid var(--accent); border-radius: 3px; color: #6b5544; background: white; }
        .wa-scale-item strong { color: var(--primary); font-family: 'Playfair Display', serif; }
        .wa-ft-text { text-align: center; font-size: 10px; color: #6b5544; font-style: italic; }
        .wa-ft-text .next { font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1.5px; font-style: normal; }
        .wa-ft-text .brand { font-size: 8px; color: #a89060; margin-top: 3px; letter-spacing: 1px; }
        .wa-ornament-bottom { text-align: center; font-size: 12px; color: var(--accent); letter-spacing: 6px; margin-top: 4px; }
        @media print {
          body { background: white !important; }
          .wa-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="wa-header">
        <div className="wa-ornament">❦ ✦ ❦</div>
        <div className="wa-header-inner">
          <div className="wa-logo">
            {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
          </div>
          <div className="wa-school">
            <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
            <p>{[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</p>
            {school.motto && <p className="motto">"{school.motto}"</p>}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="wa-title">
        <h2>STUDENT ACADEMIC REPORT</h2>
        <div className="sub">{term.name} · {term.session_name} Academic Session</div>
      </div>

      {/* Student card */}
      <div className="wa-top">
        {settings?.show_photo !== false && (
          <div className="wa-photo">
            {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
          </div>
        )}
        <div className="wa-details">
          <div className="name">{fullName}</div>
          <div className="row"><span className="label">Admission No:</span><span className="value">{student.admission_number}</span></div>
          <div className="row"><span className="label">Class:</span><span className="value">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
          {student.gender && <div className="row"><span className="label">Gender:</span><span className="value">{student.gender}</span></div>}
          {student.date_of_birth && <div className="row"><span className="label">Date of Birth:</span><span className="value">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
          {settings?.show_house !== false && student.house && <div className="row"><span className="label">House:</span><span className="value">{student.house}</span></div>}
          {settings?.show_position !== false && summary.position_in_class && (
            <div className="row"><span className="label">Class Position:</span><span className="value">{ordinal(summary.position_in_class)} of {summary.students_in_class}</span></div>
          )}
        </div>
        {settings?.show_attendance !== false && (
          <div className="wa-att-panel">
            <div className="wa-att-title">Attendance</div>
            <div className="wa-att-grid">
              <div className="wa-att-cell"><div className="num">{attendance?.present ?? '—'}</div><div className="lbl">Present</div></div>
              <div className="wa-att-cell"><div className="num">{attendance?.absent ?? '—'}</div><div className="lbl">Absent</div></div>
              <div className="wa-att-cell"><div className="num">{attendance?.late ?? '—'}</div><div className="lbl">Late</div></div>
              <div className="wa-att-cell"><div className="num">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</div><div className="lbl">Rate</div></div>
            </div>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="wa-section-hd"><h3>Academic Performance</h3></div>
      <table className="wa-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Subject</th>
            {assessmentColumns.map((c, i) => <th key={i}>{c.name}<br/>({c.max})</th>)}
            <th>Total<br/>(100)</th>
            <th>Grade</th>
            {settings?.show_subject_position !== false && <th>Position</th>}
            {settings?.show_class_avg !== false && <th>Class Avg</th>}
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => {
            const isFail = s.grade === 'F9';
            return (
              <tr key={i}>
                <td>{s.subject_name}</td>
                {s.breakdowns.map((b, bi) => <td key={bi}>{b.score ?? '—'}</td>)}
                <td><strong>{s.total ?? '—'}</strong></td>
                <td><span className={`wa-grade ${isFail ? 'fail' : ''}`}>{s.grade || '—'}</span></td>
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
            <td colSpan={assessmentColumns.length} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td>{summary.average?.toFixed(1)}</td>
            <td><span className="wa-grade">{summary.overall_grade || '—'}</span></td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 8 }}>Overall Performance</td>
          </tr>
        </tfoot>
      </table>

      {/* Cumulative + Summary */}
      {settings?.show_cumulative !== false && (
        <div className="wa-mid">
          <table className="wa-cum-table">
            <thead>
              <tr>
                <th>1st Term</th>
                <th>2nd Term</th>
                <th>3rd Term</th>
                <th>Cumulative</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={term.name?.includes('First') ? 'current' : ''}>{cumulative?.term1_avg?.toFixed(1) || '—'}</td>
                <td className={term.name?.includes('Second') ? 'current' : ''}>{cumulative?.term2_avg?.toFixed(1) || '—'}</td>
                <td className={term.name?.includes('Third') ? 'current' : ''}>{cumulative?.term3_avg?.toFixed(1) || '—'}</td>
                <td>{cumulative?.cumulative_avg?.toFixed(1) || '—'}</td>
              </tr>
            </tbody>
          </table>
          <div className="wa-summary-box">
            {settings?.show_position !== false && <div><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
            <div><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
            <div><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
          </div>
        </div>
      )}

      {/* Behavior */}
      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="wa-section-hd"><h3>Character & Skills</h3></div>
          <div className="wa-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective Domain</h4>
                {behavior.affective.slice(0, 7).map((t, i) => (
                  <div key={i} className="wa-trait"><span>{t.name}</span><span className="wa-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor Domain</h4>
                {behavior.psychomotor.slice(0, 7).map((t, i) => (
                  <div key={i} className="wa-trait"><span>{t.name}</span><span className="wa-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments */}
      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <>
          <div className="wa-section-hd"><h3>Remarks</h3></div>
          <div className="wa-comments">
            {settings?.show_teacher_comment !== false && (
              <div className="wa-comment">
                <div className="label">Class Teacher's Note</div>
                <div className="text">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                <div className="sig-row"><strong>{comments?.teacher_name || 'Class Teacher'}</strong></div>
              </div>
            )}
            {settings?.show_principal_comment !== false && (
              <div className="wa-comment">
                <div className="label">Principal's Note</div>
                <div className="text">"{comments?.principal_comment || 'Comment pending.'}"</div>
                <div className="sig-row">
                  {school.principal_signature_url && <img className="wa-sig-img" src={school.principal_signature_url} alt="Signature" />}
                  <div><strong>{school.principal_name || 'The Principal'}</strong></div>
                </div>
                {school.stamp_url && <div className="wa-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="wa-footer">
        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="wa-scale">
            {grade_scale.map((g, i) => (
              <div key={i} className="wa-scale-item"><strong>{g.grade}</strong> {g.min}–{g.max}{g.remark ? ` · ${g.remark}` : ''}</div>
            ))}
          </div>
        )}
        <div className="wa-ft-text">
          {term.next_term_begins && <div className="next">Next Term Begins: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          <div className="brand">SchoolFlow · Nurturing Excellence</div>
        </div>
        <div className="wa-ornament-bottom">❦ ✦ ❦</div>
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
