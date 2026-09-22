'use client';

import { ReportTemplateProps, ordinal, stars } from './types';

/**
 * Warm Academic — cream tones with ornamental flourishes, diploma-like feel.
 * 3 color styles: Burgundy, Sepia, Old Green. Fits up to 18 subjects on ONE A4 page.
 */
export default function WarmAcademicTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, style,
}: ReportTemplateProps) {
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const breakdownCols = scores[0]?.breakdowns || [];

  return (
    <div className="wa-page" style={{
      ['--primary' as any]: style.primary,
      ['--accent' as any]: style.accent,
      ['--bg' as any]: style.bg,
      ['--ink' as any]: style.ink,
      ['--soft' as any]: style.soft,
    }}>
      <style>{`
        .wa-page {
          width: 210mm; height: 297mm; margin: 0 auto;
          background: linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--soft) 60%, var(--bg)));
          padding: 9mm 11mm; box-sizing: border-box;
          font-family: 'Lora', Georgia, serif; color: var(--ink);
          font-size: 9.5px; line-height: 1.3;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .wa-page * { box-sizing: border-box; }

        .wa-header { text-align: center; padding-bottom: 5px; margin-bottom: 5px; position: relative; }
        .wa-ornament { text-align: center; font-size: 12px; color: var(--accent); letter-spacing: 6px; margin-bottom: 3px; }
        .wa-header-inner { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .wa-logo { width: 52px; height: 52px; border: 1.5px solid var(--primary); background: var(--soft); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 20px; overflow: hidden; font-family: 'Playfair Display', serif; }
        .wa-logo img { width: 100%; height: 100%; object-fit: contain; }
        .wa-school h1 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--primary); letter-spacing: 2px; line-height: 1.1; }
        .wa-school p { font-size: 9px; color: color-mix(in srgb, var(--ink) 60%, white); margin-top: 2px; font-style: italic; }
        .wa-school .motto { color: var(--accent); font-size: 9px; margin-top: 2px; font-family: 'Playfair Display', serif; font-style: italic; letter-spacing: 1px; }

        .wa-title { text-align: center; padding: 5px 0; margin-bottom: 5px; border-top: 1.5px solid var(--primary); border-bottom: 1.5px solid var(--primary); background: linear-gradient(to right, transparent, var(--soft), transparent); }
        .wa-title h2 { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--primary); letter-spacing: 3px; }
        .wa-title .sub { font-size: 10px; color: var(--accent); margin-top: 2px; letter-spacing: 1.5px; font-style: italic; font-family: 'Playfair Display', serif; }

        .wa-top { display: grid; grid-template-columns: 78px 1fr 175px; gap: 10px; margin-bottom: 5px; padding: 6px; background: linear-gradient(135deg, var(--soft), var(--bg)); border: 1px solid color-mix(in srgb, var(--primary) 25%, white); border-radius: 5px; }
        .wa-photo { width: 78px; height: 94px; border: 2px solid var(--primary); background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 26px; overflow: hidden; font-family: 'Playfair Display', serif; box-shadow: 0 2px 3px color-mix(in srgb, var(--primary) 15%, transparent); }
        .wa-photo img { width: 100%; height: 100%; object-fit: cover; }
        .wa-details { align-content: center; display: grid; gap: 2px; font-size: 10px; }
        .wa-details .name { font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 3px; font-family: 'Playfair Display', serif; letter-spacing: 0.8px; padding-bottom: 2px; border-bottom: 1px dashed var(--accent); }
        .wa-details .row { display: grid; grid-template-columns: 100px 1fr; }
        .wa-details .label { color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 500; font-style: italic; }
        .wa-details .value { color: var(--primary); font-weight: 600; font-family: 'Playfair Display', serif; }
        .wa-att-panel { border: 1px solid var(--accent); border-radius: 4px; padding: 5px; background: linear-gradient(135deg, var(--bg), var(--soft)); }
        .wa-att-title { text-align: center; font-size: 8.5px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 3px; border-bottom: 1px solid var(--accent); margin-bottom: 4px; font-family: 'Playfair Display', serif; }
        .wa-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
        .wa-att-cell { text-align: center; padding: 1px; }
        .wa-att-cell .num { font-size: 12px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1; }
        .wa-att-cell .lbl { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); letter-spacing: 0.3px; text-transform: uppercase; font-style: italic; }

        .wa-section-hd { text-align: center; margin: 5px 0 3px; padding: 3px 0; position: relative; }
        .wa-section-hd h3 { font-family: 'Playfair Display', serif; font-size: 11px; font-weight: 700; color: var(--primary); letter-spacing: 2px; text-transform: uppercase; background: var(--bg); padding: 0 10px; display: inline-block; position: relative; z-index: 1; }
        .wa-section-hd::before { content: ''; position: absolute; left: 15%; right: 15%; top: 50%; height: 1px; background: var(--primary); z-index: 0; }

        .wa-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .wa-table thead th { background: var(--primary); color: var(--soft); padding: 4px 3px; text-align: center; font-weight: 600; font-size: 8.5px; letter-spacing: 0.3px; font-family: 'Playfair Display', serif; text-transform: uppercase; line-height: 1.1; }
        .wa-table thead th:first-child { text-align: left; padding-left: 6px; }
        .wa-table tbody td { padding: 3px; text-align: center; border-bottom: 1px solid color-mix(in srgb, var(--accent) 25%, white); }
        .wa-table tbody td:first-child { text-align: left; padding-left: 6px; font-weight: 500; }
        .wa-table tbody tr:nth-child(even) { background: var(--soft); }
        .wa-grade { display: inline-block; padding: 1px 5px; border: 1px solid var(--accent); border-radius: 3px; font-weight: 700; font-size: 9px; color: var(--primary); background: var(--bg); font-family: 'Playfair Display', serif; }
        .wa-grade.fail { color: #7f1d1d; border-color: #7f1d1d; background: #fee2e2; }
        .wa-table tfoot td { background: linear-gradient(to right, var(--soft), var(--bg), var(--soft)); padding: 5px 3px; font-weight: 700; border-top: 2px solid var(--primary); border-bottom: 2px solid var(--primary); font-size: 10px; color: var(--primary); font-family: 'Playfair Display', serif; }

        .wa-mid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; margin-top: 4px; }
        .wa-cum-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .wa-cum-table th, .wa-cum-table td { padding: 3px; text-align: center; border: 1px solid var(--accent); }
        .wa-cum-table th { background: var(--primary); color: var(--soft); font-weight: 600; font-size: 8px; letter-spacing: 0.5px; text-transform: uppercase; font-family: 'Playfair Display', serif; }
        .wa-cum-table td.current { background: var(--soft); color: var(--primary); font-weight: 700; font-family: 'Playfair Display', serif; }
        .wa-summary-box { border: 2px solid var(--primary); border-radius: 5px; padding: 5px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; text-align: center; background: linear-gradient(135deg, var(--soft), var(--bg)); }
        .wa-summary-box .lbl { font-size: 8px; color: var(--accent); letter-spacing: 0.5px; text-transform: uppercase; font-style: italic; }
        .wa-summary-box .val { font-size: 15px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 0.5px; line-height: 1.1; }

        .wa-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 6px; background: linear-gradient(135deg, var(--soft), var(--bg)); border: 1px solid color-mix(in srgb, var(--primary) 20%, white); border-radius: 4px; }
        .wa-behavior h4 { font-size: 9px; color: var(--primary); font-weight: 700; margin-bottom: 3px; letter-spacing: 0.7px; text-transform: uppercase; text-align: center; padding-bottom: 2px; border-bottom: 1px dashed var(--accent); font-family: 'Playfair Display', serif; }
        .wa-trait { display: flex; justify-content: space-between; align-items: center; padding: 1.5px 3px; font-size: 9.5px; border-bottom: 1px dotted color-mix(in srgb, var(--accent) 30%, white); }
        .wa-stars { color: var(--accent); font-size: 11px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }

        .wa-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .wa-comment { padding: 6px 8px; border: 1px solid var(--primary); border-radius: 4px; background: linear-gradient(135deg, var(--bg), var(--soft)); font-size: 10px; position: relative; }
        .wa-comment .label { font-size: 8.5px; color: var(--primary); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 3px; padding-bottom: 2px; border-bottom: 1px dashed var(--accent); font-family: 'Playfair Display', serif; }
        .wa-comment .text { color: var(--ink); font-style: italic; line-height: 1.35; margin-bottom: 4px; }
        .wa-comment .sig-row { border-top: 1px dotted var(--accent); padding-top: 3px; text-align: right; font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); font-style: italic; }
        .wa-comment .sig-row strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 10px; font-style: normal; letter-spacing: 0.3px; }
        .wa-sig-img { max-height: 22px; max-width: 70px; }
        .wa-stamp { position: absolute; right: 6px; bottom: 6px; width: 52px; height: 52px; opacity: 0.55; }
        .wa-stamp img { width: 100%; height: 100%; object-fit: contain; }

        .wa-footer { margin-top: auto; padding-top: 5px; border-top: 2px solid var(--primary); }
        .wa-scale { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-bottom: 4px; font-size: 8.5px; }
        .wa-scale-item { padding: 1px 5px; border: 1px solid var(--accent); border-radius: 3px; color: color-mix(in srgb, var(--ink) 55%, white); background: var(--bg); }
        .wa-scale-item strong { color: var(--primary); font-family: 'Playfair Display', serif; }
        .wa-ft-text { text-align: center; font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); font-style: italic; }
        .wa-ft-text .next { font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; letter-spacing: 1px; font-style: normal; }
        .wa-ft-text .brand { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 30%, white); margin-top: 2px; letter-spacing: 0.5px; }
        .wa-ornament-bottom { text-align: center; font-size: 11px; color: var(--accent); letter-spacing: 5px; margin-top: 3px; }

        @media print {
          body { background: white !important; }
          .wa-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

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

      <div className="wa-title">
        <h2>STUDENT ACADEMIC REPORT</h2>
        <div className="sub">{term.name} · {term.session_name} Academic Session</div>
      </div>

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

      <div className="wa-section-hd"><h3>Academic Performance</h3></div>
      <table className="wa-table">
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
              <td><span className={`wa-grade ${s.grade === 'F9' ? 'fail' : ''}`}>{s.grade || '—'}</span></td>
              {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
              {settings?.show_class_avg !== false && <td>{s.class_avg != null ? s.class_avg.toFixed(1) : '—'}</td>}
              <td>{s.remark || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL ({scores.length} subjects)</td>
            <td colSpan={breakdownCols.length} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td>{summary.average?.toFixed(1)}</td>
            <td><span className="wa-grade">{summary.overall_grade || '—'}</span></td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 6 }}>{summary.overall_remark || 'Overall Performance'}</td>
          </tr>
        </tfoot>
      </table>

      {settings?.show_cumulative !== false && (
        <div className="wa-mid">
          <table className="wa-cum-table">
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
          <div className="wa-summary-box">
            {settings?.show_position !== false && <div><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
            <div><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
            <div><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
          </div>
        </div>
      )}

      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="wa-section-hd"><h3>Character & Skills</h3></div>
          <div className="wa-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective Domain</h4>
                {behavior.affective.slice(0, 6).map((t, i) => (
                  <div key={i} className="wa-trait"><span>{t.name}</span><span className="wa-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor Domain</h4>
                {behavior.psychomotor.slice(0, 6).map((t, i) => (
                  <div key={i} className="wa-trait"><span>{t.name}</span><span className="wa-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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