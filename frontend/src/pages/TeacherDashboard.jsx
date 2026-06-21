import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

const EMOJI_LIST = ['🐼', '📄', '▶️', '🎨', '✏️', '📖', '🌍', '🧮', '🔬', '🎵', '🐱', '🚀', '🍎', '🌈', '🎲', '📚'];

// Click sound hook – fails silently if file missing
const useClickSound = () => {
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio('/sounds/click.mp3');
    audioRef.current.volume = 0.2;
  }
  return useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateNotifications } = useNotifications();
  const playClick = useClickSound();

  const [tab, setTab] = useState('home');

  const [myClasses, setMyClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [materials, setMaterials] = useState([]);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matFile, setMatFile] = useState(null);
  const [matType, setMatType] = useState('pdf');
  const [matIcon, setMatIcon] = useState('📚');
  const [matAudio, setMatAudio] = useState(null);
  const [matAudioName, setMatAudioName] = useState('');
  const [isRecordingMat, setIsRecordingMat] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [assTitle, setAssTitle] = useState('');
  const [assDesc, setAssDesc] = useState('');
  const [assFile, setAssFile] = useState(null);
  const [assDeadline, setAssDeadline] = useState('');
  const [assIcon, setAssIcon] = useState('📝');
  const [assAudio, setAssAudio] = useState(null);
  const [assAudioName, setAssAudioName] = useState('');
  const [isRecordingAss, setIsRecordingAss] = useState(false);
  const [selectedAss, setSelectedAss] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [grades, setGrades] = useState({});

  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const [students, setStudents] = useState([]);
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPass, setNewStudentPass] = useState('');

  // Quiz feature state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0 }
  ]);
  const [quizzes, setQuizzes] = useState([]);

  // Quiz grading state
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [selectedQuizForGrading, setSelectedQuizForGrading] = useState(null);
  const [quizGrades, setQuizGrades] = useState({});
  const [gradingView, setGradingView] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [gradingStudentId, setGradingStudentId] = useState(null);

  // Quiz results state
  const [quizResults, setQuizResults] = useState(null);
  const [resultsView, setResultsView] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState({});

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async (onStop) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        onStop(blob);
      };
      recorder.start();
    } catch (err) {
      alert('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
      return;
    }
    fetch(`${API_URL}teacher/classes/`, {
      headers: { Authorization: `Bearer ${user.access_token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Not authorized');
        return r.json();
      })
      .then(data => {
        const classes = Array.isArray(data) ? data : [];
        setMyClasses(classes);
        if (classes.length > 0) setSelectedClassId(classes[0].id);
      })
      .catch(() => setMyClasses([]));
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      fetchData();
      fetchQuizzes();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      if (tab === 'quizzes') {
        fetchQuizzes();
      } else {
        fetchData();
      }
    }
  }, [tab, selectedClassId]);

  const fetchData = async () => {
    if (!selectedClassId) return;
    const headers = { Authorization: `Bearer ${user.access_token}` };
    const classParam = `?class_id=${selectedClassId}`;

    const [matRes, assRes, annRes, studRes] = await Promise.all([
      fetch(`${API_URL}materials/${classParam}`, { headers }),
      fetch(`${API_URL}assignments/${classParam}`, { headers }),
      fetch(`${API_URL}announcements/${classParam}`, { headers }),
      fetch(`${API_URL}students/${classParam}`, { headers }),
    ]);
    if (matRes.ok) setMaterials(await matRes.json());
    if (assRes.ok) { const d = await assRes.json(); setAssignments(d); fetchAssignmentStats(d); }

    if (annRes.ok) setAnnouncements(await annRes.json());
    if (studRes.ok) setStudents(await studRes.json());
  };
  
  const fetchAssignmentStats = async (assignmentsList) => {
    if (!assignmentsList || assignmentsList.length === 0) return;
    const headers = { Authorization: `Bearer ${user.access_token}` };
    const stats = {};
    for (const ass of assignmentsList) {
      try {
         const res = await fetch(`${API_URL}submissions/${ass.id}/`, { headers });
         if (res.ok) {
          const subs = await res.json();
          stats[ass.id] = { submitted: Array.isArray(subs) ? subs.length : 0, graded: Array.isArray(subs) ? subs.filter(s => s.grade).length : 0 };
          }
         }
         catch (_) { stats[ass.id] = { submitted: 0, graded: 0 }; }
         }
         setAssignmentStats(stats);
      };

  // Quiz API functions
  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`${API_URL}quizzes/`, {
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      } else {
        setQuizzes([]);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
      setQuizzes([]);
    }
  };

  // Fetch quiz submissions
  const fetchQuizSubmissions = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/submissions`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizSubmissions(data);
        setSelectedQuizForGrading(quizId);
        setGradingView('submissions');
      } else {
        showMsg('Failed to fetch submissions', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch quiz submissions:', err);
      showMsg('Failed to fetch submissions', 'error');
    }
  };

  // Fetch student answers for grading
  const fetchStudentQuizAnswers = async (studentId) => {
    try {
      setGradingStudentId(studentId);
      const res = await fetch(`${API_URL}quizzes/submissions/${studentId}/answers`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentAnswers(data.answers || []);
        setGradingView('grade');
        // Pre-fill with existing grades (for re-grading)
        const initial = {};
        (data.answers || []).forEach(a => {
          initial[a.id] = { 
            points: a.points !== null && a.points !== undefined ? a.points : '', 
            feedback: a.feedback || '' 
          };
        });
        setQuizGrades(initial);
      } else {
        showMsg('Failed to fetch answers', 'error');
      }
    } catch (_err) {
      console.error('Failed to fetch answers:', _err);
      showMsg('Failed to fetch answers', 'error');
    }
  };

  // Submit quiz grades
  const submitQuizGrades = async () => {
    if (!gradingStudentId) return;
    try {
      const gradesArray = Object.entries(quizGrades).map(([answerId, grade]) => ({
        answer_id: parseInt(answerId),
        points: parseFloat(grade.points) || 0,
        feedback: grade.feedback || '',
      }));

      const res = await fetch(`${API_URL}quizzes/submissions/${gradingStudentId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ grades: gradesArray })
      });

      if (res.ok) {
        showMsg('Grades saved successfully!');
        setGradingView('submissions');
        setGradingStudentId(null);
        fetchQuizSubmissions(selectedQuizForGrading);
      } else {
        showMsg('Failed to save grades', 'error');
      }
    } catch (_err) {
      console.error('Failed to save grades:', _err);
      showMsg('Failed to save grades', 'error');
    }
  };

  // Fetch quiz results
  const fetchQuizResults = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/results`, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizResults(data);
        setResultsView('results');
      } else {
        showMsg('Failed to fetch results', 'error');
      }
    } catch (_err) {
      console.error('Failed to fetch quiz results:', _err);
      showMsg('Failed to fetch results', 'error');
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0 }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    const newQ = questions.filter((_, i) => i !== index);
    setQuestions(newQ);
  };

  const updateQuestion = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
    setQuestions(newQ);
  };

  const setCorrectOption = (qIndex, oIndex) => {
    const newQ = [...questions];
    newQ[qIndex].correctIndex = oIndex;
    setQuestions(newQ);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle || questions.length === 0) {
      showMsg('Please enter a title and at least one question', 'error');
      return;
    }

    const payload = {
      title: quizTitle,
      description: quizDesc,
      class_id: selectedClassId,
      questions: questions.map((q, idx) => ({
        question_text: q.text,
        question_type: q.type,
        order: idx,
        options:
          q.type === 'multiple_choice'
            ? q.options.map((opt, oi) => ({
                option_text: opt,
                is_correct: oi === q.correctIndex,
              }))
            : null,
      })),
    };

    try {
      const res = await fetch(`${API_URL}quizzes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMsg('Quiz created successfully!');
        setQuizTitle('');
        setQuizDesc('');
        setQuestions([
          { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0 }
        ]);
        fetchQuizzes();
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg(err.detail || 'Creation failed', 'error');
      }
    } catch (err) {
      showMsg('Creation failed', 'error');
    }
  };

  const publishQuiz = async (quizId) => {
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) {
        showMsg('Quiz published');
        fetchQuizzes();
      } else {
        showMsg('Publish failed', 'error');
      }
    } catch (err) {
      showMsg('Publish failed', 'error');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      const res = await fetch(`${API_URL}quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) {
        showMsg('Quiz deleted');
        fetchQuizzes();
      } else {
        showMsg('Delete failed', 'error');
      }
    } catch (err) {
      showMsg('Delete failed', 'error');
    }
  };

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  // Upload material
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', matTitle);
    formData.append('description', matDesc);
    formData.append('type', matType);
    formData.append('class_id', selectedClassId);
    formData.append('icon', matIcon);
    if (matFile) formData.append('file', matFile);
    if (matAudio) formData.append('audio', matAudio, matAudioName || 'instruction.webm');

    const res = await fetch(`${API_URL}materials/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.access_token}` },
      body: formData,
    });
    if (res.ok) {
      showMsg('Material uploaded');
      setMatTitle(''); setMatDesc(''); setMatFile(null); setMatAudio(null); setMatIcon('📚');
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Upload failed', 'error');
    }
  };

  const deleteMaterial = async (id) => {
    if (!confirm('Delete this material?')) return;
    await fetch(`${API_URL}materials/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.access_token}` }
    });
    fetchData();
  };

  // Create assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', assTitle);
    formData.append('description', assDesc);
    formData.append('deadline', assDeadline);
    formData.append('class_id', selectedClassId);
    formData.append('icon', assIcon);
    if (assFile) formData.append('file', assFile);
    if (assAudio) formData.append('audio', assAudio, assAudioName || 'instruction.webm');

    const res = await fetch(`${API_URL}assignments/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.access_token}` },
      body: formData,
    });
    if (res.ok) {
      showMsg('Assignment created');
      setAssTitle(''); setAssDesc(''); setAssDeadline(''); setAssFile(null); setAssAudio(null); setAssIcon('📝');
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Creation failed', 'error');
    }
  };

  const deleteAssignment = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await fetch(`${API_URL}assignments/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.access_token}` }
    });
    fetchData();
  };

  const viewSubmissions = async (assignmentId) => {
    const res = await fetch(`${API_URL}submissions/${assignmentId}/`, {
      headers: { Authorization: `Bearer ${user.access_token}` }
    });
    if (res.ok) {
      const subs = await res.json();
      setSubmissions(subs);
      setSelectedAss(assignmentId);
      const initial = {};
      subs.forEach(s => {
        initial[s.id] = { grade: s.grade || '', feedback: s.feedback || '' };
      });
      setGrades(initial);
      const newSubs = subs.map(s => ({ ...s, created_at: s.submitted_at }));
      updateNotifications('teacher', newSubs, 'submissions');
    }
  };

  const handleGrade = async (submissionId) => {
    const { grade, feedback } = grades[submissionId] || {};
    const formData = new FormData();
    formData.append('grade', grade);
    formData.append('feedback', feedback);
    const res = await fetch(`${API_URL}submissions/${submissionId}/grade/`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user.access_token}` },
      body: formData,
    });
    if (res.ok) {showMsg('Grade saved');
      viewSubmissions(selectedAss); fetchData(); 
    }
    else showMsg('Failed to save grade', 'error');
  };

  // Post announcement
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}announcements/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
      body: JSON.stringify({ title: annTitle, content: annContent, class_id: selectedClassId }),
    });
    if (res.ok) {
      showMsg('Announcement posted');
      setAnnTitle(''); setAnnContent('');
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed', 'error');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}students/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
      body: JSON.stringify({
        student_number: newStudentNumber,
        password: newStudentPass,
        display_name: newStudentName,
        class_id: selectedClassId
      }),
    });
    if (res.ok) {
      showMsg('Student added');
      setNewStudentNumber(''); setNewStudentName(''); setNewStudentPass('');
      fetchData();
    } else showMsg('Failed to add student', 'error');
  };

  const selectedClassName = myClasses.find(c => c.id === selectedClassId)?.name || 'Unknown';

  // Home tab data
  const totalStudents = students.length;
  const totalMaterials = materials.length;
  const totalAssignments = assignments.length;
  const publishedQuizzes = quizzes.filter(q => q.is_published).length;
  const draftQuizzes = quizzes.filter(q => !q.is_published).length;
  const totalSubmissions = Object.values(assignmentStats).reduce((s, a) => s + (a.submitted || 0), 0);
  const totalUngraded = Object.values(assignmentStats).reduce((s, a) => s + ((a.submitted || 0) - (a.graded || 0)), 0);
  const upcomingDeadlines = assignments.filter(a => a.deadline && new Date(a.deadline) > new Date()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 2);
  const pendingTasks = [];
  if (totalUngraded > 0) pendingTasks.push(`${totalUngraded} submission(s) need grading`);
  if (draftQuizzes > 0) pendingTasks.push(`${draftQuizzes} quiz(zes) need publishing`);


  const navLinks = [
    { label: 'Home', onClick: () => setTab('home') },
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
    { label: 'Students', onClick: () => setTab('students') },
    { label: 'Quizzes', onClick: () => setTab('quizzes') },
  ];

  return (
    <Layout role="teacher" navLinks={navLinks}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">👩‍🏫</span> Teacher Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage materials, assignments, and students for your class.</p>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all duration-200 bg-white dark:bg-gray-800 shadow-sm font-semibold text-gray-900 dark:text-white"
          >
            {myClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
            ))}
          </select>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
          msgType === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        }`}>
          {msgType === 'error' ? '⚠️' : '✅'} {msg}
        </div>
      )}

      {/* ===== QUIZ GRADING MODAL ===== */}
      {gradingView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {gradingView === 'submissions' ? 'Quiz Submissions' : 'Grade Answers'}
              </h2>
              <button
                onClick={() => { setGradingView(null); setSelectedQuizForGrading(null); setGradingStudentId(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            {gradingView === 'submissions' && (
              <div className="space-y-3">
                {quizSubmissions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No submissions yet.</p>
                ) : (
                  quizSubmissions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {sub.student_name || 'Student'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Submitted
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchStudentQuizAnswers(sub.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {gradingView === 'grade' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Grade each answer below. Points will be totaled automatically.
                </p>
                
                {studentAnswers.map((answer, idx) => (
                  <div key={answer.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {idx + 1}. {answer.questions?.question_text || `Question ${idx + 1}`}
                    </p>
                    
                    {answer.questions?.question_type === 'multiple_choice' ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Student selected: <span className="font-semibold text-gray-800 dark:text-gray-200">{answer.selected_option_text || 'None'}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-100 dark:bg-gray-600 p-3 rounded-lg">
                        {answer.text_answer || 'No answer provided'}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Points
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 5"
                          value={quizGrades[answer.id]?.points || ''}
                          onChange={(e) => setQuizGrades(prev => ({
                            ...prev,
                            [answer.id]: { ...prev[answer.id], points: e.target.value }
                          }))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Feedback
                        </label>
                        <input
                          type="text"
                          placeholder="Optional feedback"
                          value={quizGrades[answer.id]?.feedback || ''}
                          onChange={(e) => setQuizGrades(prev => ({
                            ...prev,
                            [answer.id]: { ...prev[answer.id], feedback: e.target.value }
                          }))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={submitQuizGrades}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Save All Grades
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== QUIZ RESULTS MODAL ===== */}
      {resultsView === 'results' && quizResults && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📊 Results: {quizResults.quiz_title}
              </h2>
              <button
                onClick={() => { setResultsView(null); setQuizResults(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Total possible points: {quizResults.total_possible}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Student</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Score</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {quizResults.students.map(student => {
                    const percentage = quizResults.total_possible > 0 
                      ? Math.round((student.total_points / quizResults.total_possible) * 100) 
                      : 0;
                    const fullyGraded = student.graded_count === student.total_questions;
                  
                    return (
                      <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{student.student_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{student.student_number}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {student.total_points}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            /{quizResults.total_possible}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage}%</span>
                        </td>
                        <td className="px-4 py-3">
                          {fullyGraded ? (
                            <span className="text-green-600 dark:text-green-400 text-xs font-semibold">✅ Graded</span>
                          ) : student.graded_count > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                              ⏳ {student.graded_count}/{student.total_questions} graded
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">Not graded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== HOME TAB ===== */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Students', value: totalStudents, icon: '👩‍🎓', color: 'from-blue-600 to-indigo-600' },
              { label: 'Materials', value: totalMaterials, icon: '📚', color: 'from-emerald-500 to-teal-600' },
              { label: 'Assignments', value: totalAssignments, icon: '📝', color: 'from-purple-600 to-violet-600' },
              { label: 'Submissions', value: totalSubmissions, icon: '📋', color: 'from-pink-500 to-rose-600' },
              { label: 'To Grade', value: totalUngraded, icon: '✏️', color: totalUngraded > 0 ? 'from-red-500 to-orange-600' : 'from-green-500 to-emerald-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 shadow-xl text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold opacity-90">{label}</p>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-3xl md:text-4xl font-black">{value}</p>
              </div>
            ))}
          </div>

          {/* Pending Tasks Alert - NEW */}
          {pendingTasks.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-amber-800 dark:text-amber-300">Pending Tasks</h3>
                  <ul className="text-sm text-amber-600 dark:text-amber-400 mt-1 space-y-1">
                    {pendingTasks.map((task, idx) => (
                      <li key={idx}>• {task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Overview - NEW */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📝</span> Assignment Overview
            </h3>
            {assignments.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No assignments created yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map(ass => {
                  const stats = assignmentStats[ass.id] || { submitted: 0, graded: 0 };
                  const allGraded = stats.submitted > 0 && stats.submitted === stats.graded;
                  return (
                    <div key={ass.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ass.icon || '📝'}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{ass.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.submitted} submitted | {stats.graded} graded
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {allGraded ? (
                          <span className="text-green-600 dark:text-green-400 text-xs font-semibold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">✅ All Graded</span>
                        ) : stats.submitted > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">⏳ {stats.submitted - stats.graded} to grade</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">No submissions</span>
                        )}
                        <button 
                          onClick={() => setTab('assignments')} 
                          className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline transition"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiz Overview Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🧠</span> Quiz Overview
            </h3>
            
            {quizzes.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No quizzes created yet.</p>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{quiz.is_published ? '📋' : '📝'}</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{quiz.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {quiz.is_published && (
                        <>
                          <button
                            onClick={() => fetchQuizSubmissions(quiz.id)}
                            className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                          >
                            Submissions
                          </button>
                          <button
                            onClick={() => fetchQuizResults(quiz.id)}
                            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                          >
                            Results
                          </button>
                        </>
                      )}
                      {!quiz.is_published && (
                        <button
                          onClick={() => publishQuiz(quiz.id)}
                          className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-200 transition"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span>📅</span> Upcoming Deadlines</h3>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span>📢</span> Recent Announcements</h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Material</h2>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  </div>
                  <input type="text" placeholder="e.g. Week 1 Lesson" value={matTitle} onChange={(e) => setMatTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea placeholder="Brief description..." value={matDesc} onChange={(e) => setMatDesc(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select value={matType} onChange={(e) => setMatType(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="pdf">Document</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">File</label>
                  <input type="file" onChange={(e) => setMatFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setMatIcon(emoji)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border-2 transition ${
                        matIcon === emoji ? 'border-blue-500 bg-blue-50 scale-110 shadow-md' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Voice instruction</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      if (isRecordingMat) { stopRecording(); setIsRecordingMat(false); }
                      else { setIsRecordingMat(true); startRecording(blob => { setMatAudio(blob); setMatAudioName('instruction.webm'); }); }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
                      isRecordingMat ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isRecordingMat ? '⏹️ Stop Recording' : '🎤 Record Instruction'}
                  </button>
                  {matAudio && <span className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Recording attached</span>}
                </div>
              </div>
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                Upload Material
              </button>
            </form>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materials.map(m => (
              <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
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
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">🎤 Voice instruction</p>
                    <audio controls src={m.audio_url} className="w-full rounded-lg" />
                  </div>
                )}
                <button onClick={() => deleteMaterial(m.id)} className="text-red-500 text-sm mt-3 font-medium hover:underline">Delete</button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
                <span className="text-6xl">📭</span>
                <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No materials uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Assignment</h2>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  </div>
                  <input type="text" placeholder="Homework 1" value={assTitle} onChange={(e) => setAssTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea placeholder="Instructions..." value={assDesc} onChange={(e) => setAssDesc(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
                  <input type="datetime-local" value={assDeadline} onChange={(e) => setAssDeadline(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">File</label>
                  <input type="file" onChange={(e) => setAssFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setAssIcon(emoji)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border-2 transition ${
                        assIcon === emoji ? 'border-purple-500 bg-purple-50 scale-110 shadow-md' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Voice instruction</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      if (isRecordingAss) { stopRecording(); setIsRecordingAss(false); }
                      else { setIsRecordingAss(true); startRecording(blob => { setAssAudio(blob); setAssAudioName('instruction.webm'); }); }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
                      isRecordingAss ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isRecordingAss ? '⏹️ Stop Recording' : '🎤 Record Instruction'}
                  </button>
                  {assAudio && <span className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Recording attached</span>}
                </div>
              </div>
              <button type="submit" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                Create Assignment
              </button>
            </form>
          </div>

          {assignments.map(a => {
            const stats = assignmentStats[a.id] || { submitted: 0, graded: 0 };
            return (
              <div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <span className="text-3xl">{a.icon || '📝'}</span> {a.title}
                    </h3>
                    {a.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{a.description}</p>}
                    {a.deadline && (
                      <p className="text-xs font-semibold text-red-500 mt-2 flex items-center gap-1">
                        <span>📅</span> Due: {new Date(a.deadline).toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">📋 {stats.submitted} submitted</span>
                      <span className={`text-xs font-semibold ${stats.submitted === stats.graded && stats.submitted > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        ✏️ {stats.graded} graded
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => viewSubmissions(a.id)} className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">Submissions</button>
                    <button onClick={() => deleteAssignment(a.id)} className="text-red-500 text-sm font-semibold hover:underline">Delete</button>
                  </div>
                </div>
                {a.audio_url && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">🎤 Voice instruction</p>
                    <audio controls src={a.audio_url} className="w-full rounded-lg" />
                  </div>
                )}
                {a.file_url && (
                  <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline mt-3 inline-block">
                    📎 Download Assignment File
                  </a>
                )}
                {selectedAss === a.id && (
                  <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Submissions</h4>
                    {submissions.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">No submissions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map(s => (
                          <div key={s.id} className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 ${s.grade ? 'border-l-4 border-green-500' : 'border-l-4 border-amber-500'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{s.students?.display_name || 'Student'}</span>
                                {s.file_url && (
                                  <a href={s.file_url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm underline">View File</a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  type="text"
                                  placeholder="Grade"
                                  value={grades[s.id]?.grade || ''}
                                  onChange={(e) => setGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], grade: e.target.value } }))}
                                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Feedback"
                                  value={grades[s.id]?.feedback || ''}
                                  onChange={(e) => setGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))}
                                  className="flex-1 min-w-[120px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <button
                                  onClick={() => handleGrade(s.id)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {assignments.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-6xl">📋</span>
              <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No assignments created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg">📢</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post Announcement</h2>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  </div>
                  <input type="text" placeholder="Important update" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content *</label>
                <textarea placeholder="Write your announcement here..." value={annContent} onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" rows={3} required />
              </div>
              <button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                Post Announcement
              </button>
            </form>
          </div>
          {announcements.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">{a.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{a.content}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-6xl">📢</span>
              <p className="text-gray-400 dark:text-gray-500 mt-4 text-lg font-medium">No announcements posted yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white text-2xl shadow-lg">👩‍🎓</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Student</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">New students will be added to the currently selected class.</p>
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Student Number *</label>
                <input type="text" placeholder="S001" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                <input type="text" placeholder="Alice Phiri" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                <input type="password" placeholder="Min. 4 characters" value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div className="sm:col-span-3 mt-2">
                <button type="submit" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                  Add Student
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-3xl">📋</span> Student List
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All students enrolled in <span className="font-semibold">{selectedClassName}</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Number</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students.map((s, index) => (
                    <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'}`}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">{s.student_number}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{s.display_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
                          {selectedClassName}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center text-gray-400 dark:text-gray-500 text-lg font-medium">
                        <span className="text-4xl block mb-2">👩‍🎓</span>
                        No students enrolled in this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUIZZES TAB ===== */}
      {tab === 'quizzes' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Create Quiz Form */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">🧠</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create a New Quiz</h2>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-5 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quiz Title *</label>
                  <input type="text" placeholder="e.g. Science Revision" value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <input type="text" placeholder="Optional description" value={quizDesc}
                    onChange={(e) => setQuizDesc(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                </div>
              </div>

              {/* Dynamic Questions */}
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Question {qIdx + 1}</h3>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qIdx)}
                        className="text-red-500 text-sm font-medium hover:underline">Remove</button>
                    )}
                  </div>

                  <input type="text" placeholder="Enter question text" value={q.text}
                    onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" required />

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Type:</label>
                    <select value={q.type}
                      onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="text">Text Answer</option>
                    </select>
                  </div>

                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Options (mark the correct one)</p>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <input type="radio" name={`correct-${qIdx}`}
                            checked={q.correctIndex === oIdx}
                            onChange={() => setCorrectOption(qIdx, oIdx)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                          <input type="text" value={opt}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" required />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Student will type their answer.</p>
                  )}
                </div>
              ))}

              <button type="button" onClick={addQuestion}
                className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">
                + Add Another Question
              </button>

              <div>
                <button type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                  Create Quiz
                </button>
              </div>
            </form>
          </div>

          {/* Existing Quizzes List */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Quizzes</h2>
            {quizzes.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 dark:text-gray-500 mt-2 text-sm">No quizzes created yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{quiz.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {quiz.is_published ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">✅ Published</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">❌ Draft</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {quiz.is_published && (
                        <>
                          <button onClick={() => fetchQuizSubmissions(quiz.id)}
                            className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">
                            Submissions
                          </button>
                          <button onClick={() => fetchQuizResults(quiz.id)}
                            className="text-green-600 dark:text-green-400 text-sm font-semibold hover:underline">
                            Results
                          </button>
                        </>
                      )}
                      {!quiz.is_published && (
                        <button onClick={() => publishQuiz(quiz.id)}
                          className="text-green-600 dark:text-green-400 text-sm font-semibold hover:underline">
                          Publish
                        </button>
                      )}
                      <button onClick={() => deleteQuiz(quiz.id)}
                        className="text-red-500 text-sm font-semibold hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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