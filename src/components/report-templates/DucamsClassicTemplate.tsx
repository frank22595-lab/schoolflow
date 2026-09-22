'use client';

import { ReportTemplateProps, ordinal, stars } from './types';

/**
 * DUCAMS Classic — inspired by Bright's original BramTech Records DUCAMS template.
 * Wide subject table with dynamic assessment columns.
 * Bottom section combines Affective + Psychomotor + Rating Scale + Grade Meaning in one horizontal strip.
 * Fits up to 18 subjects on ONE A4 page.
 */
export default function DucamsClassicTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, style,
}: ReportTemplateProps) {
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');

  // Get dynamic breakdown columns from first score (they all share the same structure)
  const breakdownCols = scores[0]?.breakdowns || [];

  return (
    <div className="du-page" style={{
      ['--primary' as any]: style.primary,
      ['--accent' as any]: style.accent,
      ['--bg' as any]: style.bg,
      ['--ink' as any]: style.ink,
      ['--soft' as any]: style.soft,
    }}>
      <style>{`
        .du-page {
          width: 210mm; height: 297mm; margin: 0 auto; background: var(--bg);
          padding: 8mm 9mm; box-sizing: border-box;
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: var(--ink);
          font-size: 9px; line-height: 1.3;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .du-page * { box-sizing: border-box; }

        /* Top header: logo + name center + photo */
        .du-top-header { display: grid; grid-template-columns: 62px 1fr 70px; align-items: center; gap: 10px; padding-bottom: 4px; border-bottom: 2px solid var(--primary); }
        .du-logo { width: 62px; height: 62px; border-radius: 50%; background: var(--soft); border: 1px solid var(--primary); overflow: hidden; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 22px; }
        .du-logo img { width: 100%; height: 100%; object-fit: contain; }
        .du-school-block { text-align: center; }
        .du-school-block h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: var(--primary); font-weight: 700; letter-spacing: 1.5px; line-height: 1.1; }
        .du-school-block p { font-size: 9px; color: color-mix(in srgb, var(--ink) 70%, white); margin-top: 2px; }
        .du-school-block .motto { color: var(--accent); font-style: italic; font-size: 9px; margin-top: 1px; }
        .du-photo { width: 70px; height: 84px; border: 1px solid var(--primary); background: var(--soft); overflow: hidden; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 22px; font-family: 'Playfair Display', serif; }
        .du-photo img { width: 100%; height: 100%; object-fit: cover; }

        /* Sheet title band */
        .du-title { text-align: center; padding: 4px 0 3px; margin-top: 4px; }
        .du-title h2 { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: var(--ink); }

        /* 3-column info grid: student | session/term | attendance */
        .du-info { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 2px; }
        .du-info-card { border: 1px solid var(--primary); }
        .du-info-card .row { display: grid; grid-template-columns: 100px 1fr; padding: 2.5px 6px; border-bottom: 1px solid color-mix(in srgb, var(--primary) 20%, white); font-size: 9px; }
        .du-info-card .row:last-child { border-bottom: 0; }
        .du-info-card .k { color: color-mix(in srgb, var(--ink) 65%, white); font-weight: 600; }
        .du-info-card .v { color: var(--ink); font-weight: 600; }
        .du-issued { background: var(--primary); color: white; text-align: center; padding: 6px; font-weight: 700; letter-spacing: 2px; font-size: 10px; margin-top: 4px; }

        /* Subject table */
        .du-tbl { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 5px; }
        .du-tbl thead th { background: var(--primary); color: white; padding: 4px 3px; text-align: center; font-weight: 700; font-size: 8.5px; letter-spacing: 0.3px; border: 1px solid var(--primary); line-height: 1.1; }
        .du-tbl thead th:first-child { text-align: left; padding-left: 6px; }
        .du-tbl tbody td { padding: 2.5px 4px; text-align: center; border: 1px solid color-mix(in srgb, var(--primary) 15%, white); }
        .du-tbl tbody td:first-child { text-align: left; padding-left: 6px; font-weight: 600; }
        .du-tbl tbody tr:nth-child(even) { background: var(--soft); }
        .du-grade-cell { font-weight: 700; padding: 1px 5px; border-radius: 2px; }
        .du-g-a { background: #d1fae5; color: #065f46; }
        .du-g-b { background: #dbeafe; color: #1e40af; }
        .du-g-c { background: #fef3c7; color: #92400e; }
        .du-g-d { background: #fed7aa; color: #9a3412; }
        .du-g-f { background: #fecaca; color: #991b1b; }
        .du-tbl tfoot td { background: color-mix(in srgb, var(--primary) 10%, white); font-weight: 700; padding: 4px; border: 1px solid var(--primary); color: var(--primary); font-size: 9.5px; }

        /* Bottom 4-panel strip: affective | psychomotor | grade scale | rating meaning */
        .du-bottom { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-top: 5px; }
        .du-panel { border: 1px solid var(--primary); overflow: hidden; }
        .du-panel-hd { background: var(--primary); color: white; text-align: center; padding: 3px; font-size: 8.5px; font-weight: 700; letter-spacing: 1px; }
        .du-panel-hd .r { float: right; opacity: 0.85; font-weight: 500; }
        .du-panel-body { padding: 3px 5px; font-size: 8.5px; }
        .du-trait-row { display: flex; justify-content: space-between; padding: 1.5px 0; border-bottom: 1px dotted color-mix(in srgb, var(--primary) 15%, white); align-items: center; }
        .du-trait-row:last-child { border-bottom: 0; }
        .du-trait-row .n { color: var(--ink); }
        .du-trait-row .r { color: var(--accent); font-weight: 700; font-family: sans-serif; }
        .du-scale-row, .du-mean-row { display: grid; grid-template-columns: 60px 40px 1fr; padding: 1px 0; font-size: 8px; align-items: center; }
        .du-scale-row .g { font-weight: 700; color: var(--primary); font-family: 'JetBrains Mono', monospace; }
        .du-mean-row .n { font-weight: 700; color: var(--accent); font-size: 9px; text-align: center; }
        .du-not-rec { text-align: center; padding: 10px 4px; color: color-mix(in srgb, var(--ink) 40%, white); font-style: italic; font-size: 9px; }

        /* Cumulative + Summary row */
        .du-cum-row { display: grid; grid-template-columns: 2fr 1fr; gap: 6px; margin-top: 5px; }
        .du-cum { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--primary); }
        .du-cum > div { text-align: center; padding: 4px 2px; border-right: 1px solid color-mix(in srgb, var(--primary) 20%, white); }
        .du-cum > div:last-child { border-right: 0; }
        .du-cum .lbl { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); text-transform: uppercase; letter-spacing: 0.5px; }
        .du-cum .val { font-size: 12px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1.1; }
        .du-cum > div.current { background: color-mix(in srgb, var(--primary) 8%, white); }
        .du-summary { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--primary); background: color-mix(in srgb, var(--primary) 8%, white); }
        .du-summary > div { text-align: center; padding: 4px 2px; border-right: 1px solid color-mix(in srgb, var(--primary) 20%, white); }
        .du-summary > div:last-child { border-right: 0; }
        .du-summary .lbl { font-size: 7.5px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; }
        .du-summary .val { font-size: 13px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1.1; }

        /* Comments row */
        .du-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 5px; }
        .du-cmt { border: 1px solid var(--primary); padding: 5px 7px; position: relative; min-height: 62px; background: var(--bg); }
        .du-cmt .k { font-size: 8px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; padding-bottom: 2px; border-bottom: 1px dotted color-mix(in srgb, var(--primary) 25%, white); }
        .du-cmt .txt { font-size: 9px; color: var(--ink); font-style: italic; line-height: 1.35; margin-bottom: 4px; }
        .du-cmt .sig { text-align: right; font-size: 8px; color: color-mix(in srgb, var(--ink) 60%, white); font-style: italic; }
        .du-cmt .sig strong { color: var(--primary); font-family: 'Playfair Display', serif; font-size: 9.5px; font-style: normal; }
        .du-sig-img { max-height: 22px; max-width: 70px; }
        .du-stamp { position: absolute; right: 6px; bottom: 6px; width: 48px; height: 48px; opacity: 0.55; }
        .du-stamp img { width: 100%; height: 100%; object-fit: contain; }

        /* Footer */
        .du-footer { margin-top: auto; padding-top: 4px; text-align: center; font-size: 8.5px; color: color-mix(in srgb, var(--ink) 55%, white); }
        .du-footer .next { color: var(--primary); font-weight: 700; letter-spacing: 0.5px; }
        .du-footer .brand { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 30%, white); margin-top: 2px; }

        @media print {
          body { background: white !important; }
          .du-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Top row: logo, school block, photo */}
      <div className="du-top-header">
        <div className="du-logo">
          {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
        </div>
        <div className="du-school-block">
          <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
          <p>{[school.address, school.phone && `Tel: ${school.phone}`, school.email].filter(Boolean).join(' · ')}</p>
          {school.motto && <p className="motto">"{school.motto}"</p>}
        </div>
        {settings?.show_photo !== false && (
          <div className="du-photo">
            {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="du-title">
        <h2>STUDENT RESULT SHEET</h2>
      </div>

      {/* 3-column info: student | session/term | attendance */}
      <div className="du-info">
        <div className="du-info-card">
          <div className="row"><span className="k">Name of student</span><span className="v">{fullName}</span></div>
          <div className="row"><span className="k">Class</span><span className="v">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
          <div className="row"><span className="k">Admission No.</span><span className="v">{student.admission_number}</span></div>
          {student.gender && <div className="row"><span className="k">Gender</span><span className="v">{student.gender}</span></div>}
          {settings?.show_house !== false && student.house && <div className="row"><span className="k">House</span><span className="v">{student.house}</span></div>}
        </div>
        <div className="du-info-card">
          <div className="row"><span className="k">Session</span><span className="v">{term.session_name}</span></div>
          <div className="row"><span className="k">Term</span><span className="v">{term.name}</span></div>
          {term.next_term_begins && <div className="row"><span className="k">Next term begins</span><span className="v">{new Date(term.next_term_begins).toLocaleDateString('en-GB')}</span></div>}
          {settings?.show_position !== false && summary.position_in_class && (
            <div className="row"><span className="k">Position in class</span><span className="v">{ordinal(summary.position_in_class)} of {summary.students_in_class}</span></div>
          )}
          <div className="row"><span className="k">Subjects offered</span><span className="v">{scores.length}</span></div>
        </div>
        {settings?.show_attendance !== false && (
          <div className="du-info-card">
            <div className="row"><span className="k">Days school opened</span><span className="v">{attendance?.total_days ?? '—'}</span></div>
            <div className="row"><span className="k">Days present</span><span className="v">{attendance?.present ?? '—'}</span></div>
            <div className="row"><span className="k">Days absent</span><span className="v">{attendance?.absent ?? '—'}</span></div>
            <div className="row"><span className="k">Days late</span><span className="v">{attendance?.late ?? '—'}</span></div>
            <div className="row"><span className="k">Attendance rate</span><span className="v">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</span></div>
          </div>
        )}
      </div>

      {/* Result issued banner */}
      <div className="du-issued">RESULT ISSUED</div>

      {/* Subject table with dynamic assessment columns */}
      <table className="du-tbl">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>SUBJECT</th>
            {breakdownCols.map((b, i) => (
              <th key={i}>{b.name}<br /><span style={{ fontWeight: 400, fontSize: '7.5px' }}>({b.max})</span></th>
            ))}
            <th>TOTAL<br /><span style={{ fontWeight: 400, fontSize: '7.5px' }}>(100)</span></th>
            <th>GRADE</th>
            {settings?.show_subject_position !== false && <th>POSITION</th>}
            {settings?.show_class_avg !== false && <th>CLASS<br />AVG</th>}
            <th>REMARK</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => {
            const g = s.grade || '';
            const cls = g.startsWith('A') ? 'du-g-a' : g.startsWith('B') ? 'du-g-b' : g.startsWith('C') ? 'du-g-c' : g === 'D7' || g === 'E8' ? 'du-g-d' : g === 'F9' ? 'du-g-f' : '';
            return (
              <tr key={i}>
                <td>{s.subject_name}</td>
                {breakdownCols.map((col, ci) => {
                  const val = s.breakdowns?.[ci]?.score;
                  return <td key={ci}>{val == null ? '—' : val}</td>;
                })}
                <td><strong>{s.total ?? '—'}</strong></td>
                <td><span className={`du-grade-cell ${cls}`}>{s.grade || '—'}</span></td>
                {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
                {settings?.show_class_avg !== false && <td>{s.class_avg != null ? s.class_avg.toFixed(1) : '—'}</td>}
                <td>{s.remark || '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL — {scores.length} SUBJECTS</td>
            <td colSpan={breakdownCols.length} style={{ textAlign: 'center' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td>{summary.average?.toFixed(1)}</td>
            <td>{summary.overall_grade || '—'}</td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 6 }}>{summary.overall_remark || 'Overall Performance'}</td>
          </tr>
        </tfoot>
      </table>

      {/* Cumulative + Summary row */}
      {settings?.show_cumulative !== false && (
        <div className="du-cum-row">
          <div className="du-cum">
            <div className={term.name?.includes('First') ? 'current' : ''}><div className="lbl">1st Term</div><div className="val">{cumulative?.term1_avg?.toFixed(1) || '—'}</div></div>
            <div className={term.name?.includes('Second') ? 'current' : ''}><div className="lbl">2nd Term</div><div className="val">{cumulative?.term2_avg?.toFixed(1) || '—'}</div></div>
            <div className={term.name?.includes('Third') ? 'current' : ''}><div className="lbl">3rd Term</div><div className="val">{cumulative?.term3_avg?.toFixed(1) || '—'}</div></div>
            <div><div className="lbl">Cumulative</div><div className="val">{cumulative?.cumulative_avg?.toFixed(1) || '—'}</div></div>
          </div>
          <div className="du-summary">
            {settings?.show_position !== false && <div><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
            <div><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
            <div><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
          </div>
        </div>
      )}

      {/* Bottom 4-panel strip: affective | psychomotor | grade scale | rating meaning */}
      <div className="du-bottom">
        {settings?.show_affective !== false && (
          <div className="du-panel">
            <div className="du-panel-hd">AFFECTIVE TRAITS <span className="r">RATING</span></div>
            <div className="du-panel-body">
              {behavior?.affective?.length > 0 ? (
                behavior.affective.slice(0, 7).map((t, i) => (
                  <div key={i} className="du-trait-row"><span className="n">{t.name}</span><span className="r">{t.rating}</span></div>
                ))
              ) : <div className="du-not-rec">Not recorded</div>}
            </div>
          </div>
        )}

        {settings?.show_psychomotor !== false && (
          <div className="du-panel">
            <div className="du-panel-hd">PSYCHOMOTOR SKILLS <span className="r">RATING</span></div>
            <div className="du-panel-body">
              {behavior?.psychomotor?.length > 0 ? (
                behavior.psychomotor.slice(0, 7).map((t, i) => (
                  <div key={i} className="du-trait-row"><span className="n">{t.name}</span><span className="r">{t.rating}</span></div>
                ))
              ) : <div className="du-not-rec">Not recorded</div>}
            </div>
          </div>
        )}

        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="du-panel">
            <div className="du-panel-hd">GRADING SCALE</div>
            <div className="du-panel-body">
              {grade_scale.map((g, i) => (
                <div key={i} className="du-scale-row">
                  <span>{g.min}-{g.max}%</span>
                  <span className="g">{g.grade}</span>
                  <span>{g.remark || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="du-panel">
          <div className="du-panel-hd">RATING KEY</div>
          <div className="du-panel-body">
            <div className="du-mean-row"><span className="n">5</span><span></span><span>Excellent</span></div>
            <div className="du-mean-row"><span className="n">4</span><span></span><span>Very Good</span></div>
            <div className="du-mean-row"><span className="n">3</span><span></span><span>Good</span></div>
            <div className="du-mean-row"><span className="n">2</span><span></span><span>Fair</span></div>
            <div className="du-mean-row"><span className="n">1</span><span></span><span>Poor</span></div>
          </div>
        </div>
      </div>

      {/* Comments */}
      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <div className="du-comments">
          {settings?.show_teacher_comment !== false && (
            <div className="du-cmt">
              <div className="k">Class Teacher's Report</div>
              <div className="txt">"{comments?.teacher_comment || 'Comment pending.'}"</div>
              <div className="sig"><strong>{comments?.teacher_name || 'Class Teacher'}</strong></div>
            </div>
          )}
          {settings?.show_principal_comment !== false && (
            <div className="du-cmt">
              <div className="k">Director's Report</div>
              <div className="txt">"{comments?.principal_comment || 'Comment pending.'}"</div>
              <div className="sig">
                {school.principal_signature_url && <img className="du-sig-img" src={school.principal_signature_url} alt="Signature" />}
                <div><strong>{school.principal_name || 'The Director'}</strong></div>
              </div>
              {school.stamp_url && <div className="du-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="du-footer">
        {term.next_term_begins && <div className="next">Next term begins: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
        <div className="brand">Computer-generated by SchoolFlow · schoolflow.ng</div>
      </div>
    </div>
  );
}
