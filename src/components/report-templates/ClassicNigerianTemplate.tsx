'use client';

import { ReportTemplateProps, ordinal, stars } from './types';

/**
 * Classic Nigerian — traditional WAEC-style report with bordered tables and serif fonts.
 * 3 color styles: Royal Blue, Emerald, Maroon. Fits up to 18 subjects on ONE A4 page.
 */
export default function ClassicNigerianTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, style,
}: ReportTemplateProps) {
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const breakdownCols = scores[0]?.breakdowns || [];

  return (
    <div className="cn-page" style={{
      ['--primary' as any]: style.primary,
      ['--accent' as any]: style.accent,
      ['--bg' as any]: style.bg,
      ['--ink' as any]: style.ink,
      ['--soft' as any]: style.soft,
    }}>
      <style>{`
        .cn-page {
          width: 210mm; height: 297mm; margin: 0 auto; background: var(--bg);
          padding: 8mm 10mm; box-sizing: border-box;
          font-family: 'Georgia', 'Times New Roman', serif; color: var(--ink);
          font-size: 9.5px; line-height: 1.3;
          display: flex; flex-direction: column;
          border: 3px double var(--primary);
          overflow: hidden;
        }
        .cn-page * { box-sizing: border-box; }

        .cn-hd { text-align: center; padding-bottom: 5px; border-bottom: 2px solid var(--primary); margin-bottom: 6px; display: grid; grid-template-columns: 60px 1fr 60px; align-items: center; gap: 10px; }
        .cn-logo { width: 56px; height: 56px; border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 20px; overflow: hidden; background: var(--bg); }
        .cn-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        .cn-sch h1 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--primary); letter-spacing: 2px; }
        .cn-sch p { font-size: 9px; color: color-mix(in srgb, var(--ink) 60%, white); margin-top: 2px; font-style: italic; }
        .cn-sch .motto { color: var(--primary); font-size: 8.5px; margin-top: 2px; font-weight: 600; letter-spacing: 1px; }
        .cn-crest { width: 56px; height: 56px; border: 1px solid color-mix(in srgb, var(--primary) 40%, white); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: color-mix(in srgb, var(--ink) 40%, white); font-size: 8px; text-align: center; }

        .cn-title { text-align: center; margin-bottom: 6px; padding: 5px 0; border-top: 1px solid var(--primary); border-bottom: 1px solid var(--primary); background: color-mix(in srgb, var(--primary) 4%, white); }
        .cn-title h2 { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--primary); letter-spacing: 2.5px; }
        .cn-title .sub { font-size: 9.5px; color: color-mix(in srgb, var(--ink) 55%, white); margin-top: 2px; font-style: italic; letter-spacing: 1px; }

        .cn-top { display: grid; grid-template-columns: 78px 1fr 170px; gap: 8px; margin-bottom: 6px; padding: 6px; border: 1px solid var(--primary); background: color-mix(in srgb, var(--primary) 3%, white); }
        .cn-photo { width: 78px; height: 94px; border: 2px solid var(--primary); background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 26px; overflow: hidden; font-family: 'Playfair Display', serif; }
        .cn-photo img { width: 100%; height: 100%; object-fit: cover; }
        .cn-details { align-content: center; display: grid; gap: 2px; font-size: 10px; }
        .cn-details .name { font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 3px; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; font-family: 'Playfair Display', serif; }
        .cn-details .row { display: grid; grid-template-columns: 90px 1fr; }
        .cn-details .k { color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 600; }
        .cn-details .v { color: var(--ink); }

        .cn-att-panel { border: 1px solid var(--primary); padding: 5px; background: var(--bg); }
        .cn-att-title { text-align: center; font-size: 8.5px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; padding-bottom: 3px; border-bottom: 1px solid color-mix(in srgb, var(--primary) 25%, white); margin-bottom: 4px; }
        .cn-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
        .cn-att-cell { text-align: center; padding: 1px; }
        .cn-att-cell .num { font-size: 12px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1; }
        .cn-att-cell .lbl { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); letter-spacing: 0.3px; text-transform: uppercase; margin-top: 1px; }

        .cn-sh { text-align: center; margin: 5px 0 3px; padding: 3px 0; background: var(--primary); color: var(--bg); font-size: 9.5px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }

        .cn-tbl { width: 100%; border-collapse: collapse; font-size: 9px; border: 1.5px solid var(--primary); }
        .cn-tbl thead th { background: color-mix(in srgb, var(--primary) 12%, white); color: var(--primary); padding: 4px 3px; text-align: center; font-weight: 700; font-size: 8.5px; border: 1px solid var(--primary); text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1; }
        .cn-tbl thead th:first-child { text-align: left; padding-left: 6px; }
        .cn-tbl tbody td { padding: 3px 4px; text-align: center; border: 1px solid color-mix(in srgb, var(--primary) 20%, white); }
        .cn-tbl tbody td:first-child { text-align: left; padding-left: 6px; font-weight: 500; }
        .cn-tbl tbody tr:nth-child(even) { background: color-mix(in srgb, var(--primary) 2%, white); }
        .cn-grade { display: inline-block; padding: 1px 5px; border: 1px solid var(--primary); border-radius: 2px; font-weight: 700; font-size: 9px; color: var(--primary); background: var(--bg); font-family: 'Georgia', serif; }
        .cn-grade.fail { color: #b91c1c; border-color: #b91c1c; }
        .cn-tbl tfoot td { background: color-mix(in srgb, var(--primary) 8%, white); padding: 5px 4px; font-weight: 700; border: 1.5px solid var(--primary); font-size: 10px; color: var(--primary); }

        .cn-mid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; margin-top: 5px; }
        .cn-cum { border: 1px solid var(--primary); padding: 3px; }
        .cn-cum table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .cn-cum th, .cn-cum td { padding: 3px; text-align: center; border: 1px solid color-mix(in srgb, var(--primary) 25%, white); }
        .cn-cum th { background: color-mix(in srgb, var(--primary) 8%, white); font-weight: 700; color: var(--primary); font-size: 8.5px; letter-spacing: 0.3px; text-transform: uppercase; }
        .cn-cum td.current { background: color-mix(in srgb, var(--primary) 12%, white); color: var(--primary); font-weight: 700; }
        .cn-summary { border: 1.5px solid var(--primary); padding: 6px; background: color-mix(in srgb, var(--primary) 5%, white); display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; text-align: center; }
        .cn-summary .lbl { font-size: 8px; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; }
        .cn-summary .val { font-size: 14px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1.1; }

        .cn-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 2px; }
        .cn-behavior h4 { font-size: 8.5px; color: var(--primary); font-weight: 700; margin-bottom: 3px; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; padding-bottom: 2px; border-bottom: 1px solid var(--primary); }
        .cn-trait { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px; font-size: 9.5px; border-bottom: 1px dotted color-mix(in srgb, var(--primary) 20%, white); }
        .cn-stars { color: #d97706; font-size: 11px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }

        .cn-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }
        .cn-cmt { padding: 6px; border: 1px solid var(--primary); background: var(--bg); position: relative; }
        .cn-cmt .k { font-size: 8.5px; color: var(--primary); font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; padding-bottom: 2px; border-bottom: 1px solid color-mix(in srgb, var(--primary) 25%, white); }
        .cn-cmt .txt { color: var(--ink); font-style: italic; line-height: 1.35; margin-bottom: 4px; font-size: 9.5px; }
        .cn-cmt .sig-row { border-top: 1px dotted color-mix(in srgb, var(--primary) 40%, white); padding-top: 3px; text-align: right; font-size: 8.5px; color: color-mix(in srgb, var(--ink) 55%, white); }
        .cn-cmt .sig-row strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 10px; }
        .cn-sig-img { max-height: 20px; max-width: 65px; }
        .cn-stamp { position: absolute; right: 6px; bottom: 6px; width: 52px; height: 52px; opacity: 0.55; }
        .cn-stamp img { width: 100%; height: 100%; object-fit: contain; }

        .cn-footer { margin-top: auto; padding-top: 5px; border-top: 2px solid var(--primary); }
        .cn-scale { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-bottom: 4px; font-size: 8.5px; }
        .cn-scale-item { padding: 1px 5px; border: 1px solid color-mix(in srgb, var(--primary) 40%, white); border-radius: 2px; color: color-mix(in srgb, var(--ink) 55%, white); background: var(--bg); }
        .cn-scale-item strong { color: var(--primary); }
        .cn-ft { text-align: center; font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); }
        .cn-ft .next { font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1px; }
        .cn-ft .brand { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 30%, white); margin-top: 2px; font-style: italic; }

        @media print {
          body { background: white !important; }
          .cn-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="cn-hd">
        <div className="cn-logo">
          {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
        </div>
        <div className="cn-sch">
          <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
          <p>{[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</p>
          {school.motto && <p className="motto">"{school.motto}"</p>}
        </div>
        <div className="cn-crest">CREST</div>
      </div>

      <div className="cn-title">
        <h2>STUDENT ACADEMIC REPORT</h2>
        <div className="sub">{term.name?.toUpperCase()} · {term.session_name} SESSION</div>
      </div>

      <div className="cn-top">
        {settings?.show_photo !== false && (
          <div className="cn-photo">
            {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
          </div>
        )}
        <div className="cn-details">
          <div className="name">{fullName}</div>
          <div className="row"><span className="k">Admission No:</span><span className="v">{student.admission_number}</span></div>
          <div className="row"><span className="k">Class:</span><span className="v">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
          {student.gender && <div className="row"><span className="k">Gender:</span><span className="v">{student.gender}</span></div>}
          {student.date_of_birth && <div className="row"><span className="k">Date of Birth:</span><span className="v">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
          {settings?.show_house !== false && student.house && <div className="row"><span className="k">House:</span><span className="v">{student.house}</span></div>}
          {settings?.show_position !== false && summary.position_in_class && (
            <div className="row"><span className="k">Position in Class:</span><span className="v" style={{fontWeight:700}}>{ordinal(summary.position_in_class)} out of {summary.students_in_class}</span></div>
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

      <div className="cn-sh">Academic Performance</div>
      <table className="cn-tbl">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Subject</th>
            {breakdownCols.map((b, i) => (
              <th key={i}>{b.name}<br /><span style={{ fontWeight: 400, fontSize: '7.5px' }}>({b.max})</span></th>
            ))}
            <th>Total<br /><span style={{ fontWeight: 400, fontSize: '7.5px' }}>(100)</span></th>
            <th>Grade</th>
            {settings?.show_subject_position !== false && <th>Position</th>}
            {settings?.show_class_avg !== false && <th>Class Avg</th>}
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
              <td><span className={`cn-grade ${s.grade === 'F9' ? 'fail' : ''}`}>{s.grade || '—'}</span></td>
              {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
              {settings?.show_class_avg !== false && <td>{s.class_avg != null ? s.class_avg.toFixed(1) : '—'}</td>}
              <td>{s.remark || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL / AVERAGE ({scores.length} subjects)</td>
            <td colSpan={breakdownCols.length} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td>{summary.average?.toFixed(1)}</td>
            <td><span className="cn-grade">{summary.overall_grade || '—'}</span></td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 6 }}>{summary.overall_remark || 'Overall Term Performance'}</td>
          </tr>
        </tfoot>
      </table>

      {settings?.show_cumulative !== false && (
        <div className="cn-mid">
          <div className="cn-cum">
            <table>
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
          </div>
          <div className="cn-summary">
            {settings?.show_position !== false && <div><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
            <div><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
            <div><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
          </div>
        </div>
      )}

      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="cn-sh">Behaviour & Skills Assessment</div>
          <div className="cn-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective Domain (Character)</h4>
                {behavior.affective.slice(0, 6).map((t, i) => (
                  <div key={i} className="cn-trait"><span>{t.name}</span><span className="cn-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor Domain (Skills)</h4>
                {behavior.psychomotor.slice(0, 6).map((t, i) => (
                  <div key={i} className="cn-trait"><span>{t.name}</span><span className="cn-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <>
          <div className="cn-sh">Remarks</div>
          <div className="cn-comments">
            {settings?.show_teacher_comment !== false && (
              <div className="cn-cmt">
                <div className="k">Class Teacher's Remark</div>
                <div className="txt">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                <div className="sig-row"><strong>{comments?.teacher_name || 'Class Teacher'}</strong><br/>Signature ................</div>
              </div>
            )}
            {settings?.show_principal_comment !== false && (
              <div className="cn-cmt">
                <div className="k">Principal's Remark</div>
                <div className="txt">"{comments?.principal_comment || 'Comment pending.'}"</div>
                <div className="sig-row">
                  {school.principal_signature_url && <img className="cn-sig-img" src={school.principal_signature_url} alt="Signature" />}
                  <div><strong>{school.principal_name || 'Principal'}</strong></div>
                </div>
                {school.stamp_url && <div className="cn-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
              </div>
            )}
          </div>
        </>
      )}

      <div className="cn-footer">
        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="cn-scale">
            {grade_scale.map((g, i) => (
              <div key={i} className="cn-scale-item"><strong>{g.grade}</strong> {g.min}-{g.max}{g.remark ? ` (${g.remark})` : ''}</div>
            ))}
          </div>
        )}
        <div className="cn-ft">
          {term.next_term_begins && <div className="next">Next Term Begins: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          <div className="brand">This report is computer-generated by SchoolFlow</div>
        </div>
      </div>
    </div>
  );
}