import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateNotifications } = useNotifications();
  const [tab, setTab] = useState('home');

  // Original states
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  // Quiz feature states
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [responses, setResponses] = useState({});

  // Quiz results state
  const [myQuizResults, setMyQuizResults] = useState({});
  const [viewingResult, setViewingResult] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${user.access_token}` };
    
    const [matRes, assRes, annRes, quizRes, subRes] = await Promise.all([
      fetch(`${API_URL}materials/`, { headers }),
      fetch(`${API_URL}assignments/`, { headers }),
      fetch(`${API_URL}announcements/`, { headers }),
      fetch(`${API_URL}quizzes/available`, { headers }),
      fetch(`${API_URL}quizzes/submissions`, { headers }),
    ]);
    
    if (matRes.ok) setMaterials(await matRes.json());
    
    if (assRes.ok) {
      const assData = await assRes.json();
      setAssignments(assData);
      updateNotifications('student', assData, 'assignments');

      assData.forEach(async (ass) => {
        const subRes = await fetch(`${API_URL}submissions/mine/${ass.id}/`, { headers });
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissionStatus(prev => ({ ...prev, [ass.id]: subData?.id ? 'submitted' : null }));
        }
      });
    }
    
    if (annRes.ok) {
      const annData = await annRes.json();
      setAnnouncements(annData);
      updateNotifications('student', annData, 'announcements');
    }
    
    if (quizRes.ok) setAvailableQuizzes(await quizRes.json());
    
    if (subRes.ok) {
      const submissions = await subRes.json();
      setQuizSubmissions(submissions);
      // Auto-fetch results for all submitted quizzes
      submissions.forEach(sub => {
        if (sub.submitted) {
          fetchMyQuizResult(sub.quiz_id);
        }
      });
    }
  };

  // Fetch individual quiz result
  const fetchMyQuizResult = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/my-result`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyQuizResults(prev => ({ ...prev, [quizId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch quiz result:', err);
    }
  };

  const startQuiz = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/take`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQuiz(data.quiz);
        setQuizQuestions(data.questions);
        setResponses({});
      } else {
        showMsg('Failed to load quiz', 'error');
      }
    } catch (err) {
      showMsg('Failed to load quiz', 'error');
    }
  };

  const handleAnswerChange = (questionId, value, type) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: type === 'option' ? { selected_option_id: value } : { text_answer: value },
    }));
  };

  const submitQuiz = async () => {
    const answers = quizQuestions.map(q => ({
      question_id: q.id,
      selected_option_id: responses[q.id]?.selected_option_id || null,
      text_answer: responses[q.id]?.text_answer || null,
    }));

    try {
      const res = await fetch(`${API_URL}quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        showMsg('Quiz submitted successfully!');
        setActiveQuiz(null);
        fetchData(); // Re-fetch all data to update submissions
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg(err.detail || 'Submission failed', 'error');
      }
    } catch (err) {
      showMsg('Submission failed', 'error');
    }
  };

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSubmit = async (assignmentId) => {
    const file = submissionFiles[assignmentId];
    if (!file) { showMsg('Please choose a file', 'error'); return; }
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}submissions/${assignmentId}/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.access_token}` },
      body: formData,
    });
    if (res.ok) {
      showMsg('Submitted successfully!');
      setSubmissionStatus(prev => ({ ...prev, [assignmentId]: 'submitted' }));
    } else {
      const err = await res.json();
      showMsg(err.detail || 'Submission failed', 'error');
    }
  };

  // Check if a quiz is submitted
  const isQuizSubmitted = (quizId) => {
    return quizSubmissions.some(s => s.quiz_id === quizId && s.submitted);
  };

  // Grade color helpers
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
  const totalAssignments = assignments.length;
  const submittedAssignments = Object.values(submissionStatus).filter(s => s === 'submitted').length;
  const totalQuizzes = availableQuizzes.length;
  const submittedQuizzes = quizSubmissions.filter(s => s.submitted).length;
  const pendingQuizzes = totalQuizzes - submittedQuizzes;
  const upcomingDeadlines = assignments
    .filter(a => a.deadline && new Date(a.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 2);

  const navLinks = [
    { label: 'Home', onClick: () => setTab('home') },
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
    { label: 'Quizzes', onClick: () => setTab('quizzes') },
  ];

  return (
    <Layout role="student" navLinks={navLinks}>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-4xl">🎓</span>
          Welcome, {user?.display_name || 'Student'}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Your learning dashboard at a glance.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
          msgType === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        }`}>
          {msgType === 'error' ? '⚠️' : '✅'} {msg}
        </div>
      )}

      {/* ===== QUIZ RESULT DETAIL MODAL ===== */}
      {viewingResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📊 {viewingResult.quiz_title}
              </h2>
              <button
                onClick={() => setViewingResult(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Your Score</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {viewingResult.total_points} / {viewingResult.total_possible}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    viewingResult.total_possible > 0
                      ? (viewingResult.total_points / viewingResult.total_possible) * 100 >= 70
                        ? 'bg-green-500'
                        : (viewingResult.total_points / viewingResult.total_possible) * 100 >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                  style={{ width: `${viewingResult.total_possible > 0 ? Math.round((viewingResult.total_points / viewingResult.total_possible) * 100) : 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-right">
                {viewingResult.total_possible > 0 ? Math.round((viewingResult.total_points / viewingResult.total_possible) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {viewingResult.graded_count} of {viewingResult.total_questions} questions graded
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Question Breakdown</h3>
              {viewingResult.answers.map((ans, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-2">
                    Q{idx + 1}: {ans.question_text}
                  </p>
                  {ans.question_type === 'multiple_choice' ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Selected option ID: {ans.selected_option_id || 'N/A'}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                      Answer: {ans.text_answer || 'No answer provided'}
                    </p>
                  )}
                  {ans.points !== null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Points: {ans.points}
                      </span>
                      {ans.feedback && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Feedback: {ans.feedback}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Not yet graded
                    </span>
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
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">Materials</p>
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-3xl md:text-4xl font-black">{materials.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">Assignments</p>
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-3xl md:text-4xl font-black">{submittedAssignments}/{totalAssignments}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">Quizzes Done</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl md:text-4xl font-black">{submittedQuizzes}/{totalQuizzes}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">Pending Quiz</p>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-3xl md:text-4xl font-black">{pendingQuizzes}</p>
            </div>
          </div>

          {/* Quiz Progress Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🧠</span> Quiz Progress
            </h3>
            
            {availableQuizzes.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No quizzes available yet.</p>
            ) : (
              <div className="space-y-3">
                {availableQuizzes.map(quiz => {
                  const submitted = isQuizSubmitted(quiz.id);
                  const result = myQuizResults[quiz.id];
                  const percentage = result && result.total_possible > 0 
                    ? Math.round((result.total_points / result.total_possible) * 100) 
                    : 0;
                  
                  return (
                    <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{submitted ? '✅' : '📝'}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{quiz.title}</p>
                          {quiz.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.description}</p>
                          )}
                          {submitted && result && (
                            <p className="text-xs mt-1">
                              {result.graded_count > 0 ? (
                                <span className={`font-semibold ${getGradeColor(percentage)}`}>
                                  Score: {result.total_points}/{result.total_possible} ({percentage}%)
                                  {result.graded_count < result.total_questions && ' - Partial'}
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">Submitted - Awaiting grading</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {submitted ? (
                          <>
                            {result && result.graded_count > 0 && (
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeBg(percentage)} ${getGradeColor(percentage)}`}>
                                {percentage}%
                              </div>
                            )}
                            <button
                              onClick={() => {
                                if (result) {
                                  setViewingResult(result);
                                } else {
                                  fetchMyQuizResult(quiz.id);
                                }
                              }}
                              className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline"
                            >
                              {result ? 'View Result' : 'Load Result'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startQuiz(quiz.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                          >
                            Take Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📅</span> Upcoming Deadlines
              </h3>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No upcoming deadlines.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingDeadlines.map(a => (
                    <li key={a.id} className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{a.title}</span>
                      <span className="text-sm text-red-500 dark:text-red-400">{new Date(a.deadline).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Announcements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📢</span> Recent Announcements
              </h3>
              {recentAnnouncements.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No announcements yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentAnnouncements.map(a => (
                    <li key={a.id}>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{a.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{a.content.slice(0, 80)}...</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Materials</h2>
          </div>
          {materials.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-6xl">📭</span>
              <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No materials available yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate">{m.title}</h3>
                    <span className="text-3xl">{m.icon || '📚'}</span>
                  </div>
                  {m.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{m.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 font-medium">{m.type}</span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">
                        Open
                      </a>
                    )}
                  </div>
                  {m.audio_url && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">🎤 Voice instruction</p>
                      <audio controls src={m.audio_url} className="w-full rounded-lg" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-6xl">📋</span>
              <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((ass) => (
                <div key={ass.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <span className="text-3xl">{ass.icon || '📝'}</span> {ass.title}
                    </h3>
                    {submissionStatus[ass.id] === 'submitted' && (
                      <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Submitted
                      </span>
                    )}
                  </div>
                  {ass.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{ass.description}</p>}
                  {ass.deadline && (
                    <p className="text-xs font-semibold text-red-500 mb-3 flex items-center gap-1">
                      <span>📅</span> Due: {new Date(ass.deadline).toLocaleString()}
                    </p>
                  )}
                  {ass.file_url && (
                    <a href={ass.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline block mb-3">
                      📎 Download Assignment File
                    </a>
                  )}
                  {ass.audio_url && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">🎤 Voice instruction</p>
                      <audio controls src={ass.audio_url} className="w-full rounded-lg" />
                    </div>
                  )}
                  {submissionStatus[ass.id] !== 'submitted' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="file"
                          onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [ass.id]: e.target.files[0] }))}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition cursor-pointer"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmit(ass.id)}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 text-sm"
                      >
                        Upload Submission
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg">📢</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-6xl">📢</span>
              <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">{a.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{a.content}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== QUIZZES TAB ===== */}
      {tab === 'quizzes' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">🧠</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes</h2>
          </div>

          {!activeQuiz ? (
            <>
              {availableQuizzes.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
                  <span className="text-6xl">📭</span>
                  <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No quizzes available yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {availableQuizzes.map(quiz => {
                    const submitted = isQuizSubmitted(quiz.id);
                    const result = myQuizResults[quiz.id];
                    const percentage = result && result.total_possible > 0 
                      ? Math.round((result.total_points / result.total_possible) * 100) 
                      : 0;
                    
                    return (
                      <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{quiz.description}</p>
                        )}
                        
                        {submitted ? (
                          <div>
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3">
                              <span>✅</span>
                              <span className="font-semibold text-sm">Completed</span>
                            </div>
                            
                            {result ? (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                                  <span className={`font-bold ${getGradeColor(percentage)}`}>
                                    {result.total_points}/{result.total_possible}
                                  </span>
                                </div>
                                
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span>{percentage}%</span>
                                  <span>{result.graded_count}/{result.total_questions} graded</span>
                                </div>
                                
                                <button
                                  onClick={() => setViewingResult(result)}
                                  className="w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition mt-2"
                                >
                                  View Details
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => fetchMyQuizResult(quiz.id)}
                                className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline"
                              >
                                Load Result
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => startQuiz(quiz.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            Start Quiz
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeQuiz.title}</h2>
                <button onClick={() => setActiveQuiz(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium">Cancel</button>
              </div>
              {activeQuiz.description && <p className="text-gray-600 dark:text-gray-300 mb-8">{activeQuiz.description}</p>}

              <div className="space-y-8">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                    <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">{idx + 1}. {q.question_text}</p>
                    {q.question_type === 'multiple_choice' ? (
                      <div className="space-y-2">
                        {q.options.map(opt => (
                          <label key={opt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                            <input type="radio" name={`question-${q.id}`} value={opt.id}
                              checked={responses[q.id]?.selected_option_id === opt.id}
                              onChange={() => handleAnswerChange(q.id, opt.id, 'option')}
                              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                            <span className="text-gray-700 dark:text-gray-200 text-sm">{opt.option_text}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea value={responses[q.id]?.text_answer || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')}
                        placeholder="Type your answer..." rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                    )}
                  </div>
                ))}

                <button onClick={submitQuiz}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                  Submit Answers
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
      `}</style>
    </Layout>
  );
}