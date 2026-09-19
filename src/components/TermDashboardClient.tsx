'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, ClipboardList, Heart, MessageSquare, FileText,
  TrendingUp, TrendingDown, ChevronRight, CheckCircle2, Circle,
  BookOpen, Users, Award, X, Loader2, Lock, AlertCircle,
} from 'lucide-react';

interface Props {
  schoolId: string;
  term: any;
  sections: any[];
  classSubjects: any[];
  subjects: any[];
  scoreSessions: any[];
  enrollments: any[];
  behaviors: any[];
  settings: any;
}

// Hides the arm letter (e.g. "A") for classes that only have one section, so single-arm
// classes read as "Primary 2" instead of "Primary 2 A"; multi-arm classes still show "JSS 1 A".
function sectionDisplayName(section: any, allSections: any[]): string {
  const classLevelId = section.classes?.class_level_id;
  const className = section.classes?.class_levels?.name || section.full_name || section.name;
  const siblingCount = allSections.filter(s => s.classes?.class_level_id === classLevelId).length;
  if (siblingCount <= 1) return className;
  return section.full_name || `${className} ${section.name}`;
}

export default function TermDashboardClient({ schoolId, term, sections, classSubjects, subjects, scoreSessions, enrollments, behaviors, settings }: Props) {
  const router = useRouter();
  const [scoresDrawer, setScoresDrawer] = useState<string | null>(null);
  const [behaviorDrawer, setBehaviorDrawer] = useState<string | null>(null);
  const [commentsDrawer, setCommentsDrawer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate per-section stats
  const sectionStats = useMemo(() => {
    const sortedSections = [...sections].sort((a, b) => {
      const seqA = a.classes?.class_levels?.sequence ?? 999;
      const seqB = b.classes?.class_levels?.sequence ?? 999;
      if (seqA !== seqB) return seqA - seqB;
      return (a.name || '').localeCompare(b.name || '');
    });
    return sortedSections.map(sec => {
      const classLevelId = sec.classes?.class_level_id;
      const totalSubjects = classSubjects.filter(cs => cs.class_level_id === classLevelId).length;
      const enteredSubjects = scoreSessions.filter(ss => ss.section_id === sec.id).length;
      const finalizedSubjects = scoreSessions.filter(ss => ss.section_id === sec.id && ss.is_finalized).length;
      const students = enrollments.filter((e: any) => e.section_id === sec.id);
      const studentIds = students.map((e: any) => e.student_id);
      const behaviorDone = behaviors.filter(b => studentIds.includes(b.student_id)).length;

      return {
        section: sec,
        totalSubjects,
        enteredSubjects,
        finalizedSubjects,
        studentCount: students.length,
        behaviorDone,
        progress: totalSubjects > 0 ? Math.round((enteredSubjects / totalSubjects) * 100) : 0,
      };
    });
  }, [sections, classSubjects, scoreSessions, enrollments, behaviors]);
  // Overall stats
  const totals = useMemo(() => {
    const totalSheets = sectionStats.reduce((sum, s) => sum + s.totalSubjects, 0);
    const enteredSheets = sectionStats.reduce((sum, s) => sum + s.enteredSubjects, 0);
    const finalizedSheets = sectionStats.reduce((sum, s) => sum + s.finalizedSubjects, 0);
    return {
      totalSheets, enteredSheets, finalizedSheets,
      progress: totalSheets > 0 ? Math.round((enteredSheets / totalSheets) * 100) : 0,
    };
  }, [sectionStats]);

  // Analytics
  const analytics = useMemo(() => {
    // Flatten all scores across sessions
    const allScores: Array<{ studentId: string; total: number; grade: string; sessionId: string }> = [];
    const gradeCounts: Record<string, number> = {};
    const subjectPass: Record<string, { total: number; passed: number; sessionId: string; subjectId: string }> = {};

    scoreSessions.forEach(ss => {
      const subjectSessions = subjectPass[ss.subject_id] || { total: 0, passed: 0, sessionId: ss.id, subjectId: ss.subject_id };
      (ss.student_scores || []).forEach((score: any) => {
        if (score.is_absent) return;
        if ((score.total_score || 0) === 0) return;
        allScores.push({ studentId: score.student_id, total: score.total_score, grade: score.grade, sessionId: ss.id });
        if (score.grade) gradeCounts[score.grade] = (gradeCounts[score.grade] || 0) + 1;
        subjectSessions.total += 1;
        if (score.total_score >= 40) subjectSessions.passed += 1;
      });
      subjectPass[ss.subject_id] = subjectSessions;
    });

    // Aggregate student averages
    const studentAgg: Record<string, { total: number; count: number }> = {};
    allScores.forEach(s => {
      if (!studentAgg[s.studentId]) studentAgg[s.studentId] = { total: 0, count: 0 };
      studentAgg[s.studentId].total += s.total;
      studentAgg[s.studentId].count += 1;
    });
    const studentAvgs = Object.entries(studentAgg).map(([id, v]) => ({
      studentId: id, avg: v.count > 0 ? v.total / v.count : 0, subjectsCount: v.count,
    })).sort((a, b) => b.avg - a.avg);

    return {
      allScoreCount: allScores.length,
      gradeCounts,
      subjectPass: Object.entries(subjectPass).map(([subjId, v]: any) => {
        const subj = subjects.find(s => s.id === subjId);
        return { name: subj?.name || 'Subject', passRate: v.total > 0 ? Math.round((v.passed / v.total) * 100) : 0, count: v.total };
      }).sort((a, b) => b.passRate - a.passRate),
      topStudents: studentAvgs.slice(0, 5),
      bottomStudents: studentAvgs.slice(-5).reverse(),
    };
  }, [scoreSessions, subjects]);

  async function pickSubjectForScore(sectionId: string, subjectId: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/scores/pick', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          sessionId: term.sessions?.id,
          termId: term.id,
          sectionId,
          subjectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/grades/enter/${data.scoreSessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
      setLoading(false);
    }
  }

  const activeSubjectsFor = (sectionId: string) => {
    const sec = sections.find(s => s.id === sectionId);
    const classLevelId = sec?.classes?.class_level_id;
    const subjectIds = classSubjects.filter(cs => cs.class_level_id === classLevelId).map(cs => cs.subject_id);
    return subjects.filter(s => subjectIds.includes(s.id)).map(s => {
      const session = scoreSessions.find(ss => ss.section_id === sectionId && ss.subject_id === s.id);
      const studentCount = (session?.student_scores || []).length;
      const enteredCount = (session?.student_scores || []).filter((sc: any) => (sc.total_score || 0) > 0 || sc.is_absent).length;
      return {
        subject: s,
        session,
        studentCount,
        enteredCount,
        isFinalized: session?.is_finalized || false,
      };
    });
  };

  const studentsIn = (sectionId: string) => enrollments
    .filter((e: any) => e.section_id === sectionId && !e.students?.deleted_at)
    .map((e: any) => e.student_id);

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/grades" className="p-2 -ml-2 text-gray-400 hover:text-indigo hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{term.name}</h1>
          <p className="text-xs text-gray-500">{term.sessions?.name}</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 lg:p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-semibold text-indigo uppercase">Overall progress</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{totals.progress}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Scoresheets</div>
            <div className="text-sm font-bold text-gray-900">{totals.enteredSheets}/{totals.totalSheets}</div>
            <div className="text-[10px] text-gray-500">{totals.finalizedSheets} finalized</div>
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo to-purple-500 rounded-full transition-all" style={{ width: `${totals.progress}%` }} />
        </div>
      </div>

      {/* SECTION 1: Enter Scores */}
      <DashboardCard icon={ClipboardList} iconColor="text-indigo" iconBg="bg-indigo-50"
        title="Enter Scores" desc="Tap a class to pick a subject and score students">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sectionStats.map(st => (
            <button key={st.section.id} onClick={() => setScoresDrawer(st.section.id)}
              className="p-3 rounded-xl border-2 border-gray-200 hover:border-indigo hover:bg-indigo-50 text-left transition-all group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-sm truncate">{sectionDisplayName(st.section, sections)}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{st.studentCount} students · {st.totalSubjects} subjects</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo flex-shrink-0" />
              </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${st.progress >= 80 ? 'bg-success' : st.progress >= 40 ? 'bg-amber-500' : 'bg-gray-400'}`}
                    style={{ width: `${st.progress}%` }} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 min-w-[30px] text-right">{st.enteredSubjects}/{st.totalSubjects}</span>
              </div>
            </button>
          ))}
        </div>
      </DashboardCard>

      {/* SECTION 2: Behavior & Skills */}
      {(settings?.show_affective !== false || settings?.show_psychomotor !== false) && (
        <DashboardCard icon={Heart} iconColor="text-error" iconBg="bg-red-50"
          title="Behavior & Skills" desc="Rate affective traits and psychomotor skills per student">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sectionStats.map(st => (
              <button key={st.section.id} onClick={() => setBehaviorDrawer(st.section.id)}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-error hover:bg-red-50 text-left transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{sectionDisplayName(st.section, sections)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{st.behaviorDone}/{st.studentCount} rated</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-error flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* SECTION 3: Comments */}
      {(settings?.show_teacher_comment !== false || settings?.show_principal_comment !== false) && (
        <DashboardCard icon={MessageSquare} iconColor="text-purple-600" iconBg="bg-purple-50"
          title="Comments" desc="Teacher and principal remarks per student">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sectionStats.map(st => (
              <button key={st.section.id} onClick={() => setCommentsDrawer(st.section.id)}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 text-left transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{sectionDisplayName(st.section, sections)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{st.studentCount} students</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* SECTION 4: Report Cards */}
      <DashboardCard icon={FileText} iconColor="text-emerald-600" iconBg="bg-emerald-50"
        title="Report Cards" desc="View broadsheet, print or download reports">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">Report card generation ships in <strong>Drop 13B</strong> — right after this works.</p>
        </div>
      </DashboardCard>

      {/* SECTION 5: Analytics */}
      {analytics.allScoreCount > 0 && (
        <DashboardCard icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50"
          title="Analytics" desc="Top performers, weak students, subject pass rates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 5 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />Top performers
              </div>
              <div className="space-y-1">
                {analytics.topStudents.length === 0 ? (
                  <div className="text-xs text-gray-400 py-2">No scores yet</div>
                ) : analytics.topStudents.map((s, i) => (
                  <StudentRankRow key={s.studentId} studentId={s.studentId} enrollments={enrollments} rank={i + 1} avg={s.avg} isTop />
                ))}
              </div>
            </div>
            {/* Bottom 5 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-error" />Needs attention
              </div>
              <div className="space-y-1">
                {analytics.bottomStudents.length === 0 ? (
                  <div className="text-xs text-gray-400 py-2">No scores yet</div>
                ) : analytics.bottomStudents.map((s, i) => (
                  <StudentRankRow key={s.studentId} studentId={s.studentId} enrollments={enrollments} rank={i + 1} avg={s.avg} />
                ))}
              </div>
            </div>
          </div>

          {analytics.subjectPass.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Subject pass rates</div>
              <div className="space-y-2">
                {analytics.subjectPass.slice(0, 8).map(s => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="w-24 sm:w-32 truncate text-gray-700">{s.name}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${s.passRate >= 70 ? 'bg-success' : s.passRate >= 40 ? 'bg-amber-500' : 'bg-error'}`}
                        style={{ width: `${s.passRate}%` }} />
                    </div>
                    <div className="w-14 text-right font-bold text-gray-700">{s.passRate}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(analytics.gradeCounts).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Grade distribution</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(analytics.gradeCounts).sort().map(([grade, count]) => (
                  <div key={grade} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-xs">
                    <span className="font-bold text-indigo font-mono">{grade}</span>
                    <span className="text-gray-500 ml-1">×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCard>
      )}

      {/* Drawers */}
      {scoresDrawer && (
        <Drawer title="Pick a subject to score" onClose={() => setScoresDrawer(null)}>
          <div className="space-y-2">
            {activeSubjectsFor(scoresDrawer).length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  No subjects assigned to this class. <Link href="/dashboard/settings/grading" className="font-semibold underline">Assign subjects</Link> first.
                </div>
              </div>
            ) : activeSubjectsFor(scoresDrawer).map((entry, i) => (
              <button key={entry.subject.id} onClick={() => pickSubjectForScore(scoresDrawer, entry.subject.id)}
                disabled={loading}
                className="w-full p-3 rounded-lg border border-gray-200 hover:border-indigo hover:bg-indigo-50 text-left transition-all group flex items-center gap-3 disabled:opacity-50">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.isFinalized ? 'bg-emerald-100' : entry.enteredCount > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  {entry.isFinalized ? <Lock className="w-4 h-4 text-emerald-600" /> :
                   entry.enteredCount > 0 ? <Circle className="w-4 h-4 text-amber-600" /> :
                   <BookOpen className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{entry.subject.name}</div>
                  <div className="text-[11px] text-gray-500">
                    {entry.isFinalized ? 'Finalized' :
                     entry.enteredCount > 0 ? `${entry.enteredCount}/${entry.studentCount} entered` :
                     'Not started'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo" />
              </button>
            ))}
          </div>
        </Drawer>
      )}

      {behaviorDrawer && (
        <Drawer title="Pick a student to rate" onClose={() => setBehaviorDrawer(null)}>
          <StudentPickerList sectionId={behaviorDrawer} enrollments={enrollments}
            hrefBuilder={(sid: string) => `/dashboard/grades/behavior/${term.id}/${behaviorDrawer}/${sid}`}
            behaviors={behaviors} />
        </Drawer>
      )}

      {commentsDrawer && (
        <Drawer title="Pick a student for comments" onClose={() => setCommentsDrawer(null)}>
          <StudentPickerList sectionId={commentsDrawer} enrollments={enrollments}
            hrefBuilder={(sid: string) => `/dashboard/grades/comments/${term.id}/${commentsDrawer}/${sid}`} />
        </Drawer>
      )}
    </div>
  );
}

function DashboardCard({ icon: Icon, iconColor, iconBg, title, desc, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Drawer({ title, onClose, children }: any) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-lg z-50 bg-white lg:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

function StudentPickerList({ sectionId, enrollments, hrefBuilder, behaviors }: any) {
  const students = enrollments
    .filter((e: any) => e.section_id === sectionId && !e.students?.deleted_at);

  if (students.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-4">No students enrolled</div>;
  }

  return (
    <div className="space-y-1">
      {students.map((e: any) => {
        const s = e.students;
        const hasDone = behaviors ? behaviors.some((b: any) => b.student_id === e.student_id) : false;
        return (
          <Link key={e.student_id} href={hrefBuilder(e.student_id)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {(s?.first_name?.[0] || '') + (s?.last_name?.[0] || '')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">{s?.first_name} {s?.last_name}</div>
              <div className="text-[10px] text-gray-500 font-mono">{s?.admission_number}</div>
            </div>
            {behaviors && (
              hasDone ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Circle className="w-4 h-4 text-gray-300" />
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        );
      })}
    </div>
  );
}

function StudentRankRow({ studentId, enrollments, rank, avg, isTop }: any) {
  const e = enrollments.find((en: any) => en.student_id === studentId);
  const s = e?.students;
  if (!s) return null;
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isTop ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-error'}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">
          Student
        </div>
      </div>
      <div className={`text-xs font-bold ${isTop ? 'text-success' : 'text-error'}`}>
        {avg.toFixed(1)}
      </div>
    </div>
  );
}
