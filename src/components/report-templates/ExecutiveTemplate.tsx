'use client';

import { ReportTemplateProps, ordinal, stars } from './types';

/**
 * Executive — premium serif elegance with double borders and refined typography.
 * 3 color styles: Royal Gold, Platinum, Bronze. Fits up to 18 subjects on ONE A4 page.
 */
export default function ExecutiveTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, style,
}: ReportTemplateProps) {
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const breakdownCols = scores[0]?.breakdowns || [];

  return (
    <div className="ex-page" style={{
      ['--primary' as any]: style.primary,
      ['--accent' as any]: style.accent,
      ['--bg' as any]: style.bg,
      ['--ink' as any]: style.ink,
      ['--soft' as any]: style.soft,
    }}>
      <style>{`
        .ex-page {
          width: 210mm; height: 297mm; margin: 0 auto; background: var(--bg);
          padding: 8mm 10mm; box-sizing: border-box;
          font-family: 'Cormorant Garamond', Georgia, serif; color: var(--ink);
          font-size: 9.5px; line-height: 1.25;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }
        .ex-page * { box-sizing: border-box; }
        .ex-page::before {
          content: ''; position: absolute; top: 4mm; left: 4mm; right: 4mm; bottom: 4mm;
          border: 1px solid var(--accent); pointer-events: none;
        }
        .ex-page::after {
          content: ''; position: absolute; top: 5mm; left: 5mm; right: 5mm; bottom: 5mm;
          border: 2px double var(--accent); pointer-events: none;
        }
        .ex-content { position: relative; z-index: 1; padding: 3mm; display: flex; flex-direction: column; flex: 1; overflow: hidden; }

        .ex-header { text-align: center; padding-bottom: 4px; margin-bottom: 4px; position: relative; }
        .ex-header::after { content: ''; position: absolute; left: 20%; right: 20%; bottom: 0; height: 1px; background: linear-gradient(to right, transparent, var(--accent), transparent); }
        .ex-crest-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .ex-logo { width: 44px; height: 44px; border: 1.5px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 18px; overflow: hidden; background: var(--soft); font-family: 'Playfair Display', serif; flex-shrink: 0; }
        .ex-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        .ex-school h1 { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--primary); letter-spacing: 2px; line-height: 1.1; }
        .ex-school p { font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); margin-top: 1px; font-style: italic; letter-spacing: 0.3px; }
        .ex-school .motto { color: var(--accent); font-size: 9px; margin-top: 1px; font-style: italic; letter-spacing: 1.5px; font-weight: 600; }

        .ex-title { text-align: center; padding: 3px 0; margin-bottom: 4px; }
        .ex-title h2 { font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 600; color: var(--primary); letter-spacing: 3px; }
        .ex-title .sub { font-size: 9px; color: var(--accent); margin-top: 1px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }

        .ex-top { display: grid; grid-template-columns: 70px 1fr 155px; gap: 8px; margin-bottom: 5px; padding: 5px; border-top: 1px solid var(--accent); border-bottom: 1px solid var(--accent); }
        .ex-photo { width: 70px; height: 84px; border: 1.5px solid var(--accent); background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 22px; overflow: hidden; font-family: 'Playfair Display', serif; }
        .ex-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ex-details { align-content: center; display: grid; gap: 2px; font-size: 9.5px; }
        .ex-details .name { font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 2px; font-family: 'Playfair Display', serif; letter-spacing: 0.8px; padding-bottom: 2px; border-bottom: 1px solid var(--accent); }
        .ex-details .row { display: grid; grid-template-columns: 95px 1fr; gap: 4px; }
        .ex-details .label { color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 600; font-style: italic; }
        .ex-details .value { color: var(--primary); font-weight: 600; }
        .ex-att-panel { border: 1px solid var(--accent); padding: 4px; background: var(--soft); }
        .ex-att-title { text-align: center; font-size: 8.5px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 2px; border-bottom: 1px solid var(--accent); margin-bottom: 3px; font-family: 'Playfair Display', serif; }
        .ex-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
        .ex-att-cell { text-align: center; }
        .ex-att-cell .num { font-size: 12px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1; }
        .ex-att-cell .lbl { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); letter-spacing: 0.3px; text-transform: uppercase; font-style: italic; }

        .ex-section-hd { text-align: center; margin: 4px 0 2px; padding: 3px 0; font-family: 'Playfair Display', serif; font-size: 9.5px; font-weight: 700; color: var(--primary); letter-spacing: 2px; text-transform: uppercase; border-top: 1px solid var(--accent); border-bottom: 1px solid var(--accent); }

        .ex-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .ex-table thead th { background: var(--primary); color: var(--soft); padding: 3px; text-align: center; font-weight: 600; font-size: 8.5px; letter-spacing: 0.3px; font-family: 'Playfair Display', serif; text-transform: uppercase; line-height: 1.1; }
        .ex-table thead th:first-child { text-align: left; padding-left: 6px; }
        .ex-table tbody td { padding: 2.5px 3px; text-align: center; border-bottom: 1px solid color-mix(in srgb, var(--accent) 25%, white); line-height: 1.2; }
        .ex-table tbody td:first-child { text-align: left; padding-left: 6px; font-weight: 600; }
        .ex-table tbody tr:nth-child(even) { background: var(--soft); }
        .ex-grade { display: inline-block; padding: 0px 4px; border: 1px solid var(--accent); font-weight: 700; font-size: 8.5px; color: var(--primary); background: var(--bg); font-family: 'Playfair Display', serif; }
        .ex-grade.fail { color: #7f1d1d; border-color: #7f1d1d; }
        .ex-table tfoot td { background: var(--soft); padding: 4px 3px; font-weight: 700; border-top: 1.5px solid var(--accent); border-bottom: 1.5px solid var(--accent); font-size: 9.5px; color: var(--primary); font-family: 'Playfair Display', serif; }

        .ex-mid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; margin-top: 4px; }
        .ex-cum-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .ex-cum-table th, .ex-cum-table td { padding: 3px; text-align: center; border: 1px solid var(--accent); line-height: 1.1; }
        .ex-cum-table th { background: var(--primary); color: var(--soft); font-weight: 600; font-size: 8px; letter-spacing: 0.5px; text-transform: uppercase; font-family: 'Playfair Display', serif; }
        .ex-cum-table td.current { background: var(--soft); color: var(--primary); font-weight: 700; }
        .ex-summary-box { border: 1.5px double var(--accent); padding: 4px 6px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; text-align: center; background: var(--soft); }
        .ex-summary-box .lbl { font-size: 8px; color: var(--accent); letter-spacing: 0.5px; text-transform: uppercase; font-style: italic; }
        .ex-summary-box .val { font-size: 14px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 0.5px; line-height: 1.1; }

        .ex-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ex-behavior h4 { font-size: 8.5px; color: var(--primary); font-weight: 700; margin-bottom: 2px; letter-spacing: 0.7px; text-transform: uppercase; text-align: center; padding-bottom: 2px; border-bottom: 1px solid var(--accent); font-family: 'Playfair Display', serif; }
        .ex-trait { display: flex; justify-content: space-between; align-items: center; padding: 1.5px 4px; font-size: 9.5px; border-bottom: 1px dotted color-mix(in srgb, var(--accent) 30%, white); line-height: 1.2; }
        .ex-stars { color: var(--accent); font-size: 10px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }

        .ex-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .ex-comment { padding: 6px; border: 1px solid var(--accent); background: var(--bg); font-size: 10px; position: relative; }
        .ex-comment .label { font-size: 8.5px; color: var(--accent); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; padding-bottom: 2px; border-bottom: 1px solid var(--accent); font-family: 'Playfair Display', serif; }
        .ex-comment .text { color: var(--ink); font-style: italic; line-height: 1.3; margin-bottom: 4px; }
        .ex-comment .sig-row { border-top: 1px dotted var(--accent); padding-top: 2px; text-align: right; font-size: 8.5px; color: color-mix(in srgb, var(--ink) 55%, white); font-style: italic; }
        .ex-comment .sig-row strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 10px; letter-spacing: 0.3px; }
        .ex-sig-img { max-height: 20px; max-width: 65px; }
        .ex-stamp { position: absolute; right: 6px; bottom: 6px; width: 48px; height: 48px; opacity: 0.5; }
        .ex-stamp img { width: 100%; height: 100%; object-fit: contain; }

        .ex-footer { margin-top: auto; padding-top: 4px; border-top: 1px solid var(--accent); }
        .ex-scale { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-bottom: 3px; font-size: 8.5px; }
        .ex-scale-item { padding: 1px 5px; border: 1px solid var(--accent); color: color-mix(in srgb, var(--ink) 55%, white); background: var(--bg); }
        .ex-scale-item strong { color: var(--primary); font-family: 'Playfair Display', serif; }
        .ex-ft-text { text-align: center; font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); font-style: italic; }
        .ex-ft-text .next { font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1px; font-style: normal; }
        .ex-ft-text .brand { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 30%, white); margin-top: 2px; letter-spacing: 0.5px; }

        @media print {
          body { background: white !important; }
          .ex-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="ex-content">
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

        <div className="ex-title">
          <h2>STUDENT ACADEMIC REPORT</h2>
          <div className="sub">{term.name} · {term.session_name} Session</div>
        </div>

        <div className="ex-top">
          {settings?.show_photo !== false && (
            <div className="ex-photo">
              {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
            </div>
          )}
          <div className="ex-details">
            <div className="name">{fullName}</div>
            <div className="row"><span className="label">Admission No:</span><span className="value">{student.admission_number}</span></div>
            <div className="row"><span className="label">Class:</span><span className="value">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
            {student.gender && <div className="row"><span className="label">Gender:</span><span className="value">{student.gender}</span></div>}
            {student.date_of_birth && <div className="row"><span className="label">Date of Birth:</span><span className="value">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
            {settings?.show_house !== false && student.house && <div className="row"><span className="label">House:</span><span className="value">{student.house}</span></div>}
            {settings?.show_position !== false && summary.position_in_class && (
              <div className="row"><span className="label">Class Position:</span><span className="value" style={{fontFamily:'Playfair Display, serif', fontSize:'11px'}}>{ordinal(summary.position_in_class)} of {summary.students_in_class}</span></div>
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

        <div className="ex-section-hd">Academic Performance</div>
        <table className="ex-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Subject</th>
              {breakdownCols.map((b, i) => (
                <th key={i}>{b.name}<br /><span style={{ fontWeight: 400, fontSize: '7.5px' }}>({b.max})</span></th>
              ))}
              <th>Total<br /><span style={{ fontWeight: 400, fontSize: '7.5px' }}>(100)</span></th>
              <th>Grade</th>
              {settings?.show_subject_position !== false && <th>Pos</th>}
              {settings?.show_class_avg !== false && <th>Class<br />Avg</th>}
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i}>
                <td>{s.subject_name}</td>
                {breakdownCols.map((col, ci) => {
                  const val = s.breakdowns?.[ci]?.score;
                  return <td key={ci}>{val == null ? '—' : val}</td>;
                })}
                <td><strong>{s.total ?? '—'}</strong></td>
                <td><span className={`ex-grade ${s.grade === 'F9' ? 'fail' : ''}`}>{s.grade || '—'}</span></td>
                {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
                {settings?.show_class_avg !== false && <td>{s.class_avg != null ? s.class_avg.toFixed(1) : '—'}</td>}
                <td>{s.remark || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ textAlign: 'left' }}>TOTAL — {scores.length} SUBJECTS</td>
              <td colSpan={breakdownCols.length} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
              <td>{summary.average?.toFixed(1)}</td>
              <td><span className="ex-grade">{summary.overall_grade || '—'}</span></td>
              <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 6 }}>{summary.overall_remark || 'Overall Performance'}</td>
            </tr>
          </tfoot>
        </table>

        {settings?.show_cumulative !== false && (
          <div className="ex-mid">
            <table className="ex-cum-table">
              <thead>
                <tr>
                  <th>1st Term</th><th>2nd Term</th><th>3rd Term</th><th>Cumulative</th>
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

        {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
          <>
            <div className="ex-section-hd">Character & Skills</div>
            <div className="ex-behavior">
              {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
                <div>
                  <h4>Affective Domain</h4>
                  {behavior.affective.slice(0, 6).map((t, i) => (
                    <div key={i} className="ex-trait"><span>{t.name}</span><span className="ex-stars">{stars(t.rating)}</span></div>
                  ))}
                </div>
              )}
              {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
                <div>
                  <h4>Psychomotor Domain</h4>
                  {behavior.psychomotor.slice(0, 6).map((t, i) => (
                    <div key={i} className="ex-trait"><span>{t.name}</span><span className="ex-stars">{stars(t.rating)}</span></div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

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