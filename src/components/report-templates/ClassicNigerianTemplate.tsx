'use client';

import { ReportTemplateProps } from './types';

export default function ClassicNigerianTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, color,
}: ReportTemplateProps) {
  const primary = color?.primary || '#1e3a8a';
  const accent = color?.accent || primary;
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();

  const stars = (n: number) => {
    const full = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="cn-page" style={{ '--primary': primary, '--accent': accent } as any}>
      <style>{`
        .cn-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: white;
          padding: 12mm 14mm; box-sizing: border-box;
          font-family: 'Georgia', 'Times New Roman', serif; color: #1f2937;
          font-size: 10.5px; line-height: 1.35;
          display: flex; flex-direction: column;
          border: 3px double var(--primary);
        }
        .cn-page * { box-sizing: border-box; }
        .cn-header { text-align: center; padding-bottom: 8px; border-bottom: 2px solid var(--primary); margin-bottom: 10px; display: grid; grid-template-columns: 70px 1fr 70px; align-items: center; gap: 12px; }
        .cn-logo { width: 64px; height: 64px; border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 22px; overflow: hidden; background: white; }
        .cn-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        .cn-school h1 { font-family: 'Playfair Display', 'Georgia', serif; font-size: 22px; font-weight: 700; color: var(--primary); letter-spacing: 2px; }
        .cn-school p { font-size: 10px; color: #4b5563; margin-top: 3px; font-style: italic; }
        .cn-school .motto { color: var(--primary); font-size: 9px; margin-top: 3px; font-weight: 600; letter-spacing: 1px; }
        .cn-badge { width: 60px; height: 60px; border: 1px solid #d1d5db; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 8px; text-align: center; }
        .cn-title { text-align: center; margin-bottom: 10px; padding: 6px 0; border-top: 1px solid var(--primary); border-bottom: 1px solid var(--primary); background: color-mix(in srgb, var(--primary) 5%, white); }
        .cn-title h2 { font-family: 'Playfair Display', 'Georgia', serif; font-size: 14px; font-weight: 700; color: var(--primary); letter-spacing: 3px; }
        .cn-title .sub { font-size: 10px; color: #4b5563; margin-top: 2px; font-style: italic; letter-spacing: 1px; }
        .cn-top { display: grid; grid-template-columns: 90px 1fr 200px; gap: 10px; margin-bottom: 10px; padding: 10px; border: 1px solid var(--primary); background: color-mix(in srgb, var(--primary) 3%, white); }
        .cn-photo { width: 90px; height: 108px; border: 2px solid var(--primary); background: white; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 28px; overflow: hidden; }
        .cn-photo img { width: 100%; height: 100%; object-fit: cover; }
        .cn-details { align-content: center; display: grid; gap: 3px; font-size: 11px; }
        .cn-details .name { font-size: 14px; font-weight: 700; color: var(--primary); margin-bottom: 4px; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
        .cn-details .row { display: grid; grid-template-columns: 100px 1fr; }
        .cn-details .label { color: #4b5563; font-weight: 600; }
        .cn-details .value { color: #111827; }
        .cn-att-panel { border: 1px solid var(--primary); padding: 6px; background: white; }
        .cn-att-title { text-align: center; font-size: 9px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 4px; }
        .cn-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
        .cn-att-cell { text-align: center; padding: 2px; }
        .cn-att-cell .num { font-size: 13px; font-weight: 700; color: var(--primary); }
        .cn-att-cell .lbl { font-size: 8px; color: #6b7280; letter-spacing: 0.3px; text-transform: uppercase; }
        .cn-section-hd { text-align: center; margin: 8px 0 4px; padding: 3px 0; background: var(--primary); color: white; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .cn-table { width: 100%; border-collapse: collapse; font-size: 10px; border: 1.5px solid var(--primary); }
        .cn-table thead th { background: color-mix(in srgb, var(--primary) 12%, white); color: var(--primary); padding: 5px 4px; text-align: center; font-weight: 700; font-size: 9.5px; border: 1px solid var(--primary); text-transform: uppercase; letter-spacing: 0.3px; }
        .cn-table thead th:first-child { text-align: left; padding-left: 8px; }
        .cn-table tbody td { padding: 4px; text-align: center; border: 1px solid #d1d5db; }
        .cn-table tbody td:first-child { text-align: left; padding-left: 8px; font-weight: 500; }
        .cn-table tbody tr:nth-child(even) { background: color-mix(in srgb, var(--primary) 2%, white); }
        .cn-grade { display: inline-block; padding: 1px 5px; border: 1px solid var(--primary); border-radius: 2px; font-weight: 700; font-size: 9.5px; color: var(--primary); background: white; font-family: 'Georgia', serif; }
        .cn-grade.fail { color: #b91c1c; border-color: #b91c1c; }
        .cn-table tfoot td { background: color-mix(in srgb, var(--primary) 8%, white); padding: 6px 4px; font-weight: 700; border: 1.5px solid var(--primary); font-size: 11px; color: var(--primary); }
        .cn-mid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; margin-top: 8px; }
        .cn-cum { border: 1px solid var(--primary); padding: 4px; }
        .cn-cum table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .cn-cum th, .cn-cum td { padding: 3px; text-align: center; border: 1px solid #d1d5db; }
        .cn-cum th { background: color-mix(in srgb, var(--primary) 8%, white); font-weight: 700; color: var(--primary); font-size: 9px; letter-spacing: 0.3px; text-transform: uppercase; }
        .cn-cum td.current { background: color-mix(in srgb, var(--primary) 12%, white); color: var(--primary); font-weight: 700; }
        .cn-summary-box { border: 1.5px solid var(--primary); padding: 8px; background: color-mix(in srgb, var(--primary) 5%, white); display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; }
        .cn-summary-box .lbl { font-size: 8.5px; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; }
        .cn-summary-box .val { font-size: 15px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; }
        .cn-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cn-behavior h4 { font-size: 9px; color: var(--primary); font-weight: 700; margin-bottom: 3px; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; padding-bottom: 2px; border-bottom: 1px solid var(--primary); }
        .cn-trait { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px; font-size: 10px; border-bottom: 1px dotted #d1d5db; }
        .cn-stars { color: #d97706; font-size: 11px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }
        .cn-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .cn-comment { padding: 8px; border: 1px solid var(--primary); background: white; font-size: 10.5px; position: relative; min-height: 60px; }
        .cn-comment .label { font-size: 9px; color: var(--primary); font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #e5e7eb; }
        .cn-comment .text { color: #1f2937; font-style: italic; line-height: 1.4; margin-bottom: 6px; }
        .cn-comment .sig-row { border-top: 1px dotted #9ca3af; padding-top: 3px; text-align: right; font-size: 9px; color: #4b5563; }
        .cn-comment .sig-row strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 10.5px; }
        .cn-sig-img { max-height: 22px; max-width: 70px; }
        .cn-stamp { position: absolute; right: 8px; bottom: 8px; width: 60px; height: 60px; opacity: 0.5; }
        .cn-stamp img { width: 100%; height: 100%; object-fit: contain; }
        .cn-footer { margin-top: auto; padding-top: 8px; border-top: 2px solid var(--primary); }
        .cn-scale { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-bottom: 6px; font-size: 9px; }
        .cn-scale-item { padding: 2px 6px; border: 1px solid #9ca3af; border-radius: 2px; color: #4b5563; background: white; }
        .cn-scale-item strong { color: var(--primary); font-family: 'Georgia', serif; }
        .cn-ft-text { text-align: center; font-size: 10px; color: #4b5563; }
        .cn-ft-text .next { font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1px; }
        .cn-ft-text .brand { font-size: 8px; color: #9ca3af; margin-top: 3px; font-style: italic; }
        @media print {
          body { background: white !important; }
          .cn-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="cn-header">
        <div className="cn-logo">
          {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
        </div>
        <div className="cn-school">
          <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
          <p>{[school.address, school.phone].filter(Boolean).join(' · ')}</p>
          {school.email && <p style={{marginTop:1}}>{school.email}</p>}
          {school.motto && <p className="motto">"{school.motto}"</p>}
        </div>
        <div className="cn-badge">CREST</div>
      </div>

      {/* Title */}
      <div className="cn-title">
        <h2>STUDENT ACADEMIC REPORT</h2>
        <div className="sub">{term.name?.toUpperCase()} · {term.session_name} SESSION</div>
      </div>

      {/* Student card */}
      <div className="cn-top">
        {settings?.show_photo !== false && (
          <div className="cn-photo">
            {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
          </div>
        )}
        <div className="cn-details">
          <div className="name">{fullName}</div>
          <div className="row"><span className="label">Admission No:</span><span className="value">{student.admission_number}</span></div>
          <div className="row"><span className="label">Class:</span><span className="value">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
          {student.gender && <div className="row"><span className="label">Gender:</span><span className="value">{student.gender}</span></div>}
          {student.date_of_birth && <div className="row"><span className="label">Date of Birth:</span><span className="value">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
          {settings?.show_house !== false && student.house && <div className="row"><span className="label">House:</span><span className="value">{student.house}</span></div>}
          {settings?.show_position !== false && summary.position_in_class && (
            <div className="row"><span className="label">Position in Class:</span><span className="value" style={{fontWeight:700}}>{ordinal(summary.position_in_class)} out of {summary.students_in_class}</span></div>
          )}
        </div>
        {settings?.show_attendance !== false && (
          <div className="cn-att-panel">
            <div className="cn-att-title">Attendance</div>
            <div className="cn-att-grid">
              <div className="cn-att-cell"><div className="num">{attendance?.present ?? '—'}</div><div className="lbl">Present</div></div>
              <div className="cn-att-cell"><div className="num">{attendance?.absent ?? '—'}</div><div className="lbl">Absent</div></div>
              <div className="cn-att-cell"><div className="num">{attendance?.late ?? '—'}</div><div className="lbl">Late</div></div>
              <div className="cn-att-cell"><div className="num">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</div><div className="lbl">Rate</div></div>
            </div>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="cn-section-hd">Academic Performance</div>
      <table className="cn-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Subject</th>
            <th>CA1<br/>(20)</th>
            <th>CA2<br/>(20)</th>
            <th>Exam<br/>(60)</th>
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
                <td>{s.ca1 ?? '—'}</td>
                <td>{s.ca2 ?? '—'}</td>
                <td>{s.exam ?? '—'}</td>
                <td><strong>{s.total ?? '—'}</strong></td>
                <td><span className={`cn-grade ${isFail ? 'fail' : ''}`}>{s.grade || '—'}</span></td>
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
            <td colSpan={3} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td>{summary.average?.toFixed(1)}</td>
            <td><span className="cn-grade">{summary.overall_grade || '—'}</span></td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 8 }}>Overall Term Performance</td>
          </tr>
        </tfoot>
      </table>

      {/* Cumulative + Summary */}
      {settings?.show_cumulative !== false && (
        <div className="cn-mid">
          <div className="cn-cum">
            <table>
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
          </div>
          <div className="cn-summary-box">
            {settings?.show_position !== false && <div><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
            <div><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
            <div><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
          </div>
        </div>
      )}

      {/* Behavior */}
      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="cn-section-hd">Behaviour & Skills Assessment</div>
          <div className="cn-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective Domain (Character)</h4>
                {behavior.affective.slice(0, 7).map((t, i) => (
                  <div key={i} className="cn-trait"><span>{t.name}</span><span className="cn-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor Domain (Skills)</h4>
                {behavior.psychomotor.slice(0, 7).map((t, i) => (
                  <div key={i} className="cn-trait"><span>{t.name}</span><span className="cn-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Comments */}
      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <>
          <div className="cn-section-hd">Remarks</div>
          <div className="cn-comments">
            {settings?.show_teacher_comment !== false && (
              <div className="cn-comment">
                <div className="label">Class Teacher's Remark</div>
                <div className="text">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                <div className="sig-row"><strong>{comments?.teacher_name || 'Class Teacher'}</strong><br/>Signature ......................</div>
              </div>
            )}
            {settings?.show_principal_comment !== false && (
              <div className="cn-comment">
                <div className="label">Principal's Remark</div>
                <div className="text">"{comments?.principal_comment || 'Comment pending.'}"</div>
                <div className="sig-row">
                  {school.principal_signature_url ? (
                    <img className="cn-sig-img" src={school.principal_signature_url} alt="Signature" />
                  ) : null}
                  <div><strong>{school.principal_name || 'Principal'}</strong></div>
                </div>
                {school.stamp_url && <div className="cn-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="cn-footer">
        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="cn-scale">
            {grade_scale.map((g, i) => (
              <div key={i} className="cn-scale-item"><strong>{g.grade}</strong> {g.min}-{g.max}{g.remark ? ` (${g.remark})` : ''}</div>
            ))}
          </div>
        )}
        <div className="cn-ft-text">
          {term.next_term_begins && <div className="next">Next Term Begins: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          <div className="brand">This report is computer-generated by SchoolFlow</div>
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
