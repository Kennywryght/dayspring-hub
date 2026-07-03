import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  X,
  BarChart3,
  BookOpen,
  ClipboardList,
  Clock3,
  Megaphone,
  Brain,
  Calendar,
  Paperclip,
  Mic,
  Inbox,
  Zap,
  Download,
  Eye,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

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

  // Assignment results state (grades & feedback)
  const [assignmentResults, setAssignmentResults] = useState({});

  // Quiz feature states
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Quiz results state
  const [myQuizResults, setMyQuizResults] = useState({});
  const [viewingResult, setViewingResult] = useState(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [exportingResults, setExportingResults] = useState(false);

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
          if (subData?.id) {
            setSubmissionStatus(prev => ({ ...prev, [ass.id]: 'submitted' }));
            setAssignmentResults(prev => ({ ...prev, [ass.id]: subData }));
          }
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
      submissions.forEach(sub => {
        if (sub.submitted) {
          fetchMyQuizResult(sub.quiz_id);
        }
      });
    }
  };

  const fetchMyQuizResult = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/my-result`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyQuizResults(prev => ({ 
          ...prev, 
          [quizId]: { 
            ...data, 
            auto_graded: data.auto_graded || false,
          } 
        }));
      }
    } catch (err) {
      console.error('Failed to fetch quiz result:', err);
    }
  };

  const startQuiz = async (quizId) => {
    setLoadingQuiz(true);
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/take`, {
        headers: { 
          Authorization: `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Handle the response structure - get quiz and questions
        const quiz = data.quiz || data;
        const questions = data.questions || [];
        
        if (!quiz || !quiz.id) {
          showMsg('Invalid quiz data received', 'error');
          setLoadingQuiz(false);
          return;
        }
        
        if (!questions || questions.length === 0) {
          showMsg('This quiz has no questions.', 'error');
          setLoadingQuiz(false);
          return;
        }
        
        // Set the active quiz and questions
        setActiveQuiz(quiz);
        setQuizQuestions(questions);
        setResponses({});
        
        // Switch to the quizzes tab to show the quiz interface
        setTab('quizzes');
        
        showMsg('Quiz loaded! Answer all questions and submit.', 'success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showMsg(errorData.detail || 'Failed to load quiz. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      showMsg('Network error. Please check your connection.', 'error');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswerChange = (questionId, value, type) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: type === 'option' ? { selected_option_id: value } : { text_answer: value },
    }));
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    
    // Check if all questions are answered
    const unansweredQuestions = quizQuestions.filter(q => {
      const response = responses[q.id];
      if (q.question_type === 'multiple_choice') {
        return !response?.selected_option_id;
      } else {
        return !response?.text_answer || response.text_answer.trim() === '';
      }
    });

    if (unansweredQuestions.length > 0) {
      showMsg(`Please answer all questions before submitting. (${unansweredQuestions.length} unanswered)`, 'error');
      return;
    }

    setSubmittingQuiz(true);

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
        // Reset quiz state
        setActiveQuiz(null);
        setQuizQuestions([]);
        setResponses({});
        // Refresh data to get updated quiz status
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg(err.detail || 'Submission failed', 'error');
      }
    } catch (err) {
      showMsg('Submission failed. Please try again.', 'error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const cancelQuiz = () => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      setActiveQuiz(null);
      setQuizQuestions([]);
      setResponses({});
      showMsg('Quiz cancelled', 'success');
    }
  };

  const downloadQuizResults = async (quizId) => {
    setExportingResults(true);
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/export-result`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_results_${quizId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showMsg('Results downloaded successfully!');
      } else {
        showMsg('Failed to download results', 'error');
      }
    } catch (err) {
      showMsg('Failed to download results', 'error');
    } finally {
      setExportingResults(false);
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
      fetchData();
    } else {
      const err = await res.json();
      showMsg(err.detail || 'Submission failed', 'error');
    }
  };

  const isQuizSubmitted = (quizId) => {
    return quizSubmissions.some(s => s.quiz_id === quizId && s.submitted);
  };

  // Grade status colors
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
  const totalAssignments = assignments.length;
  const submittedAssignments = Object.values(submissionStatus).filter(s => s === 'submitted').length;
  const gradedAssignments = Object.values(assignmentResults).filter(r => r?.grade).length;
  const totalQuizzes = availableQuizzes.length;
  const submittedQuizzes = quizSubmissions.filter(s => s.submitted).length;
  const pendingQuizzes = totalQuizzes - submittedQuizzes;
  const autoGradedQuizzes = Object.values(myQuizResults).filter(r => r.auto_graded).length;
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

  // If a quiz is active, show the quiz taking interface
  if (activeQuiz) {
    return (
      <Layout role="student" navLinks={navLinks}>
        <div className="mb-8 animate-fade-in-up">
          <button 
            onClick={cancelQuiz}
            className="inline-flex items-center gap-2 text-ink-500 dark:text-ink-300 hover:text-navy-700 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
            Back to Quizzes
          </button>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-3">
            <Brain className="w-9 h-9 text-brass-500" strokeWidth={1.75} />
            {activeQuiz.title}
          </h1>
          {activeQuiz.description && (
            <p className="text-ink-500 dark:text-ink-300 mt-2">{activeQuiz.description}</p>
          )}
          <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
            {quizQuestions.length} question{quizQuestions.length > 1 ? 's' : ''} · 
            Answer all questions to submit
          </p>
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
            msgType === 'error'
              ? 'bg-oxbrick-50 dark:bg-oxbrick-700/20 text-oxbrick-600 dark:text-oxbrick-500 border border-oxbrick-200 dark:border-oxbrick-700/40'
              : 'bg-forest-50 dark:bg-forest-700/20 text-forest-600 dark:text-forest-500 border border-forest-500/20'
          }`}>
            {msgType === 'error' ? <AlertCircle className="w-4 h-4" strokeWidth={1.75} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />}
            {msg}
          </div>
        )}

        <div className="space-y-6 animate-fade-in-up">
          {quizQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg text-navy-800 dark:text-white">
                  Question {idx + 1} of {quizQuestions.length}
                </h3>
                <span className="text-xs bg-ink-100 dark:bg-navy-700 px-3 py-1 rounded-full text-ink-600 dark:text-ink-300 font-medium">
                  {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Text Answer'}
                </span>
              </div>
              <p className="text-navy-700 dark:text-ink-200 mb-4">{q.question_text}</p>
              
              {q.question_type === 'multiple_choice' ? (
                <div className="space-y-3">
                  {q.options && q.options.map((opt) => (
                    <label 
                      key={opt.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        responses[q.id]?.selected_option_id === opt.id
                          ? 'border-brass-500 bg-brass-50 dark:bg-brass-700/20'
                          : 'border-ink-200 dark:border-navy-600 hover:border-ink-300 dark:hover:border-navy-500 hover:bg-ink-50 dark:hover:bg-navy-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={`question-${q.id}`} 
                        value={opt.id}
                        checked={responses[q.id]?.selected_option_id === opt.id}
                        onChange={() => handleAnswerChange(q.id, opt.id, 'option')}
                        className="w-4 h-4 text-brass-600 border-ink-300 focus:ring-brass-500" 
                      />
                      <span className="text-navy-700 dark:text-ink-200">{opt.option_text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea 
                  value={responses[q.id]?.text_answer || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500"
                />
              )}
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={submitQuiz}
              disabled={submittingQuiz}
              className="flex-1 bg-brass-600 hover:bg-brass-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-soft transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submittingQuiz ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />}
              {submittingQuiz ? 'Submitting...' : 'Submit Answers'}
            </button>
            <button
              onClick={cancelQuiz}
              className="flex-1 bg-ink-100 dark:bg-navy-700 hover:bg-ink-200 dark:hover:bg-navy-600 text-ink-700 dark:text-ink-300 font-semibold px-8 py-4 rounded-2xl transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Main dashboard view (when no quiz is active)
  return (
    <Layout role="student" navLinks={navLinks}>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-3">
          <GraduationCap className="w-9 h-9 text-brass-500" strokeWidth={1.75} />
          Welcome, {user?.display_name || 'Student'}
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mt-2 text-lg">Your learning dashboard at a glance.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
          msgType === 'error'
            ? 'bg-oxbrick-50 dark:bg-oxbrick-700/20 text-oxbrick-600 dark:text-oxbrick-500 border border-oxbrick-200 dark:border-oxbrick-700/40'
            : 'bg-forest-50 dark:bg-forest-700/20 text-forest-600 dark:text-forest-500 border border-forest-500/20'
        }`}>
          {msgType === 'error' ? <AlertCircle className="w-4 h-4" strokeWidth={1.75} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />}
          {msg}
        </div>
      )}

      {/* ===== QUIZ RESULT DETAIL MODAL ===== */}
      {viewingResult && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-brass-500" strokeWidth={1.75} />
                {viewingResult.quiz_title}
              </h2>
              <div className="flex items-center gap-3">
                {viewingResult.auto_graded && (
                  <span className="bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" strokeWidth={1.75} /> Auto-Graded
                  </span>
                )}
                <button onClick={() => setViewingResult(null)}
                  className="text-ink-400 hover:text-navy-700 dark:hover:text-white p-1.5 rounded transition-colors">
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-500 dark:text-ink-300">Your Score</span>
                <span className="text-2xl font-display font-semibold text-navy-800 dark:text-white">
                  {viewingResult.total_points} / {viewingResult.total_possible}
                </span>
              </div>
              <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${
                  viewingResult.total_possible > 0
                    ? (viewingResult.total_points / viewingResult.total_possible) * 100 >= 70
                      ? 'bg-forest-600' : (viewingResult.total_points / viewingResult.total_possible) * 100 >= 40
                      ? 'bg-brass-500' : 'bg-oxbrick-600'
                    : 'bg-ink-400'
                }`} style={{ width: `${viewingResult.total_possible > 0 ? Math.round((viewingResult.total_points / viewingResult.total_possible) * 100) : 0}%` }} />
              </div>
              <p className="text-sm text-ink-400 dark:text-ink-500 mt-1 text-right">
                {viewingResult.total_possible > 0 ? Math.round((viewingResult.total_points / viewingResult.total_possible) * 100) : 0}%
              </p>
              
              {viewingResult.graded_count === viewingResult.total_questions ? (
                <p className="text-forest-600 dark:text-forest-500 text-xs font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Fully Graded
                </p>
              ) : viewingResult.graded_count > 0 ? (
                <p className="text-brass-600 dark:text-brass-400 text-xs mt-2">
                  {viewingResult.graded_count}/{viewingResult.total_questions} questions graded
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-800 dark:text-ink-100">Question Breakdown</h3>
              <button 
                onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                {showCorrectAnswers ? 'Hide Correct Answers' : 'Show Correct Answers'}
              </button>
            </div>

            <div className="space-y-4">
              {viewingResult.answers.map((ans, idx) => {
                const isCorrect = ans.is_correct === true;
                const isIncorrect = ans.is_correct === false;
                
                return (
                  <div key={idx} className={`border rounded-xl p-4 ${
                    isCorrect ? 'border-forest-200 dark:border-forest-700/40 bg-forest-50/30 dark:bg-forest-700/10' :
                    isIncorrect ? 'border-oxbrick-200 dark:border-oxbrick-700/40 bg-oxbrick-50/30 dark:bg-oxbrick-700/10' :
                    'border-ink-200 dark:border-navy-600'
                  }`}>
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-navy-800 dark:text-ink-100 text-sm mb-2 flex-1">
                        Q{idx + 1}: {ans.question_text}
                      </p>
                      {isCorrect && (
                        <span className="text-forest-600 dark:text-forest-500 text-xs font-semibold flex items-center gap-1 ml-2">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Correct
                        </span>
                      )}
                      {isIncorrect && (
                        <span className="text-oxbrick-600 dark:text-oxbrick-500 text-xs font-semibold flex items-center gap-1 ml-2">
                          <X className="w-3.5 h-3.5" strokeWidth={1.75} /> Incorrect
                        </span>
                      )}
                    </div>

                    {ans.question_type === 'multiple_choice' ? (
                      <p className="text-sm text-ink-600 dark:text-ink-300 mb-2">
                        Your answer: <span className="font-semibold text-navy-800 dark:text-ink-100">
                          {ans.selected_option_text || 'No selection'}
                        </span>
                      </p>
                    ) : (
                      <div className="bg-white dark:bg-navy-700 p-3 rounded-lg mb-2">
                        <p className="text-sm text-ink-600 dark:text-ink-300">
                          Your answer: <span className="font-semibold text-navy-800 dark:text-ink-100">
                            {ans.text_answer || 'No answer provided'}
                          </span>
                        </p>
                      </div>
                    )}

                    {showCorrectAnswers && ans.question_type === 'multiple_choice' && ans.correct_answer && (
                      <div className="mt-2 bg-forest-50 dark:bg-forest-700/20 border border-forest-200 dark:border-forest-700/40 rounded-lg p-2">
                        <p className="text-xs text-forest-700 dark:text-forest-400">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" strokeWidth={1.75} />
                          Correct answer: <span className="font-semibold">{ans.correct_answer}</span>
                        </p>
                      </div>
                    )}

                    {ans.points !== null && (
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-sm font-semibold ${
                          ans.points > 0 ? 'text-forest-600 dark:text-forest-500' : 'text-oxbrick-600 dark:text-oxbrick-500'
                        }`}>
                          Points: {ans.points}
                        </span>
                        {ans.feedback && (
                          <span className="text-xs text-ink-500 dark:text-ink-300">Feedback: {ans.feedback}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== HOME TAB ===== */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-navy-200">Materials</p>
                <BookOpen className="w-5 h-5 text-brass-400" strokeWidth={1.75} />
              </div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{materials.length}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-navy-200">Assignments</p>
                <ClipboardList className="w-5 h-5 text-brass-400" strokeWidth={1.75} />
              </div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{submittedAssignments}/{totalAssignments}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-navy-200">Graded</p>
                <CheckCircle2 className="w-5 h-5 text-brass-400" strokeWidth={1.75} />
              </div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{gradedAssignments}/{submittedAssignments}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-navy-200">Pending Quiz</p>
                <Clock3 className="w-5 h-5 text-brass-400" strokeWidth={1.75} />
              </div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{pendingQuizzes}</p>
            </div>
            <div className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-navy-200">Auto-Graded</p>
                <Zap className="w-5 h-5 text-brass-400" strokeWidth={1.75} />
              </div>
              <p className="text-3xl md:text-4xl font-display font-semibold">{autoGradedQuizzes}</p>
            </div>
          </div>

          {/* Assignment Progress Section */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Assignment Progress
            </h3>
            {assignments.length === 0 ? (
              <p className="text-ink-400 dark:text-ink-500 text-sm">No assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map(ass => {
                  const submitted = submissionStatus[ass.id] === 'submitted';
                  const result = assignmentResults[ass.id];
                  return (
                    <div key={ass.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        {submitted
                          ? <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-500 flex-shrink-0" strokeWidth={1.75} />
                          : <ClipboardList className="w-5 h-5 text-ink-400 flex-shrink-0" strokeWidth={1.75} />}
                        <div>
                          <p className="font-medium text-navy-800 dark:text-ink-100">{ass.title}</p>
                          {submitted && result && (
                            <p className="text-xs mt-1">
                              {result.grade ? (
                                <span className="text-forest-600 dark:text-forest-500 font-semibold">
                                  Grade: {result.grade} {result.feedback && `| Feedback: ${result.feedback}`}
                                </span>
                              ) : (
                                <span className="text-brass-600 dark:text-brass-400">Submitted — Awaiting grading</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {submitted ? (
                          result?.grade ? (
                            <span className="text-forest-600 dark:text-forest-500 text-sm font-semibold">Graded</span>
                          ) : (
                            <span className="text-brass-600 dark:text-brass-400 text-sm">Pending</span>
                          )
                        ) : (
                          <span className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-semibold">Not submitted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiz Progress Section */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Quiz Progress
            </h3>
            {availableQuizzes.length === 0 ? (
              <p className="text-ink-400 dark:text-ink-500 text-sm">No quizzes available yet.</p>
            ) : (
              <div className="space-y-3">
                {availableQuizzes.map(quiz => {
                  const submitted = isQuizSubmitted(quiz.id);
                  const result = myQuizResults[quiz.id];
                  const percentage = result && result.total_possible > 0 ? Math.round((result.total_points / result.total_possible) * 100) : 0;
                  return (
                    <div key={quiz.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        {submitted
                          ? <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-500 flex-shrink-0" strokeWidth={1.75} />
                          : <ClipboardList className="w-5 h-5 text-ink-400 flex-shrink-0" strokeWidth={1.75} />}
                        <div>
                          <p className="font-medium text-navy-800 dark:text-ink-100">{quiz.title}</p>
                          {submitted && result && (
                            <p className="text-xs mt-1">
                              {result.graded_count > 0 ? (
                                <span className={`font-semibold ${getGradeColor(percentage)}`}>
                                  Score: {result.total_points}/{result.total_possible} ({percentage}%)
                                </span>
                              ) : (
                                <span className="text-brass-600 dark:text-brass-400">Submitted — Awaiting grading</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {submitted ? (
                          <>
                            {result && result.graded_count > 0 && (
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeBg(percentage)} ${getGradeColor(percentage)}`}>{percentage}%</div>
                            )}
                            <button onClick={() => { if (result) setViewingResult(result); else fetchMyQuizResult(quiz.id); }}
                              className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">
                              {result ? 'View Result' : 'Load Result'}
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => startQuiz(quiz.id)}
                            disabled={loadingQuiz}
                            className="bg-brass-600 hover:bg-brass-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {loadingQuiz ? 'Loading...' : 'Take Quiz'}
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
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Upcoming Deadlines
              </h3>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-ink-400 dark:text-ink-500 text-sm">No upcoming deadlines.</p>
              ) : (
                <ul className="space-y-3">{upcomingDeadlines.map(a => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="font-medium text-navy-800 dark:text-ink-100">{a.title}</span>
                    <span className="text-sm text-oxbrick-600 dark:text-oxbrick-500">{new Date(a.deadline).toLocaleDateString()}</span>
                  </li>
                ))}</ul>
              )}
            </div>
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Recent Announcements
              </h3>
              {recentAnnouncements.length === 0 ? (
                <p className="text-ink-400 dark:text-ink-500 text-sm">No announcements yet.</p>
              ) : (
                <ul className="space-y-3">{recentAnnouncements.map(a => (
                  <li key={a.id}>
                    <p className="font-medium text-navy-800 dark:text-ink-100">{a.title}</p>
                    <p className="text-sm text-ink-500 dark:text-ink-300">{a.content.slice(0, 80)}...</p>
                  </li>
                ))}</ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <SectionIcon Icon={BookOpen} />
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Learning Materials</h2>
          </div>
          {materials.length === 0 ? (
            <EmptyState label="No materials available yet." />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-5 hover:shadow-elevated transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-navy-800 dark:text-ink-100 truncate">{m.title}</h3>
                    <BookOpen className="w-5 h-5 text-brass-500 flex-shrink-0" strokeWidth={1.75} />
                  </div>
                  {m.description && <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">{m.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-ink-100 dark:bg-navy-700 px-2 py-1 rounded-full text-ink-600 dark:text-ink-300 font-medium">{m.type}</span>
                    {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">Open</a>}
                  </div>
                  {m.audio_url && (
                    <div className="mt-4">
                      <p className="text-xs text-ink-500 dark:text-ink-300 mb-1 flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5" strokeWidth={1.75} /> Voice instruction
                      </p>
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
            <SectionIcon Icon={ClipboardList} />
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <EmptyState label="No assignments yet." />
          ) : (
            <div className="space-y-4">
              {assignments.map((ass) => {
                const submitted = submissionStatus[ass.id] === 'submitted';
                const result = assignmentResults[ass.id];
                return (
                  <div key={ass.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-xl text-navy-800 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> {ass.title}
                      </h3>
                      {submitted && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          result?.grade ? 'bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500' : 'bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400'
                        }`}>
                          {result?.grade ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> : null}
                          {result?.grade ? 'Graded' : 'Submitted'}
                        </span>
                      )}
                    </div>
                    {ass.description && <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">{ass.description}</p>}
                    {ass.deadline && (
                      <p className="text-xs font-semibold text-oxbrick-600 dark:text-oxbrick-500 mb-3 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} /> Due: {new Date(ass.deadline).toLocaleString()}
                      </p>
                    )}
                    {ass.file_url && (
                      <a href={ass.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline flex items-center gap-1 mb-3">
                        <Paperclip className="w-3.5 h-3.5" strokeWidth={1.75} /> Download Assignment File
                      </a>
                    )}
                    {ass.audio_url && (
                      <div className="mb-4">
                        <p className="text-xs text-ink-500 dark:text-ink-300 mb-1 flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5" strokeWidth={1.75} /> Voice instruction
                        </p>
                        <audio controls src={ass.audio_url} className="w-full rounded-lg" />
                      </div>
                    )}

                    {submitted && result?.grade && (
                      <div className="mt-3 bg-forest-50 dark:bg-forest-700/20 border border-forest-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-ink-600 dark:text-ink-300">Your Grade:</span>
                          <span className="text-xl font-display font-semibold text-forest-600 dark:text-forest-500">{result.grade}</span>
                        </div>
                        {result.feedback && (
                          <div>
                            <span className="text-sm font-semibold text-ink-600 dark:text-ink-300">Feedback:</span>
                            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1 bg-white dark:bg-navy-800 p-3 rounded-lg">{result.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {submitted && !result?.grade && (
                      <div className="mt-3 bg-brass-50 dark:bg-brass-700/20 border border-brass-200 dark:border-brass-700/40 rounded-xl p-4">
                        <p className="text-sm text-brass-700 dark:text-brass-400">Submitted — Awaiting grading</p>
                      </div>
                    )}

                    {!submitted && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 border-t border-ink-200 dark:border-navy-600 pt-4">
                        <div className="flex-1 w-full sm:w-auto">
                          <input type="file" onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [ass.id]: e.target.files[0] }))}
                            className="block w-full text-sm text-ink-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brass-50 dark:file:bg-brass-700/20 file:text-brass-700 dark:file:text-brass-400 hover:file:bg-brass-100 dark:hover:file:bg-brass-700/30 transition-colors cursor-pointer" />
                        </div>
                        <button onClick={() => handleSubmit(ass.id)}
                          className="bg-brass-600 hover:bg-brass-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-soft transition-colors duration-150 text-sm">
                          Upload Submission
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <SectionIcon Icon={Megaphone} />
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <EmptyState label="No announcements yet." />
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                  <h3 className="font-semibold text-xl text-navy-800 dark:text-white">{a.title}</h3>
                  <p className="text-sm text-ink-600 dark:text-ink-300 mt-2">{a.content}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-500 mt-3">{new Date(a.created_at).toLocaleString()}</p>
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
            <SectionIcon Icon={Brain} />
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Available Quizzes</h2>
          </div>

          {availableQuizzes.length === 0 ? (
            <EmptyState label="No quizzes available yet." />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {availableQuizzes.map(quiz => {
                const submitted = isQuizSubmitted(quiz.id);
                const result = myQuizResults[quiz.id];
                const percentage = result && result.total_possible > 0 ? Math.round((result.total_points / result.total_possible) * 100) : 0;
                return (
                  <div key={quiz.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                    <h3 className="font-semibold text-xl text-navy-800 dark:text-white mb-2">{quiz.title}</h3>
                    {quiz.description && <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">{quiz.description}</p>}
                    {submitted ? (
                      <div>
                        <div className="flex items-center gap-2 text-forest-600 dark:text-forest-500 mb-3">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /><span className="font-semibold text-sm">Completed</span>
                        </div>
                        {result ? (
                          <div className="bg-ink-50 dark:bg-navy-700 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-ink-500 dark:text-ink-300">Score:</span>
                              <span className={`font-semibold ${getGradeColor(percentage)}`}>{result.total_points}/{result.total_possible}</span>
                            </div>
                            <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2">
                              <div className={`h-2 rounded-full ${percentage >= 70 ? 'bg-forest-600' : percentage >= 40 ? 'bg-brass-500' : 'bg-oxbrick-600'}`} style={{ width: `${percentage}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-300">
                              <span>{percentage}%</span>
                              <span>{result.graded_count}/{result.total_questions} graded</span>
                            </div>
                            {result.auto_graded && (
                              <div className="flex items-center gap-1 text-forest-600 dark:text-forest-500 text-xs">
                                <Zap className="w-3 h-3" strokeWidth={1.75} /> Auto-graded
                              </div>
                            )}
                            <div className="flex flex-col gap-2">
                              <button onClick={() => setViewingResult(result)}
                                className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">
                                View Details
                              </button>
                              <button 
                                onClick={() => downloadQuizResults(quiz.id)}
                                disabled={exportingResults}
                                className="w-full bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-forest-100 dark:hover:bg-forest-700/30 transition-colors flex items-center justify-center gap-2">
                                <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                                {exportingResults ? 'Downloading...' : 'Download Results'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => fetchMyQuizResult(quiz.id)} 
                            className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">
                            Load Result
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => startQuiz(quiz.id)}
                        disabled={loadingQuiz}
                        className="w-full bg-brass-600 hover:bg-brass-700 text-white font-semibold px-5 py-3 rounded-xl shadow-soft transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" strokeWidth={1.75} />}
                        {loadingQuiz ? 'Loading...' : 'Take Quiz'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}