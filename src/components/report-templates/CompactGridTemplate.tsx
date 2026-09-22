'use client';

import { ReportTemplateProps, ordinal, stars, gradeChip } from './types';

/**
 * Compact Grid — dense information design with colored header bar.
 * 3 color styles: Ocean Teal, Deep Navy, Slate. Fits up to 18 subjects on ONE A4 page.
 */
export default function CompactGridTemplate({
  school, student, section, term, scores, summary, behavior, comments,
  attendance, cumulative, grade_scale, settings, style,
}: ReportTemplateProps) {
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toUpperCase();
  const breakdownCols = scores[0]?.breakdowns || [];

  return (
    <div className="cg-page" style={{
      ['--primary' as any]: style.primary,
      ['--accent' as any]: style.accent,
      ['--bg' as any]: style.bg,
      ['--ink' as any]: style.ink,
      ['--soft' as any]: style.soft,
    }}>
      <style>{`
        .cg-page {
          width: 210mm; height: 297mm; margin: 0 auto; background: var(--bg);
          padding: 8mm 10mm; box-sizing: border-box;
          font-family: 'Inter', 'Helvetica', sans-serif; color: var(--ink);
          font-size: 9px; line-height: 1.3;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .cg-page * { box-sizing: border-box; }

        .cg-header { display: grid; grid-template-columns: 46px 1fr auto; align-items: center; gap: 10px; padding: 6px 10px; background: var(--primary); color: white; margin-bottom: 5px; border-radius: 4px 4px 0 0; }
        .cg-logo { width: 46px; height: 46px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 16px; overflow: hidden; }
        .cg-logo img { width: 100%; height: 100%; object-fit: contain; }
        .cg-school h1 { font-size: 17px; font-weight: 800; letter-spacing: 1px; line-height: 1; }
        .cg-school p { font-size: 8.5px; opacity: 0.9; margin-top: 2px; }
        .cg-report-tag { text-align: right; font-size: 8.5px; line-height: 1.2; }
        .cg-report-tag .term { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }

        .cg-strip { display: grid; grid-template-columns: 54px 1fr 220px; gap: 8px; padding: 6px; background: var(--soft); border: 1px solid color-mix(in srgb, var(--primary) 15%, white); margin-bottom: 5px; border-radius: 3px; }
        .cg-photo { width: 54px; height: 66px; background: color-mix(in srgb, var(--primary) 12%, white); border-radius: 3px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; font-size: 20px; overflow: hidden; }
        .cg-photo img { width: 100%; height: 100%; object-fit: cover; }
        .cg-details { align-content: center; }
        .cg-details .name { font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 3px; }
        .cg-details .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 8px; font-size: 8.5px; }
        .cg-details .fact { display: flex; gap: 3px; }
        .cg-details .fact .k { color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 500; }
        .cg-details .fact .v { color: var(--ink); font-weight: 600; }

        .cg-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; align-content: center; }
        .cg-summary-cell { text-align: center; padding: 3px 2px; background: white; border: 1px solid color-mix(in srgb, var(--primary) 15%, white); border-radius: 2px; }
        .cg-summary-cell.hi { background: var(--primary); color: white; border-color: var(--primary); }
        .cg-summary-cell .num { font-size: 12px; font-weight: 700; line-height: 1; }
        .cg-summary-cell .lbl { font-size: 7px; letter-spacing: 0.3px; text-transform: uppercase; margin-top: 1px; opacity: 0.85; }

        .cg-section-hd { display: flex; align-items: center; gap: 6px; margin: 5px 0 3px; }
        .cg-section-hd h3 { font-size: 8.5px; font-weight: 700; color: var(--primary); letter-spacing: 1.5px; text-transform: uppercase; }
        .cg-section-hd .line { flex: 1; height: 1px; background: var(--primary); opacity: 0.4; }

        .cg-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .cg-table thead th { background: var(--primary); color: white; padding: 3px; text-align: center; font-weight: 600; font-size: 8px; letter-spacing: 0.3px; line-height: 1.1; }
        .cg-table thead th:first-child { text-align: left; padding-left: 6px; }
        .cg-table tbody td { padding: 2.5px 3px; text-align: center; border-bottom: 1px solid color-mix(in srgb, var(--primary) 8%, white); }
        .cg-table tbody td:first-child { text-align: left; padding-left: 6px; font-weight: 500; }
        .cg-table tbody tr:nth-child(even) { background: color-mix(in srgb, var(--primary) 3%, white); }
        .cg-grade { font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 1px 4px; border-radius: 2px; }
        .cg-table tfoot td { background: var(--soft); padding: 4px 3px; font-weight: 700; border-top: 1.5px solid var(--primary); font-size: 9.5px; }

        .cg-mid3 { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 5px; margin-top: 4px; }
        .cg-mini-panel { border: 1px solid color-mix(in srgb, var(--primary) 15%, white); padding: 4px 6px; background: var(--soft); border-radius: 3px; }
        .cg-mini-title { font-size: 8px; font-weight: 700; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; padding-bottom: 2px; border-bottom: 1px solid color-mix(in srgb, var(--primary) 15%, white); }
        .cg-cum-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
        .cg-cum-cell { text-align: center; padding: 2px; background: white; border-radius: 2px; }
        .cg-cum-cell.current { background: var(--primary); color: white; }
        .cg-cum-cell .lbl { font-size: 6.5px; opacity: 0.7; }
        .cg-cum-cell .val { font-size: 10px; font-weight: 700; line-height: 1; }
        .cg-att-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
        .cg-att-cell { text-align: center; padding: 2px; background: white; }
        .cg-att-cell .num { font-size: 11px; font-weight: 700; color: var(--primary); }
        .cg-att-cell .lbl { font-size: 6.5px; color: color-mix(in srgb, var(--ink) 55%, white); letter-spacing: 0.3px; text-transform: uppercase; }
        .cg-scale-mini { display: flex; flex-wrap: wrap; gap: 2px; }
        .cg-scale-mini-item { padding: 1px 4px; background: white; border: 1px solid color-mix(in srgb, var(--primary) 15%, white); border-radius: 2px; font-size: 7.5px; }
        .cg-scale-mini-item strong { color: var(--primary); font-family: 'JetBrains Mono', monospace; }

        .cg-behavior { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cg-behavior h4 { font-size: 8px; color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 700; margin-bottom: 2px; letter-spacing: 0.3px; text-transform: uppercase; }
        .cg-trait { display: flex; justify-content: space-between; align-items: center; padding: 1px 0; font-size: 9px; border-bottom: 1px dotted color-mix(in srgb, var(--primary) 10%, white); }
        .cg-stars { color: #f59e0b; font-size: 10px; letter-spacing: 0.5px; line-height: 1; font-family: sans-serif; }

        .cg-comments { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
        .cg-comment { padding: 5px 7px; background: var(--soft); border-left: 2px solid var(--primary); font-size: 9.5px; position: relative; border-radius: 0 3px 3px 0; }
        .cg-comment .label { font-size: 7.5px; color: color-mix(in srgb, var(--ink) 55%, white); font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 2px; }
        .cg-comment .text { color: var(--ink); font-style: italic; line-height: 1.3; margin-bottom: 3px; }
        .cg-comment .sig { font-size: 8px; color: color-mix(in srgb, var(--ink) 55%, white); text-align: right; }
        .cg-comment .sig strong { color: var(--primary); }
        .cg-sig-img { max-height: 20px; max-width: 60px; }
        .cg-stamp { position: absolute; right: 4px; bottom: 4px; width: 44px; height: 44px; opacity: 0.5; }
        .cg-stamp img { width: 100%; height: 100%; object-fit: contain; }

        .cg-footer { margin-top: auto; padding-top: 5px; border-top: 1.5px solid var(--primary); text-align: center; font-size: 8.5px; color: color-mix(in srgb, var(--ink) 55%, white); }
        .cg-footer .next { font-weight: 700; color: var(--primary); }
        .cg-footer .brand { font-size: 7px; color: color-mix(in srgb, var(--ink) 30%, white); margin-top: 2px; }

        @media print {
          body { background: white !important; }
          .cg-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

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
              <div className="lbl" style={{color: 'color-mix(in srgb, var(--ink) 55%, white)'}}>Position</div>
            </div>
          )}
          <div className="cg-summary-cell">
            <div className="num" style={{color: 'var(--primary)'}}>{summary.total_marks}</div>
            <div className="lbl" style={{color: 'color-mix(in srgb, var(--ink) 55%, white)'}}>Total</div>
          </div>
        </div>
      </div>

      <div className="cg-section-hd"><h3>Academic Performance</h3><div className="line"></div></div>
      <table className="cg-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Subject</th>
            {breakdownCols.map((b, i) => (
              <th key={i}>{b.name}<br /><span style={{ fontWeight: 400, fontSize: '7px' }}>{b.max}</span></th>
            ))}
            <th>Tot<br /><span style={{ fontWeight: 400, fontSize: '7px' }}>100</span></th>
            <th>Grd</th>
            {settings?.show_subject_position !== false && <th>Pos</th>}
            {settings?.show_class_avg !== false && <th>Avg</th>}
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
                <td><span className="cg-grade" style={{ background: gc.bg, color: gc.fg }}>{s.grade || '—'}</span></td>
                {settings?.show_subject_position !== false && <td>{s.position_in_subject ? ordinal(s.position_in_subject) : '—'}</td>}
                {settings?.show_class_avg !== false && <td>{s.class_avg != null ? s.class_avg.toFixed(1) : '—'}</td>}
                <td>{s.remark || '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: 'left' }}>TOTAL ({scores.length})</td>
            <td colSpan={breakdownCols.length} style={{ textAlign: 'center', color: 'color-mix(in srgb, var(--ink) 55%, white)' }}>{summary.total_marks}/{scores.length * 100}</td>
            <td><strong>{summary.average?.toFixed(1)}</strong></td>
            <td>{(() => { const gc = gradeChip(summary.overall_grade); return <span className="cg-grade" style={{ background: gc.bg, color: gc.fg }}>{summary.overall_grade || '—'}</span>; })()}</td>
            <td colSpan={(settings?.show_subject_position !== false ? 1 : 0) + (settings?.show_class_avg !== false ? 1 : 0) + 1} style={{ textAlign: 'left', paddingLeft: 6 }}>{summary.overall_remark || 'Term Average'}</td>
          </tr>
        </tfoot>
      </table>

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

      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (behavior?.affective?.length > 0 || behavior?.psychomotor?.length > 0) && (
        <>
          <div className="cg-section-hd"><h3>Behavior & Skills</h3><div className="line"></div></div>
          <div className="cg-behavior">
            {settings?.show_affective !== false && behavior?.affective?.length > 0 && (
              <div>
                <h4>Affective (Character)</h4>
                {behavior.affective.slice(0, 6).map((t, i) => (
                  <div key={i} className="cg-trait"><span>{t.name}</span><span className="cg-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
            {settings?.show_psychomotor !== false && behavior?.psychomotor?.length > 0 && (
              <div>
                <h4>Psychomotor (Skills)</h4>
                {behavior.psychomotor.slice(0, 6).map((t, i) => (
                  <div key={i} className="cg-trait"><span>{t.name}</span><span className="cg-stars">{stars(t.rating)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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

      <div className="cg-footer">
        {term.next_term_begins && <div className="next">Next Term: {new Date(term.next_term_begins).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>}
        <div className="brand">SchoolFlow · schoolflow.ng</div>
      </div>
    </div>
  );
}
