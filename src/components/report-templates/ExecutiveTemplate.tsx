'use client';

import { ReportTemplateProps } from './types';

export default function ExecutiveTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, color,
}: ReportTemplateProps) {
  const primary = color?.primary || '#1a1a1a';
  const accent = color?.accent || '#b8860b'; // Gold accent
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();

  const stars = (n: number) => {
    const full = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="ex-page" style={{ '--primary': primary, '--accent': accent } as any}>
      <style>{`
        .ex-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fefefe;
          padding: 12mm 14mm; box-sizing: border-box;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; color: #1a1a1a;
          font-size: 10.5px; line-height: 1.4;
          display: flex; flex-direction: column;
          position: relative;
        }
        .ex-page * { box-sizing: border-box; }
        .ex-page::before {
          content: ''; position: absolute; top: 6mm; left: 6mm; right: 6mm; bottom: 6mm;
          border: 1px solid var(--accent); pointer-events: none;
        }
        .ex-page::after {
          content: ''; position: absolute; top: 7mm; left: 7mm; right: 7mm; bottom: 7mm;
          border: 3px double var(--accent); pointer-events: none;
        }
        .ex-content { position: relative; z-index: 1; padding: 4mm; display: flex; flex-direction: column; flex: 1; }
        .ex-header { text-align: center; padding-bottom: 8px; margin-bottom: 8px; position: relative; }
        .ex-header::after { content: ''; position: absolute; left: 20%; right: 20%; bottom: 0; height: 1px; background: linear-gradient(to right, transparent, var(--accent), transparent); }
        .ex-crest-row { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 6px; }
        .ex-logo { width: 60px; height: 60px; border: 2px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 22px; overflow: hidden; background: linear-gradient(135deg, #fef9e7, white); font-family: 'Playfair Display', serif; }
        .ex-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        .ex-school h1 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--primary); letter-spacing: 4px; }
        .ex-school p { font-size: 10px; color: #4a4a4a; margin-top: 3px; font-style: italic; letter-spacing: 0.5px; }
        .ex-school .motto { color: var(--accent); font-size: 10px; margin-top: 3px; font-family: 'Cormorant Garamond', serif; font-style: italic; letter-spacing: 2px; font-weight: 600; }
        .ex-title { text-align: center; padding: 6px 0; margin-bottom: 10px; }
        .ex-title h2 { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 600; color: var(--primary); letter-spacing: 5px; }
        .ex-title .sub { font-size: 10px; color: var(--accent); margin-top: 3px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; }
        .ex-top { display: grid; grid-template-columns: 100px 1fr 190px; gap: 12px; margin-bottom: 10px; padding: 10px; border-top: 1px solid var(--accent); border-bottom: 1px solid var(--accent); }
        .ex-photo { width: 100px; height: 120px; border: 2px solid var(--accent); background: white; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 32px; overflow: hidden; font-family: 'Playfair Display', serif; }
        .ex-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ex-details { align-content: center; display: grid; gap: 3px; font-size: 11px; }
        .ex-details .name { font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 5px; font-family: 'Playfair Display', serif; letter-spacing: 1px; padding-bottom: 4px; border-bottom: 1px solid var(--accent); }
        .ex-details .row { display: grid; grid-template-columns: 110px 1fr; }
        .ex-details .label { color: #4a4a4a; font-weight: 600; font-family: 'Cormorant Garamond', serif; font-style: italic; letter-spacing: 0.5px; }
        .ex-details .value { color: var(--primary); font-weight: 600; }
        .ex-att-panel { border: 1px solid var(--accent); padding: 6px; background: linear-gradient(135deg, white, #fef9e7); }
        .ex-att-title { text-align: center; font-size: 10px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; padding-bottom: 4px; border-bottom: 1px solid var(--accent); margin-bottom: 5px; font-family: 'Playfair Display', serif; }
        .ex-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
        .ex-att-cell { text-align: center; padding: 2px; }
        .ex-att-cell .num { font-size: 14px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; }
        .ex-att-cell .lbl { font-size: 8px; color: #4a4a4a; letter-spacing: 0.5px; text-transform: uppercase; font-family: 'Cormorant Garamond', serif; font-style: italic; }
        .ex-section-hd { text-align: center; margin: 8px 0 4px; padding: 5px 0; font-family: 'Playfair Display', serif; font-size: 11px; font-weight: 700; color: var(--primary); letter-spacing: 3px; text-transform: uppercase; border-top: 1px solid var(--accent); border-bottom: 1px solid var(--accent); }
        .ex-table { width: 100%; border-collapse: collapse; font-size: 10px; font-family: 'Cormorant Garamond', serif; }
        .ex-table thead th { background: var(--primary); color: #fef9e7; padding: 5px 4px; text-align: center; font-weight: 600; font-size: 10px; letter-spacing: 0.5px; font-family: 'Playfair Display', serif; text-transform: uppercase; }
        .ex-table thead th:first-child { text-align: left; padding-left: 8px; }
        .ex-table tbody td { padding: 4px; text-align: center; border-bottom: 1px solid #e5e0d0; }
        .ex-table tbody td:first-child { text-align: left; padding-left: 8px; font-weight: 600; }
        .ex-table tbody tr:nth-child(even) { background: #fefaf0; }
        .ex-grade { display: inline-block; padding: 1px 6px; border: 1px solid var(--accent); font-weight: 700; font-size: 10px; color: var(--primary); background: linear-gradient(135deg, white, #fef9e7); font-family: 'Playfair Display', serif; }
        .ex-grade.fail { color: #7f1d1d; border-color: #7f1d1d; }
        .ex-table tfoot td { background: linear-gradient(to right, #fef9e7, white, #fef9e7); padding: 6px 4px; font-weight: 700; border-top: 2px solid var(--accent); border-bottom: 2px solid var(--accent); font-size: 11px; color: var(--primary); font-family: 'Playfair Display', serif; }
        .ex-mid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; margin-top: 8px; }
        .ex-cum-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .ex-cum-table th, .ex-cum-table td { padding: 4px; text-align: center; border: 1px solid var(--accent); font-family: 'Cormorant Garamond', serif; }
        .ex-cum-table th { background: var(--primary); color: #fef9e7; font-weight: 600; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; font-family: 'Playfair Display', serif; }
        .ex-cum-table td.current { background: #fef9e7; color: var(--primary); font-weight: 700; }
        .ex-summary-box { border: 2px double var(--accent); padding: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; background: linear-gradient(135deg, white, #fef9e7); }
        .ex-summary-box .lbl { font-size: 9px; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; font-family: 'Cormorant Garamond', serif; font-style: italic; }
        .ex-summary-box .val { font-size: 17px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1px; }
        .ex-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .ex-behavior h4 { font-size: 10px; color: var(--primary); font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; text-transform: uppercase; text-align: center; padding-bottom: 3px; border-bottom: 1px solid var(--accent); font-family: 'Playfair Display', serif; }
        .ex-trait { display: flex; justify-content: space-between; align-items: center; padding: 2px 6px; font-size: 10.5px; border-bottom: 1px dotted #d1cba8; font-family: 'Cormorant Garamond', serif; }
        .ex-stars { color: var(--accent); font-size: 12px; letter-spacing: 1px; line-height: 1; font-family: sans-serif; }
        .ex-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ex-comment { padding: 10px; border: 1px solid var(--accent); background: linear-gradient(135deg, white, #fefaf0); font-size: 11px; position: relative; min-height: 70px; font-family: 'Cormorant Garamond', serif; }
        .ex-comment .label { font-size: 9px; color: var(--accent); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid var(--accent); font-family: 'Playfair Display', serif; }
        .ex-comment .text { color: #1a1a1a; font-style: italic; line-height: 1.4; margin-bottom: 6px; }
        .ex-comment .sig-row { border-top: 1px dotted var(--accent); padding-top: 4px; text-align: right; font-size: 9px; color: #4a4a4a; font-family: 'Cormorant Garamond', serif; font-style: italic; }
        .ex-comment .sig-row strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 11px; letter-spacing: 0.5px; }
        .ex-sig-img { max-height: 24px; max-width: 80px; }
        .ex-stamp { position: absolute; right: 10px; bottom: 10px; width: 65px; height: 65px; opacity: 0.55; }
        .ex-stamp img { width: 100%; height: 100%; object-fit: contain; }
        .ex-footer { margin-top: auto; padding-top: 8px; border-top: 1px solid var(--accent); }
        .ex-scale { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-bottom: 6px; font-size: 9.5px; font-family: 'Cormorant Garamond', serif; }
        .ex-scale-item { padding: 2px 7px; border: 1px solid var(--accent); color: #4a4a4a; background: white; }
        .ex-scale-item strong { color: var(--primary); font-family: 'Playfair Display', serif; }
        .ex-ft-text { text-align: center; font-size: 10px; color: #4a4a4a; font-family: 'Cormorant Garamond', serif; font-style: italic; }
        .ex-ft-text .next { font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 2px; font-style: normal; }
        .ex-ft-text .brand { font-size: 8px; color: #a0a0a0; margin-top: 4px; letter-spacing: 1px; }
        @media print {
          body { background: white !important; }
          .ex-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="ex-content">
        {/* Header */}
        <div className="ex-header">
          <div className="ex-crest-row">
            <div className="ex-logo">
              {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
            </div>
            <div className="ex-school">
              <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
              <p>{[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</p>
              {school.motto && <p className="motto">— {school.motto} —</p>}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="ex-title">
          <h2>STUDENT ACADEMIC REPORT</h2>
          <div className="sub">{term.name} · {term.session_name} Session</div>
        </div>

        {/* Student card */}
        <div className="ex-top">
          {settings?.show_photo !== false && (
            <div className="ex-photo">
              {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
            </div>
          )}
          <div className="ex-details">
            <div className="name">{fullName}</div>
            <div className="row"><span className="label">Admission Number:</span><span className="value">{student.admission_number}</span></div>
            <div className="row"><span className="label">Class:</span><span className="value">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
            {student.gender && <div className="row"><span className="label">Gender:</span><span className="value">{student.gender}</span></div>}
            {student.date_of_birth && <div className="row"><span className="label">Date of Birth:</span><span className="value">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
            {settings?.show_house !== false && student.house && <div className="row"><span className="label">House:</span><span className="value">{student.house}</span></div>}
            {settings?.show_position !== false && summary.position_in_class && (
              <div className="row"><span className="label">Class Position:</span><span className="value" style={{fontFamily:'Playfair Display, serif', fontSize:'12px'}}>{ordinal(summary.position_in_class)} of {summary.students_in_class}</span></div>
            )}
          </div>
          {settings?.show_attendance !== false && (
            <div className="ex-att-panel">
              <div className="ex-att-title">Attendance</div>
              <div className="ex-att-grid">
                <div className="ex-att-cell"><div className="num">{attendance?.present ?? '—'}</div><div className="lbl">Present</div></div>
                <div className="ex-att-cell"><div className="num">{attendance?.absent ?? '—'}</div><div className="lbl">Absent</div></div>
                <div className="ex-att-cell"><div className="num">{attendance?.late ?? '—'}</div><div className="lbl">Late</div></div>
                <div className="ex-att-cell"><div className="num">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</div><div className="lbl">Rate</div></div>
              </div>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="ex-section-hd">Academic Performance</div>
        <table className="ex-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Subject</th>
              <th>CA I<br/>(20)</th>
              <th>CA II<br/>(20)</th>
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
                  <td><span className={`ex-grade ${isFail ? 'fail' : ''}`}>{s.grade || '—'}</span></td>
                  {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
                  {settings?.show_class_avg !== false && <td>{s.class_avg ? s.class_avg.toFixed(1) : '—'}</td>}
                  <td>{s.remark || '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ textAlign: 'left' }}>TOTAL / AVERAGE — {scores.length} SUBJECTS</td>
              <td colSpan={3} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
              <td>{summary.average?.toFixed(1)}</td>
              <td><span className="ex-grade">{summary.overall_grade || '—'}</span></td>
              <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 8 }}>Overall Performance</td>
            </tr>
          </tfoot>
        </table>

        {/* Cumulative + Summary */}
        {settings?.show_cumulative !== false && (
          <div className="ex-mid">
            <table className="ex-cum-table">
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
            <div className="ex-summary-box">
              {settings?.show_position !== false && <div><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
              <div><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
              <div><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
            </div>
          </div>
        )}

        {/* Behavior */}
        {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
          <>
            <div className="ex-section-hd">Character & Skills Assessment</div>
            <div className="ex-behavior">
              {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
                <div>
                  <h4>Affective Domain</h4>
                  {behavior.affective.slice(0, 7).map((t, i) => (
                    <div key={i} className="ex-trait"><span>{t.name}</span><span className="ex-stars">{stars(t.rating)}</span></div>
                  ))}
                </div>
              )}
              {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
                <div>
                  <h4>Psychomotor Domain</h4>
                  {behavior.psychomotor.slice(0, 7).map((t, i) => (
                    <div key={i} className="ex-trait"><span>{t.name}</span><span className="ex-stars">{stars(t.rating)}</span></div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Comments */}
        {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
          <>
            <div className="ex-section-hd">Remarks</div>
            <div className="ex-comments">
              {settings?.show_teacher_comment !== false && (
                <div className="ex-comment">
                  <div className="label">Form Master's Remark</div>
                  <div className="text">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                  <div className="sig-row"><strong>{comments?.teacher_name || 'Form Master'}</strong></div>
                </div>
              )}
              {settings?.show_principal_comment !== false && (
                <div className="ex-comment">
                  <div className="label">Principal's Remark</div>
                  <div className="text">"{comments?.principal_comment || 'Comment pending.'}"</div>
                  <div className="sig-row">
                    {school.principal_signature_url && <img className="ex-sig-img" src={school.principal_signature_url} alt="Signature" />}
                    <div><strong>{school.principal_name || 'The Principal'}</strong></div>
                  </div>
                  {school.stamp_url && <div className="ex-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="ex-footer">
          {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
            <div className="ex-scale">
              {grade_scale.map((g, i) => (
                <div key={i} className="ex-scale-item"><strong>{g.grade}</strong> {g.min}–{g.max}{g.remark ? ` · ${g.remark}` : ''}</div>
              ))}
            </div>
          )}
          <div className="ex-ft-text">
            {term.next_term_begins && <div className="next">Resumption: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
            <div className="brand">SchoolFlow · Educational Excellence</div>
          </div>
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
