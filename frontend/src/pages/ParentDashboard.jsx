import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  CheckCircle2,
  X,
  BarChart3,
  BookOpen,
  ClipboardList,
  Brain,
  Megaphone,
  Calendar,
  Paperclip,
  Inbox,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateNotifications } = useNotifications();
  const [tab, setTab] = useState('home');

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submissionData, setSubmissionData] = useState({});

  // Quiz states
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [quizResults, setQuizResults] = useState({});
  const [viewingQuizResult, setViewingQuizResult] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'parent') {
      navigate('/login');
      return;
    }
    fetch(`${API_URL}parent/students/`, {
      headers: { Authorization: `Bearer ${user.access_token}` }
    })
      .then(r => r.json())
      .then(data => {
        setChildren(data);
        if (data.length > 0) setSelectedChildId(data[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (selectedChildId) fetchContent();
  }, [selectedChildId, tab]);

  const fetchContent = async () => {
    if (!selectedChildId) return;
    const headers = { Authorization: `Bearer ${user.access_token}` };
    const param = `?student_id=${selectedChildId}`;

    const [matRes, assRes, annRes, quizRes] = await Promise.all([
      fetch(`${API_URL}materials/${param}`, { headers }),
      fetch(`${API_URL}assignments/${param}`, { headers }),
      fetch(`${API_URL}announcements/${param}`, { headers }),
      fetch(`${API_URL}parent/quizzes/${selectedChildId}/`, { headers }),
    ]);

    if (matRes.ok) setMaterials(await matRes.json());

    if (assRes.ok) {
      const assData = await assRes.json();
      setAssignments(assData);
      updateNotifications('parent', assData, 'assignments');

      assData.forEach(async (ass) => {
        const subRes = await fetch(`${API_URL}submissions/student/${selectedChildId}/${ass.id}/`, { headers });
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData?.id) {
            setSubmissionData(prev => ({ ...prev, [ass.id]: subData }));
          }
        }
      });
    }

    if (annRes.ok) {
      const annData = await annRes.json();
      setAnnouncements(annData);
      updateNotifications('parent', annData, 'announcements');
    }

    if (quizRes.ok) {
      const quizData = await quizRes.json();
      setAvailableQuizzes(quizData);

      quizData.forEach(quiz => {
        fetchQuizResult(quiz.id);
      });
    }
  };

  const fetchQuizResult = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}parent/quiz-result/${selectedChildId}/${quizId}/`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizResults(prev => ({ ...prev, [quizId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch quiz result:', err);
    }
  };

  const filteredChildren = children.filter(child => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return child.display_name.toLowerCase().includes(term) ||
           child.student_number.toLowerCase().includes(term);
  });

  // Grade status colors — forest (good) / brass (pending) / oxbrick (poor)
  const getGradeColor = (percentage) => {
    if (percentage >= 70) return 'text-forest-600 dark:text-forest-500';
    if (percentage >= 40) return 'text-brass-600 dark:text-brass-400';
    return 'text-oxbrick-600 dark:text-oxbrick-500';
  };

  const getGradeBg = (percentage) => {
    if (percentage >= 70) return 'bg-forest-50 dark:bg-forest-700/20';
    if (percentage >= 40) return 'bg-brass-50 dark:bg-brass-700/20';
    return 'bg-oxbrick-50 dark:bg-oxbrick-700/20';
  };

  // Home tab data
  const totalMaterials = materials.length;
  const totalAssignments = assignments.length;
  const submittedCount = Object.values(submissionData).filter(d => d && d.id).length;
  const gradedCount = Object.values(submissionData).filter(d => d && d.grade).length;
  const totalQuizzes = availableQuizzes.length;
  const completedQuizzes = Object.values(quizResults).filter(r => r && r.submitted).length;
  const upcomingDeadlines = assignments
    .filter(a => a.deadline && new Date(a.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 2);

  const navLinks = [
    { label: 'Home', onClick: () => setTab('home') },
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Quizzes', onClick: () => setTab('quizzes') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
  ];

  const SectionIcon = ({ Icon }) => (
    <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center text-brass-400 flex-shrink-0">
      <Icon className="w-5 h-5" strokeWidth={1.75} />
    </div>
  );

  const EmptyState = ({ label }) => (
    <div className="text-center py-20 bg-white dark:bg-navy-800 rounded-3xl border border-dashed border-ink-300 dark:border-navy-600">
      <Inbox className="w-10 h-10 text-ink-300 dark:text-ink-500 mx-auto" strokeWidth={1.5} />
      <p className="text-ink-400 dark:text-ink-500 mt-4 text-base font-medium">{label}</p>
    </div>
  );

  return (
    <Layout role="parent" navLinks={navLinks}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-3">
            <Users className="w-9 h-9 text-brass-500" strokeWidth={1.75} /> Parent Dashboard
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2 text-lg">Monitor your child's learning progress.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
            </div>
            <input type="text" placeholder="Search child..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-800 shadow-soft text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500" />
          </div>
          <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-800 shadow-soft font-medium text-navy-800 dark:text-white">
            {filteredChildren.map(child => (
              <option key={child.id} value={child.id}>{child.display_name} ({child.student_number})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== QUIZ RESULT MODAL ===== */}
      {viewingQuizResult && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-brass-500" strokeWidth={1.75} /> {viewingQuizResult.quiz_title}
              </h2>
              <button onClick={() => setViewingQuizResult(null)} className="text-ink-400 hover:text-navy-700 dark:hover:text-white p-1.5 rounded transition-colors">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-500 dark:text-ink-300">Score</span>
                <span className="text-2xl font-display font-semibold text-navy-800 dark:text-white">{viewingQuizResult.total_points} / {viewingQuizResult.total_possible}</span>
              </div>
              <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${(viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100 >= 70 ? 'bg-forest-600' : (viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100 >= 40 ? 'bg-brass-500' : 'bg-oxbrick-600'}`}
                  style={{ width: `${viewingQuizResult.total_possible > 0 ? Math.round((viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100) : 0}%` }} />
              </div>
              <p className="text-sm text-ink-400 dark:text-ink-500 mt-1 text-right">{viewingQuizResult.total_possible > 0 ? Math.round((viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100) : 0}%</p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-navy-800 dark:text-ink-100">Question Breakdown</h3>
              {viewingQuizResult.answers?.map((ans, idx) => (
                <div key={idx} className="border border-ink-200 dark:border-navy-600 rounded-xl p-4">
                  <p className="font-medium text-navy-800 dark:text-ink-100 text-sm mb-2">Q{idx + 1}: {ans.question_text}</p>
                  {ans.points !== null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-forest-600 dark:text-forest-500">Points: {ans.points}</span>
                      {ans.feedback && <span className="text-xs text-ink-500 dark:text-ink-300">Feedback: {ans.feedback}</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-brass-600 dark:text-brass-400">Not yet graded</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== HOME TAB ===== */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-navy-200">Materials</p><BookOpen className="w-5 h-5 text-brass-400" strokeWidth={1.75} /></div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{totalMaterials}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-navy-200">Assignments</p><ClipboardList className="w-5 h-5 text-brass-400" strokeWidth={1.75} /></div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{submittedCount}/{totalAssignments}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-navy-200">Graded</p><CheckCircle2 className="w-5 h-5 text-brass-400" strokeWidth={1.75} /></div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{gradedCount}/{submittedCount}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-navy-200">Quizzes Done</p><Brain className="w-5 h-5 text-brass-400" strokeWidth={1.75} /></div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{completedQuizzes}/{totalQuizzes}</p>
            </div>
          </div>

          {/* Assignment Progress */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Assignment Progress
            </h3>
            {assignments.length === 0 ? <p className="text-ink-400 dark:text-ink-500 text-sm">No assignments yet.</p> : (
              <div className="space-y-3">
                {assignments.map(ass => {
                  const sub = submissionData[ass.id];
                  return (
                    <div key={ass.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        {sub?.id
                          ? <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-500 flex-shrink-0" strokeWidth={1.75} />
                          : <ClipboardList className="w-5 h-5 text-ink-400 flex-shrink-0" strokeWidth={1.75} />}
                        <div>
                          <p className="font-medium text-navy-800 dark:text-ink-100">{ass.title}</p>
                          {sub?.grade && <p className="text-xs text-forest-600 dark:text-forest-500 font-semibold">Grade: {sub.grade}</p>}
                          {sub?.id && !sub?.grade && <p className="text-xs text-brass-600 dark:text-brass-400">Submitted — Awaiting grading</p>}
                        </div>
                      </div>
                      <span className={sub?.grade ? 'text-forest-600 dark:text-forest-500 text-sm font-semibold' : sub?.id ? 'text-brass-600 dark:text-brass-400 text-sm' : 'text-oxbrick-600 dark:text-oxbrick-500 text-sm'}>
                        {sub?.grade ? 'Graded' : sub?.id ? 'Pending' : 'Not submitted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiz Progress */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Quiz Progress
            </h3>
            {availableQuizzes.length === 0 ? <p className="text-ink-400 dark:text-ink-500 text-sm">No quizzes available.</p> : (
              <div className="space-y-3">
                {availableQuizzes.map(quiz => {
                  const result = quizResults[quiz.id];
                  const percentage = result && result.total_possible > 0 ? Math.round((result.total_points / result.total_possible) * 100) : 0;
                  return (
                    <div key={quiz.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        {result?.submitted
                          ? <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-500 flex-shrink-0" strokeWidth={1.75} />
                          : <ClipboardList className="w-5 h-5 text-ink-400 flex-shrink-0" strokeWidth={1.75} />}
                        <div>
                          <p className="font-medium text-navy-800 dark:text-ink-100">{quiz.title}</p>
                          {result?.submitted && result.graded_count > 0 && (
                            <p className={`text-xs font-semibold ${getGradeColor(percentage)}`}>Score: {result.total_points}/{result.total_possible} ({percentage}%)</p>
                          )}
                          {result?.submitted && result.graded_count === 0 && (
                            <p className="text-xs text-brass-600 dark:text-brass-400">Submitted — Awaiting grading</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result?.submitted && result.graded_count > 0 && (
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeBg(percentage)} ${getGradeColor(percentage)}`}>{percentage}%</div>
                        )}
                        {result?.submitted && (
                          <button onClick={() => setViewingQuizResult(result)} className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">View</button>
                        )}
                        {!result?.submitted && <span className="text-oxbrick-600 dark:text-oxbrick-500 text-sm">Not taken</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Upcoming Deadlines
              </h3>
              {upcomingDeadlines.length === 0 ? <p className="text-ink-400 dark:text-ink-500 text-sm">No upcoming deadlines.</p> : (
                <ul className="space-y-3">{upcomingDeadlines.map(a => (<li key={a.id} className="flex items-center justify-between"><span className="font-medium text-navy-800 dark:text-ink-100">{a.title}</span><span className="text-sm text-oxbrick-600 dark:text-oxbrick-500">{new Date(a.deadline).toLocaleDateString()}</span></li>))}</ul>
              )}
            </div>
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Recent Announcements
              </h3>
              {recentAnnouncements.length === 0 ? <p className="text-ink-400 dark:text-ink-500 text-sm">No announcements yet.</p> : (
                <ul className="space-y-3">{recentAnnouncements.map(a => (<li key={a.id}><p className="font-medium text-navy-800 dark:text-ink-100">{a.title}</p><p className="text-sm text-ink-500 dark:text-ink-300">{a.content.slice(0, 80)}...</p></li>))}</ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><SectionIcon Icon={BookOpen} /><h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Learning Materials</h2></div>
          {materials.length === 0 ? <EmptyState label="No materials available." /> : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{materials.map(m => (
              <div key={m.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-5 hover:shadow-elevated transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-navy-800 dark:text-ink-100 truncate">{m.title}</h3><BookOpen className="w-5 h-5 text-brass-500 flex-shrink-0" strokeWidth={1.75} /></div>
                {m.description && <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">{m.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-ink-100 dark:bg-navy-700 px-2 py-1 rounded-full text-ink-600 dark:text-ink-300 font-medium">{m.type}</span>
                  {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">Open</a>}
                </div>
              </div>
            ))}</div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><SectionIcon Icon={ClipboardList} /><h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Assignments</h2></div>
          {assignments.length === 0 ? <EmptyState label="No assignments for this student yet." /> : (
            <div className="space-y-4">{assignments.map(a => { const sub = submissionData[a.id]; return (
              <div key={a.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-semibold text-xl text-navy-800 dark:text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> {a.title}</h3>
                  {sub?.grade && <span className="bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500 px-3 py-1 rounded-full text-xs font-semibold">Graded: {sub.grade}</span>}
                  {sub?.id && !sub?.grade && <span className="bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-3 py-1 rounded-full text-xs font-semibold">Submitted</span>}
                </div>
                {a.description && <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">{a.description}</p>}
                {a.deadline && <p className="text-xs font-semibold text-oxbrick-600 dark:text-oxbrick-500 mb-3 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" strokeWidth={1.75} /> Due: {new Date(a.deadline).toLocaleString()}</p>}
                {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline inline-flex items-center gap-1 mb-3"><Paperclip className="w-3.5 h-3.5" strokeWidth={1.75} /> Download Assignment File</a>}
                {sub?.grade && (
                  <div className="bg-forest-50 dark:bg-forest-700/20 border border-forest-500/20 rounded-xl p-4 mt-3">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-ink-600 dark:text-ink-300">Grade:</span><span className="text-xl font-display font-semibold text-forest-600 dark:text-forest-500">{sub.grade}</span></div>
                    {sub.feedback && <div><span className="text-sm font-semibold text-ink-600 dark:text-ink-300">Feedback:</span><p className="text-sm text-ink-500 dark:text-ink-300 mt-1 bg-white dark:bg-navy-800 p-3 rounded-lg">{sub.feedback}</p></div>}
                  </div>
                )}
                {sub?.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm hover:underline mt-2 inline-flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" strokeWidth={1.75} /> View Submission</a>}
              </div>
            );})}</div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {tab === 'quizzes' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><SectionIcon Icon={Brain} /><h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Quizzes</h2></div>
          {availableQuizzes.length === 0 ? <EmptyState label="No quizzes available." /> : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{availableQuizzes.map(quiz => { const result = quizResults[quiz.id]; const percentage = result && result.total_possible > 0 ? Math.round((result.total_points / result.total_possible) * 100) : 0; return (
              <div key={quiz.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                <h3 className="font-semibold text-xl text-navy-800 dark:text-white mb-2">{quiz.title}</h3>
                {result?.submitted ? (
                  <div>
                    <div className="flex items-center gap-2 text-forest-600 dark:text-forest-500 mb-3"><CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /><span className="font-semibold text-sm">Completed</span></div>
                    {result.graded_count > 0 ? (
                      <div className="bg-ink-50 dark:bg-navy-700 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between"><span className="text-sm text-ink-500 dark:text-ink-300">Score:</span><span className={`font-semibold ${getGradeColor(percentage)}`}>{result.total_points}/{result.total_possible}</span></div>
                        <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2"><div className={`h-2 rounded-full ${percentage >= 70 ? 'bg-forest-600' : percentage >= 40 ? 'bg-brass-500' : 'bg-oxbrick-600'}`} style={{ width: `${percentage}%` }} /></div>
                        <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-300"><span>{percentage}%</span><span>{result.graded_count}/{result.total_questions} graded</span></div>
                        <button onClick={() => setViewingQuizResult(result)} className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors mt-2">View Details</button>
                      </div>
                    ) : <p className="text-sm text-brass-600 dark:text-brass-400">Awaiting grading</p>}
                  </div>
                ) : <p className="text-sm text-oxbrick-600 dark:text-oxbrick-500">Not yet taken</p>}
              </div>
            );})}</div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><SectionIcon Icon={Megaphone} /><h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Announcements</h2></div>
          {announcements.length === 0 ? <EmptyState label="No announcements for this class." /> : (
            <div className="space-y-4">{announcements.map(a => (
              <div key={a.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                <h3 className="font-semibold text-xl text-navy-800 dark:text-white">{a.title}</h3>
                <p className="text-sm text-ink-600 dark:text-ink-300 mt-2">{a.content}</p>
                <p className="text-xs text-ink-400 dark:text-ink-500 mt-3">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            ))}</div>
          )}
        </div>
      )}
    </Layout>
  );
}