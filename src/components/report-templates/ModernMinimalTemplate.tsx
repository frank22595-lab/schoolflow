'use client';

import { ReportTemplateProps, ordinal, stars, gradeChip } from './types';

/**
 * Modern Minimal — clean, sans-serif, generous whitespace with subtle color.
 * 3 color styles: Indigo, Rose, Forest. Fits up to 18 subjects on ONE A4 page.
 */
export default function ModernMinimalTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, style,
}: ReportTemplateProps) {
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const breakdownCols = scores[0]?.breakdowns || [];

  return (
    <div className="mm-page" style={{
      ['--primary' as any]: style.primary,
      ['--accent' as any]: style.accent,
      ['--bg' as any]: style.bg,
      ['--ink' as any]: style.ink,
      ['--soft' as any]: style.soft,
    }}>
      <style>{`
        .mm-page {
          width: 210mm; height: 297mm; margin: 0 auto; background: var(--bg);
          padding: 10mm 12mm; box-sizing: border-box;
          font-family: 'Inter', -apple-system, sans-serif; color: var(--ink);
          font-size: 9.5px; line-height: 1.3;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .mm-page * { box-sizing: border-box; }

        .mm-hd { display: flex; align-items: center; gap: 12px; padding-bottom: 6px; border-bottom: 3px solid var(--primary); }
        .mm-logo { width: 52px; height: 52px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 19px; overflow: hidden; flex-shrink: 0; }
        .mm-logo img { width: 100%; height: 100%; object-fit: contain; }
        .mm-sch { flex: 1; }
        .mm-sch h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 700; color: var(--ink); line-height: 1.1; }
        .mm-sch p { font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); margin-top: 2px; }
        .mm-sch .motto { color: var(--accent); font-style: italic; font-size: 9px; margin-top: 1px; }

        .mm-title { text-align: center; padding: 5px 8px; background: var(--soft); border-radius: 6px; margin-top: 5px; }
        .mm-title h2 { font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 600; color: var(--primary); letter-spacing: 1.5px; }

        .mm-top { display: grid; grid-template-columns: 1fr 200px; gap: 8px; margin-top: 6px; }
        .mm-student { display: grid; grid-template-columns: 62px 1fr; gap: 10px; padding: 8px; background: var(--soft); border-radius: 6px; }
        .mm-photo { width: 62px; height: 76px; border-radius: 6px; background: color-mix(in srgb, var(--primary) 15%, white); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 22px; overflow: hidden; flex-shrink: 0; }
        .mm-photo img { width: 100%; height: 100%; object-fit: cover; }
        .mm-details { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 14px; align-content: center; font-size: 9.5px; }
        .mm-details .name { grid-column: 1 / -1; font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 3px; font-family: 'Playfair Display', serif; }
        .mm-details .item { display: flex; gap: 4px; }
        .mm-details .k { color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 500; min-width: 55px; }
        .mm-details .v { color: var(--ink); font-weight: 600; }
        .mm-pos { background: #10b981; color: white; padding: 1px 7px; border-radius: 10px; font-size: 9.5px; font-weight: 700; }

        .mm-att { padding: 8px; background: var(--soft); border-radius: 6px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; align-content: center; }
        .mm-att-cell { text-align: center; }
        .mm-att-cell .num { font-size: 15px; font-weight: 700; color: var(--primary); line-height: 1; font-family: 'Playfair Display', serif; }
        .mm-att-cell .lbl { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); letter-spacing: 0.3px; text-transform: uppercase; margin-top: 1px; }

        .mm-sh { margin: 6px 0 3px; padding-bottom: 2px; border-bottom: 1.5px solid color-mix(in srgb, var(--primary) 25%, white); font-size: 9px; font-weight: 700; color: var(--primary); letter-spacing: 1.2px; text-transform: uppercase; }

        .mm-tbl { width: 100%; border-collapse: collapse; font-size: 9px; }
        .mm-tbl thead th { background: var(--primary); color: white; padding: 4px; text-align: center; font-weight: 600; font-size: 8.5px; letter-spacing: 0.3px; line-height: 1.1; }
        .mm-tbl thead th:first-child { text-align: left; padding-left: 8px; }
        .mm-tbl tbody td { padding: 3px 4px; text-align: center; border-bottom: 1px solid color-mix(in srgb, var(--primary) 10%, white); }
        .mm-tbl tbody td:first-child { text-align: left; padding-left: 8px; font-weight: 500; }
        .mm-tbl tbody tr:nth-child(even) { background: var(--soft); }
        .mm-grade { display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 700; font-size: 9px; font-family: 'JetBrains Mono', monospace; }
        .mm-tbl tfoot td { background: var(--soft); padding: 5px 4px; font-weight: 700; border-top: 2px solid var(--primary); font-size: 9.5px; color: var(--primary); }

        .mm-mid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
        .mm-cum { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .mm-cum-cell { text-align: center; padding: 4px; background: var(--soft); border-radius: 4px; }
        .mm-cum-cell.current { background: color-mix(in srgb, var(--primary) 12%, white); }
        .mm-cum-cell .lbl { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); letter-spacing: 0.3px; text-transform: uppercase; }
        .mm-cum-cell .val { font-size: 13px; font-weight: 700; color: var(--ink); font-family: 'Playfair Display', serif; }
        .mm-cum-cell.current .val { color: var(--primary); }
        .mm-summary { padding: 6px 10px; background: linear-gradient(to right, var(--soft), color-mix(in srgb, var(--accent) 8%, white)); border-radius: 4px; display: flex; align-items: center; justify-content: space-around; gap: 6px; }
        .mm-summary .item { text-align: center; }
        .mm-summary .lbl { font-size: 7.5px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.3px; }
        .mm-summary .val { font-size: 14px; font-weight: 700; color: var(--primary); font-family: 'Playfair Display', serif; line-height: 1.1; }

        .mm-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 2px; }
        .mm-behavior h4 { font-size: 8.5px; color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 700; margin-bottom: 2px; letter-spacing: 0.3px; text-transform: uppercase; }
        .mm-trait { display: flex; justify-content: space-between; align-items: center; padding: 1.5px 0; font-size: 9.5px; border-bottom: 1px dashed color-mix(in srgb, var(--primary) 10%, white); }
        .mm-stars { color: #fbbf24; font-size: 11px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }

        .mm-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }
        .mm-cmt { padding: 6px 8px; background: var(--soft); border-radius: 4px; border-left: 2.5px solid var(--primary); position: relative; }
        .mm-cmt .k { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; }
        .mm-cmt .txt { color: var(--ink); font-style: italic; line-height: 1.35; margin-bottom: 4px; font-size: 9.5px; }
        .mm-cmt .sig { font-size: 8.5px; color: color-mix(in srgb, var(--ink) 55%, white); text-align: right; }
        .mm-cmt .sig strong { color: var(--primary); }
        .mm-sig-img { max-height: 22px; max-width: 70px; }
        .mm-stamp { position: absolute; right: 6px; bottom: 6px; width: 50px; height: 50px; opacity: 0.55; }
        .mm-stamp img { width: 100%; height: 100%; object-fit: contain; }

        .mm-footer { margin-top: auto; padding-top: 6px; border-top: 1.5px solid color-mix(in srgb, var(--primary) 20%, white); }
        .mm-scale { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-bottom: 4px; font-size: 8.5px; }
        .mm-scale-item { background: var(--soft); padding: 2px 6px; border-radius: 3px; color: color-mix(in srgb, var(--ink) 55%, white); }
        .mm-scale-item strong { color: var(--ink); font-family: 'JetBrains Mono', monospace; }
        .mm-ft { text-align: center; font-size: 9px; color: color-mix(in srgb, var(--ink) 55%, white); }
        .mm-ft .next { font-weight: 700; color: var(--primary); }
        .mm-ft .brand { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 30%, white); margin-top: 2px; }

        @media print {
          body { background: white !important; }
          .mm-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="mm-hd">
        <div className="mm-logo">
          {school.logo_url ? <img src={school.logo_url} alt="Logo" /> : (school.name?.[0] || 'S')}
        </div>
        <div className="mm-sch">
          <h1>{school.name?.toUpperCase() || 'SCHOOL NAME'}</h1>
          <p>{[school.address, school.phone, school.email].filter(Boolean).join(' · ')}</p>
          {school.motto && <p className="motto">"{school.motto}"</p>}
        </div>
      </div>

      <div className="mm-title">
        <h2>STUDENT ACADEMIC REPORT · {term.name?.toUpperCase()} · {term.session_name}</h2>
      </div>

      <div className="mm-top">
        <div className="mm-student">
          {settings?.show_photo !== false && (
            <div className="mm-photo">
              {student.photo_url ? <img src={student.photo_url} alt={fullName} /> : initials}
            </div>
          )}
          <div className="mm-details">
            <div className="name">{fullName}</div>
            <div className="item"><span className="k">Adm No:</span><span className="v">{student.admission_number}</span></div>
            <div className="item"><span className="k">Class:</span><span className="v">{section.full_name || `${section.class_level_name} ${section.name}`}</span></div>
            {student.gender && <div className="item"><span className="k">Gender:</span><span className="v">{student.gender}</span></div>}
            {settings?.show_house !== false && student.house && <div className="item"><span className="k">House:</span><span className="v">{student.house}</span></div>}
            {student.date_of_birth && <div className="item"><span className="k">DOB:</span><span className="v">{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</span></div>}
            {settings?.show_position !== false && summary.position_in_class && (
              <div className="item"><span className="k">Position:</span><span className="v"><span className="mm-pos">{ordinal(summary.position_in_class)} of {summary.students_in_class}</span></span></div>
            )}
          </div>
        </div>
        {settings?.show_attendance !== false && (
          <div className="mm-att">
            <div className="mm-att-cell"><div className="num">{attendance?.present ?? '—'}</div><div className="lbl">Present</div></div>
            <div className="mm-att-cell"><div className="num">{attendance?.absent ?? '—'}</div><div className="lbl">Absent</div></div>
            <div className="mm-att-cell"><div className="num">{attendance?.late ?? '—'}</div><div className="lbl">Late</div></div>
            <div className="mm-att-cell"><div className="num">{attendance?.rate_percent ? `${attendance.rate_percent}%` : '—'}</div><div className="lbl">Rate</div></div>
          </div>
        )}
      </div>

      <div className="mm-sh">Academic Performance</div>
      <table className="mm-tbl">
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
          {scores.map((s, i) => {
            const gc = gradeChip(s.grade);
            return (
              <tr key={i}>
                <td>{s.subject_name}</td>
                {breakdownCols.map((col, ci) => {
                  const val = s.breakdowns?.[ci]?.score;
                  return <td key={ci}>{val == null ? '—' : val}</td>;
                })}
                <td><strong>{s.total ?? '—'}</strong></td>
                <td><span className="mm-grade" style={{ background: gc.bg, color: gc.fg }}>{s.grade || '—'}</span></td>
                {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
                {settings?.show_class_avg !== false && <td>{s.class_avg != null ? s.class_avg.toFixed(1) : '—'}</td>}
                <td>{s.remark || '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL / AVERAGE ({scores.length} subjects)</td>
            <td colSpan={breakdownCols.length} style={{ textAlign: 'center', color: 'color-mix(in srgb, var(--ink) 55%, white)' }}>{summary.total_marks} / {scores.length * 100}</td>
            <td><strong>{summary.average?.toFixed(1)}</strong></td>
            <td>{(() => { const gc = gradeChip(summary.overall_grade); return <span className="mm-grade" style={{ background: gc.bg, color: gc.fg }}>{summary.overall_grade || '—'}</span>; })()}</td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 8 }}>{summary.overall_remark || 'Overall performance'}</td>
          </tr>
        </tfoot>
      </table>

      {settings?.show_cumulative !== false && (
        <div className="mm-mid">
          <div>
            <div className="mm-sh">Cumulative</div>
            <div className="mm-cum">
              <div className={`mm-cum-cell ${term.name?.includes('First') ? 'current' : ''}`}><div className="lbl">1st Term</div><div className="val">{cumulative?.term1_avg?.toFixed(1) || '—'}</div></div>
              <div className={`mm-cum-cell ${term.name?.includes('Second') ? 'current' : ''}`}><div className="lbl">2nd Term</div><div className="val">{cumulative?.term2_avg?.toFixed(1) || '—'}</div></div>
              <div className={`mm-cum-cell ${term.name?.includes('Third') ? 'current' : ''}`}><div className="lbl">3rd Term</div><div className="val">{cumulative?.term3_avg?.toFixed(1) || '—'}</div></div>
              <div className="mm-cum-cell"><div className="lbl">Overall</div><div className="val">{cumulative?.cumulative_avg?.toFixed(1) || '—'}</div></div>
            </div>
          </div>
          <div>
            <div className="mm-sh">Summary</div>
            <div className="mm-summary">
              {settings?.show_position !== false && <div className="item"><div className="lbl">Position</div><div className="val">{summary.position_in_class ? ordinal(summary.position_in_class) : '—'}</div></div>}
              <div className="item"><div className="lbl">Average</div><div className="val">{summary.average?.toFixed(1) || '—'}</div></div>
              <div className="item"><div className="lbl">Grade</div><div className="val">{summary.overall_grade || '—'}</div></div>
            </div>
          </div>
        </div>
      )}

      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="mm-sh">Behavior & Skills</div>
          <div className="mm-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective (Character)</h4>
                {behavior.affective.slice(0, 6).map((t, i) => (
                  <div key={i} className="mm-trait"><span>{t.name}</span><span className="mm-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor (Skills)</h4>
                {behavior.psychomotor.slice(0, 6).map((t, i) => (
                  <div key={i} className="mm-trait"><span>{t.name}</span><span className="mm-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <>
          <div className="mm-sh">Remarks</div>
          <div className="mm-comments">
            {settings?.show_teacher_comment !== false && (
              <div className="mm-cmt">
                <div className="k">Class Teacher</div>
                <div className="txt">"{comments?.teacher_comment || 'Comment pending.'}"</div>
                <div className="sig"><strong>{comments?.teacher_name || 'Class Teacher'}</strong></div>
              </div>
            )}
            {settings?.show_principal_comment !== false && (
              <div className="mm-cmt">
                <div className="k">Principal</div>
                <div className="txt">"{comments?.principal_comment || 'Comment pending.'}"</div>
                <div className="sig">
                  {school.principal_signature_url && <img className="mm-sig-img" src={school.principal_signature_url} alt="Signature" />}
                  <div><strong>{school.principal_name || 'Principal'}</strong></div>
                </div>
                {school.stamp_url && <div className="mm-stamp"><img src={school.stamp_url} alt="Stamp" /></div>}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mm-footer">
        {settings?.show_grade_scale !== false && grade_scale?.length > 0 && (
          <div className="mm-scale">
            {grade_scale.map((g, i) => (
              <div key={i} className="mm-scale-item"><strong>{g.grade}</strong> {g.min}-{g.max}</div>
            ))}
          </div>
        )}
        <div className="mm-ft">
          {term.next_term_begins && <div className="next">Next Term Begins: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          <div className="brand">Computer-generated · SchoolFlow · schoolflow.ng</div>
        </div>
      </div>
    </div>
  );
}
