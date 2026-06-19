import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

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
      
      // Fetch submission for each assignment
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
      
      // Fetch results for each quiz
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

  const getGradeColor = (percentage) => {
    if (percentage >= 70) return 'text-green-600 dark:text-green-400';
    if (percentage >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBg = (percentage) => {
    if (percentage >= 70) return 'bg-green-100 dark:bg-green-900/30';
    if (percentage >= 40) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
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

  return (
    <Layout role="parent" navLinks={navLinks}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">👨‍👩‍👧</span> Parent Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Monitor your child's learning progress.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 5.15z" />
              </svg>
            </div>
            <input type="text" placeholder="Search child..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all duration-200 bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white" />
          </div>
          <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all duration-200 bg-white dark:bg-gray-800 shadow-sm font-semibold text-gray-900 dark:text-white">
            {filteredChildren.map(child => (
              <option key={child.id} value={child.id}>{child.display_name} ({child.student_number})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== QUIZ RESULT MODAL ===== */}
      {viewingQuizResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 {viewingQuizResult.quiz_title}</h2>
              <button onClick={() => setViewingQuizResult(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">✕</button>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Score</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{viewingQuizResult.total_points} / {viewingQuizResult.total_possible}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div className={`h-3 rounded-full ${(viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100 >= 70 ? 'bg-green-500' : (viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100 >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${viewingQuizResult.total_possible > 0 ? Math.round((viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100) : 0}%` }} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-right">{viewingQuizResult.total_possible > 0 ? Math.round((viewingQuizResult.total_points / viewingQuizResult.total_possible) * 100) : 0}%</p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Question Breakdown</h3>
              {viewingQuizResult.answers?.map((ans, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-2">Q{idx + 1}: {ans.question_text}</p>
                  {ans.points !== null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">Points: {ans.points}</span>
                      {ans.feedback && <span className="text-xs text-gray-500 dark:text-gray-400">Feedback: {ans.feedback}</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400">Not yet graded</span>
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
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold opacity-90">Materials</p><span className="text-2xl">📚</span></div>
              <p className="text-3xl md:text-4xl font-black">{totalMaterials}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold opacity-90">Assignments</p><span className="text-2xl">📝</span></div>
              <p className="text-3xl md:text-4xl font-black">{submittedCount}/{totalAssignments}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold opacity-90">Graded</p><span className="text-2xl">✅</span></div>
              <p className="text-3xl md:text-4xl font-black">{gradedCount}/{submittedCount}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold opacity-90">Quizzes Done</p><span className="text-2xl">🧠</span></div>
              <p className="text-3xl md:text-4xl font-black">{completedQuizzes}/{totalQuizzes}</p>
            </div>
          </div>

          {/* Assignment Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span>📝</span> Assignment Progress</h3>
            {assignments.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm">No assignments yet.</p> : (
              <div className="space-y-3">
                {assignments.map(ass => {
                  const sub = submissionData[ass.id];
                  return (
                    <div key={ass.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub?.id ? '✅' : '📝'}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{ass.title}</p>
                          {sub?.grade && <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Grade: {sub.grade}</p>}
                          {sub?.id && !sub?.grade && <p className="text-xs text-amber-600 dark:text-amber-400">Submitted - Awaiting grading</p>}
                        </div>
                      </div>
                      <span className={sub?.grade ? 'text-green-600 dark:text-green-400 text-sm font-semibold' : sub?.id ? 'text-amber-600 dark:text-amber-400 text-sm' : 'text-red-500 dark:text-red-400 text-sm'}>
                        {sub?.grade ? 'Graded ✅' : sub?.id ? 'Pending' : 'Not submitted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiz Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span>🧠</span> Quiz Progress</h3>
            {availableQuizzes.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm">No quizzes available.</p> : (
              <div className="space-y-3">
                {availableQuizzes.map(quiz => {
                  const result = quizResults[quiz.id];
                  const percentage = result && result.total_possible > 0 ? Math.round((result.total_points / result.total_possible) * 100) : 0;
                  return (
                    <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{result?.submitted ? '✅' : '📝'}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{quiz.title}</p>
                          {result?.submitted && result.graded_count > 0 && (
                            <p className={`text-xs font-semibold ${getGradeColor(percentage)}`}>Score: {result.total_points}/{result.total_possible} ({percentage}%)</p>
                          )}
                          {result?.submitted && result.graded_count === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Submitted - Awaiting grading</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result?.submitted && result.graded_count > 0 && (
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeBg(percentage)} ${getGradeColor(percentage)}`}>{percentage}%</div>
                        )}
                        {result?.submitted && (
                          <button onClick={() => setViewingQuizResult(result)} className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">View</button>
                        )}
                        {!result?.submitted && <span className="text-red-500 dark:text-red-400 text-sm">Not taken</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span>📅</span> Upcoming Deadlines</h3>
              {upcomingDeadlines.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm">No upcoming deadlines.</p> : (
                <ul className="space-y-3">{upcomingDeadlines.map(a => (<li key={a.id} className="flex items-center justify-between"><span className="font-medium text-gray-800 dark:text-gray-200">{a.title}</span><span className="text-sm text-red-500 dark:text-red-400">{new Date(a.deadline).toLocaleDateString()}</span></li>))}</ul>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span>📢</span> Recent Announcements</h3>
              {recentAnnouncements.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm">No announcements yet.</p> : (
                <ul className="space-y-3">{recentAnnouncements.map(a => (<li key={a.id}><p className="font-medium text-gray-800 dark:text-gray-200">{a.title}</p><p className="text-sm text-gray-500 dark:text-gray-400">{a.content.slice(0, 80)}...</p></li>))}</ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">📚</div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Materials</h2></div>
          {materials.length === 0 ? <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600"><span className="text-6xl">📭</span><p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No materials available.</p></div> : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{materials.map(m => (<div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-800 dark:text-gray-200 truncate">{m.title}</h3><span className="text-3xl">{m.icon || '📚'}</span></div>{m.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{m.description}</p>}<div className="flex items-center justify-between"><span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 font-medium">{m.type}</span>{m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">Open</a>}</div></div>))}</div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg">📝</div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2></div>
          {assignments.length === 0 ? <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600"><span className="text-6xl">📋</span><p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No assignments for this student yet.</p></div> : (
            <div className="space-y-4">{assignments.map(a => { const sub = submissionData[a.id]; return (
              <div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-3"><h3 className="font-bold text-xl flex items-center gap-2"><span className="text-3xl">{a.icon || '📝'}</span> {a.title}</h3>{sub?.grade && <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">Graded: {sub.grade}</span>}{sub?.id && !sub?.grade && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">Submitted</span>}</div>
                {a.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{a.description}</p>}
                {a.deadline && <p className="text-xs font-semibold text-red-500 mb-3 flex items-center gap-1"><span>📅</span> Due: {new Date(a.deadline).toLocaleString()}</p>}
                {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline inline-block mb-3">📎 Download Assignment File</a>}
                {sub?.grade && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mt-3">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Grade:</span><span className="text-xl font-black text-green-600 dark:text-green-400">{sub.grade}</span></div>
                    {sub.feedback && <div><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Feedback:</span><p className="text-sm text-gray-600 dark:text-gray-400 mt-1 bg-white dark:bg-gray-800 p-3 rounded-lg">{sub.feedback}</p></div>}
                  </div>
                )}
                {sub?.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm underline mt-2 inline-block">📎 View Submission</a>}
              </div>
            );})}</div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {tab === 'quizzes' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">🧠</div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes</h2></div>
          {availableQuizzes.length === 0 ? <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600"><span className="text-6xl">📭</span><p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No quizzes available.</p></div> : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{availableQuizzes.map(quiz => { const result = quizResults[quiz.id]; const percentage = result && result.total_possible > 0 ? Math.round((result.total_points / result.total_possible) * 100) : 0; return (
              <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
                {result?.submitted ? (
                  <div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3"><span>✅</span><span className="font-semibold text-sm">Completed</span></div>
                    {result.graded_count > 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-gray-400">Score:</span><span className={`font-bold ${getGradeColor(percentage)}`}>{result.total_points}/{result.total_possible}</span></div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2"><div className={`h-2 rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} /></div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"><span>{percentage}%</span><span>{result.graded_count}/{result.total_questions} graded</span></div>
                        <button onClick={() => setViewingQuizResult(result)} className="w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition mt-2">View Details</button>
                      </div>
                    ) : <p className="text-sm text-amber-600 dark:text-amber-400">Awaiting grading</p>}
                  </div>
                ) : <p className="text-sm text-red-500 dark:text-red-400">Not yet taken</p>}
              </div>
            );})}</div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg">📢</div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2></div>
          {announcements.length === 0 ? <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600"><span className="text-6xl">📢</span><p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No announcements for this class.</p></div> : (
            <div className="space-y-4">{announcements.map(a => (<div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all"><h3 className="font-bold text-xl text-gray-900 dark:text-white">{a.title}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{a.content}</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{new Date(a.created_at).toLocaleString()}</p></div>))}</div>
          )}
        </div>
      )}

      <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }`}</style>
    </Layout>
  );
}