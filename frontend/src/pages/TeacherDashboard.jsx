import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  ClipboardList,
  Inbox,
  PenSquare,
  CheckCircle2,
  AlertCircle,
  X,
  BarChart3,
  Megaphone,
  Brain,
  Calendar,
  Paperclip,
  Mic,
  Square,
  Type,
  Clock3,
  Pencil,
  Trash2,
  Zap,
  Target,
  Award,
  Loader2,
} from 'lucide-react';

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
  const [quizTotalPoints, setQuizTotalPoints] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0, points: '' }
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

  // Auto-grade quiz
  const autoGradeQuiz = async (quizId) => {
    try {
      const r = await fetch(`${API_URL}quizzes/${quizId}/auto-grade`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      if (r.ok) { 
        showMsg('Quiz auto-graded!'); 
        fetchQuizResults(quizId); 
      } else { 
        const e = await r.json().catch(() => ({})); 
        showMsg(e.detail || 'Auto-grade failed', 'error'); 
      }
    } catch (_) { 
      showMsg('Auto-grade failed', 'error'); 
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0, points: '' }
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
      total_points: quizTotalPoints || null,
      questions: questions.map((q, idx) => ({
        question_text: q.text,
        question_type: q.type,
        order: idx,
        points: q.points || null,
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
        setQuizTotalPoints('');
        setQuestions([
          { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0, points: '' }
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

  // Delete student
  const deleteStudent = async (studentId) => {
    if (!confirm('Delete this student?')) return;
    try {
      const res = await fetch(`${API_URL}students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.access_token}` },
      });
      if (res.ok) {
        showMsg('Student deleted');
        fetchData();
      } else {
        showMsg('Delete failed', 'error');
      }
    } catch (err) {
      showMsg('Delete failed', 'error');
    }
  };

  // Edit student (placeholder - would open a modal in production)
  const editStudent = (studentId) => {
    showMsg('Edit functionality - would open modal in production', 'success');
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

  const SectionIcon = ({ Icon }) => (
    <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center text-brass-400 flex-shrink-0">
      <Icon className="w-5 h-5" strokeWidth={1.75} />
    </div>
  );

  const TitleFieldIcon = () => (
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Type className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
    </div>
  );

  const inputBase = "w-full pl-11 pr-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500";
  const inputPlain = "w-full px-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500";
  const primaryBtn = "bg-brass-600 hover:bg-brass-700 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-soft transition-colors duration-150";

  return (
    <Layout role="teacher" navLinks={navLinks}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-brass-500" strokeWidth={1.75} /> Teacher Dashboard
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2 text-lg">Manage materials, assignments, and students for your class.</p>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-800 shadow-soft font-medium text-navy-800 dark:text-white"
          >
            {myClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
            ))}
          </select>
        </div>
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

      {/* ===== QUIZ GRADING MODAL ===== */}
      {gradingView && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">
                {gradingView === 'submissions' ? 'Quiz Submissions' : 'Grade Answers'}
              </h2>
              <button
                onClick={() => { setGradingView(null); setSelectedQuizForGrading(null); setGradingStudentId(null); }}
                className="text-ink-400 hover:text-navy-700 dark:hover:text-white p-1.5 rounded transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {gradingView === 'submissions' && (
              <div className="space-y-3">
                {quizSubmissions.length === 0 ? (
                  <p className="text-ink-500 dark:text-ink-300 text-center py-8">No submissions yet.</p>
                ) : (
                  quizSubmissions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                      <div>
                        <p className="font-medium text-navy-800 dark:text-ink-100">
                          {sub.student_name || 'Student'}
                        </p>
                        <p className="text-xs text-ink-500 dark:text-ink-300">
                          Submitted
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchStudentQuizAnswers(sub.id)}
                          className="bg-brass-600 hover:bg-brass-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
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
                <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
                  Grade each answer below. Points will be totaled automatically.
                </p>

                {studentAnswers.map((answer, idx) => (
                  <div key={answer.id} className="border border-ink-200 dark:border-navy-600 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-navy-800 dark:text-ink-100 mb-2">
                        {idx + 1}. {answer.questions?.question_text || `Question ${idx + 1}`}
                      </p>
                      {answer.is_correct !== undefined && (
                        <span className={`ml-2 text-xs font-semibold ${answer.is_correct ? 'text-forest-600' : 'text-oxbrick-600'}`}>
                          {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      )}
                    </div>

                    {answer.questions?.question_type === 'multiple_choice' ? (
                      <p className="text-sm text-ink-600 dark:text-ink-300 mb-3">
                        Student selected: <span className="font-semibold text-navy-800 dark:text-ink-100">{answer.selected_option_number && answer.selected_option_text ? `${answer.selected_option_number}. ${answer.selected_option_text}` : answer.selected_option_text || `Option ID: ${answer.selected_option_id}`}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-ink-600 dark:text-ink-300 mb-3 bg-ink-100 dark:bg-navy-600 p-3 rounded-lg">
                        {answer.text_answer || 'No answer provided'}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 dark:text-ink-300 mb-1">
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
                          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-800 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 dark:text-ink-300 mb-1">
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
                          className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-navy-800 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={submitQuizGrades}
                  className={`w-full ${primaryBtn}`}
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
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-brass-500" strokeWidth={1.75} /> Results: {quizResults.quiz_title}
              </h2>
              <button
                onClick={() => { setResultsView(null); setQuizResults(null); }}
                className="text-ink-400 hover:text-navy-700 dark:hover:text-white p-1.5 rounded transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-ink-500 dark:text-ink-300">
                Total possible points: {quizResults.total_possible}
              </p>
              <button 
                onClick={() => autoGradeQuiz(quizResults.quiz_id || selectedQuizForGrading)}
                className="bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-forest-100 transition flex items-center gap-1"
              >
                <Zap className="w-4 h-4" strokeWidth={1.75} /> Auto-Grade All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy-700">
                    <th className="px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider rounded-l-lg">Student</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-navy-700">
                  {quizResults.students.map(student => {
                    const percentage = quizResults.total_possible > 0
                      ? Math.round((student.total_points / quizResults.total_possible) * 100)
                      : 0;
                    const fullyGraded = student.graded_count === student.total_questions;

                    return (
                      <tr key={student.student_id} className="hover:bg-ink-50 dark:hover:bg-navy-700/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy-800 dark:text-ink-100">{student.student_name}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-300 font-data">{student.student_number}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-display font-semibold text-lg text-navy-800 dark:text-white">
                            {student.total_points}
                          </span>
                          <span className="text-sm text-ink-500 dark:text-ink-300">
                            /{quizResults.total_possible}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32 bg-ink-200 dark:bg-navy-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${percentage >= 70 ? 'bg-forest-600' : percentage >= 40 ? 'bg-brass-500' : 'bg-oxbrick-600'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink-500 dark:text-ink-300 mt-1">{percentage}%</span>
                        </td>
                        <td className="px-4 py-3">
                          {fullyGraded ? (
                            <span className="text-forest-600 dark:text-forest-500 text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Graded</span>
                          ) : student.graded_count > 0 ? (
                            <span className="text-brass-600 dark:text-brass-400 text-xs font-semibold flex items-center gap-1">
                              <Clock3 className="w-3.5 h-3.5" strokeWidth={1.75} /> {student.graded_count}/{student.total_questions} graded
                            </span>
                          ) : (
                            <span className="text-ink-400 dark:text-ink-500 text-xs">Not graded</span>
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
          {/* Stats Grid — uniform navy, brass icons; "To Grade" flags oxbrick when action is needed */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Students', value: totalStudents, Icon: GraduationCap, tone: 'text-brass-400' },
              { label: 'Materials', value: totalMaterials, Icon: BookOpen, tone: 'text-brass-400' },
              { label: 'Assignments', value: totalAssignments, Icon: ClipboardList, tone: 'text-brass-400' },
              { label: 'Submissions', value: totalSubmissions, Icon: Inbox, tone: 'text-brass-400' },
              { label: 'To Grade', value: totalUngraded, Icon: totalUngraded > 0 ? PenSquare : CheckCircle2, tone: totalUngraded > 0 ? 'text-oxbrick-400' : 'text-forest-400' },
            ].map(({ label, value, Icon, tone }) => (
              <div key={label} className="bg-navy-700 rounded-2xl p-5 shadow-card text-white">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-navy-200">{label}</p>
                  <Icon className={`w-5 h-5 ${tone}`} strokeWidth={1.75} />
                </div>
                <p className="text-3xl md:text-4xl font-display font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Pending Tasks Alert */}
          {pendingTasks.length > 0 && (
            <div className="bg-brass-50 dark:bg-brass-700/20 border border-brass-200 dark:border-brass-700/40 rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-brass-600 dark:text-brass-400 flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h3 className="font-semibold text-brass-800 dark:text-brass-300">Pending Tasks</h3>
                  <ul className="text-sm text-brass-700 dark:text-brass-400 mt-1 space-y-1">
                    {pendingTasks.map((task, idx) => (
                      <li key={idx}>• {task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Overview */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Assignment Overview
            </h3>
            {assignments.length === 0 ? (
              <p className="text-ink-400 dark:text-ink-500 text-sm">No assignments created yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map(ass => {
                  const stats = assignmentStats[ass.id] || { submitted: 0, graded: 0 };
                  const allGraded = stats.submitted > 0 && stats.submitted === stats.graded;
                  return (
                    <div key={ass.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ass.icon || '📝'}</span>
                        <div>
                          <p className="font-medium text-navy-800 dark:text-ink-100">{ass.title}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-300">
                            {stats.submitted} submitted · {stats.graded} graded
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {allGraded ? (
                          <span className="text-forest-700 dark:text-forest-500 text-xs font-semibold bg-forest-50 dark:bg-forest-700/20 px-3 py-1 rounded-full">All Graded</span>
                        ) : stats.submitted > 0 ? (
                          <span className="text-brass-700 dark:text-brass-400 text-xs font-semibold bg-brass-50 dark:bg-brass-700/20 px-3 py-1 rounded-full">{stats.submitted - stats.graded} to grade</span>
                        ) : (
                          <span className="text-ink-400 dark:text-ink-500 text-xs">No submissions</span>
                        )}
                        <button
                          onClick={() => setTab('assignments')}
                          className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline transition-colors"
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
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Quiz Overview
            </h3>

            {quizzes.length === 0 ? (
              <p className="text-ink-400 dark:text-ink-500 text-sm">No quizzes created yet.</p>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      {quiz.is_published
                        ? <CheckCircle2 className="w-5 h-5 text-forest-600 dark:text-forest-500 flex-shrink-0" strokeWidth={1.75} />
                        : <Clock3 className="w-5 h-5 text-brass-500 flex-shrink-0" strokeWidth={1.75} />}
                      <div>
                        <p className="font-medium text-navy-800 dark:text-ink-100">{quiz.title}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-300">
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {quiz.is_published && (
                        <>
                          <button
                            onClick={() => fetchQuizSubmissions(quiz.id)}
                            className="bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors"
                          >
                            Submissions
                          </button>
                          <button
                            onClick={() => fetchQuizResults(quiz.id)}
                            className="bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-forest-100 dark:hover:bg-forest-700/30 transition-colors"
                          >
                            Results
                          </button>
                        </>
                      )}
                      {!quiz.is_published && (
                        <button
                          onClick={() => publishQuiz(quiz.id)}
                          className="bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-forest-100 dark:hover:bg-forest-700/30 transition-colors"
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
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Upcoming Deadlines
              </h3>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-ink-400 dark:text-ink-500 text-sm">No upcoming deadlines.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingDeadlines.map(a => (
                    <li key={a.id} className="flex items-center justify-between">
                      <span className="font-medium text-navy-800 dark:text-ink-100">{a.title}</span>
                      <span className="text-sm text-oxbrick-600 dark:text-oxbrick-500">{new Date(a.deadline).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="text-xl font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Recent Announcements
              </h3>
              {recentAnnouncements.length === 0 ? (
                <p className="text-ink-400 dark:text-ink-500 text-sm">No announcements yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentAnnouncements.map(a => (
                    <li key={a.id}>
                      <p className="font-medium text-navy-800 dark:text-ink-100">{a.title}</p>
                      <p className="text-sm text-ink-500 dark:text-ink-300">{a.content.slice(0, 80)}...</p>
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
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={BookOpen} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Upload Material</h2>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Title *</label>
                <div className="relative">
                  <TitleFieldIcon />
                  <input type="text" placeholder="e.g. Week 1 Lesson" value={matTitle} onChange={(e) => setMatTitle(e.target.value)}
                    className={inputBase} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Description</label>
                <textarea placeholder="Brief description..." value={matDesc} onChange={(e) => setMatDesc(e.target.value)}
                  className={inputPlain} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Type</label>
                  <select value={matType} onChange={(e) => setMatType(e.target.value)} className={inputPlain}>
                    <option value="pdf">Document</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">File</label>
                  <input type="file" onChange={(e) => setMatFile(e.target.files[0])}
                    className="block w-full text-sm text-ink-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brass-50 dark:file:bg-brass-700/20 file:text-brass-700 dark:file:text-brass-400 hover:file:bg-brass-100 dark:hover:file:bg-brass-700/30 transition-colors cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setMatIcon(emoji)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border transition-colors ${
                        matIcon === emoji ? 'border-brass-500 bg-brass-50 dark:bg-brass-700/20' : 'border-ink-200 dark:border-navy-600 hover:border-ink-300 hover:bg-ink-50 dark:hover:bg-navy-700'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Voice instruction</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      if (isRecordingMat) { stopRecording(); setIsRecordingMat(false); }
                      else { setIsRecordingMat(true); startRecording(blob => { setMatAudio(blob); setMatAudioName('instruction.webm'); }); }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                      isRecordingMat ? 'bg-oxbrick-600 text-white' : 'bg-ink-100 dark:bg-navy-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-navy-600'
                    }`}
                  >
                    {isRecordingMat ? <Square className="w-4 h-4" strokeWidth={1.75} /> : <Mic className="w-4 h-4" strokeWidth={1.75} />}
                    {isRecordingMat ? 'Stop Recording' : 'Record Instruction'}
                  </button>
                  {matAudio && <span className="text-forest-600 dark:text-forest-500 text-sm font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-forest-500"></span> Recording attached</span>}
                </div>
              </div>
              <button type="submit" className={primaryBtn}>
                Upload Material
              </button>
            </form>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materials.map(m => (
              <div key={m.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-5 hover:shadow-elevated transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-navy-800 dark:text-ink-100 truncate">{m.title}</h3>
                  <span className="text-3xl">{m.icon || '📚'}</span>
                </div>
                {m.description && <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">{m.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-ink-100 dark:bg-navy-700 px-2 py-1 rounded-full text-ink-600 dark:text-ink-300 font-medium">{m.type}</span>
                  {m.file_url && (
                    <a href={m.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">
                      Open
                    </a>
                  )}
                </div>
                {m.audio_url && (
                  <div className="mt-3">
                    <p className="text-xs text-ink-500 dark:text-ink-300 mb-1 flex items-center gap-1"><Mic className="w-3.5 h-3.5" strokeWidth={1.75} /> Voice instruction</p>
                    <audio controls src={m.audio_url} className="w-full rounded-lg" />
                  </div>
                )}
                <button onClick={() => deleteMaterial(m.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm mt-3 font-medium hover:underline">Delete</button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white dark:bg-navy-800 rounded-3xl border border-dashed border-ink-300 dark:border-navy-600">
                <Inbox className="w-10 h-10 text-ink-300 dark:text-ink-500 mx-auto" strokeWidth={1.5} />
                <p className="text-ink-400 dark:text-ink-500 mt-4 text-base font-medium">No materials uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={ClipboardList} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Create Assignment</h2>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Title *</label>
                <div className="relative">
                  <TitleFieldIcon />
                  <input type="text" placeholder="Homework 1" value={assTitle} onChange={(e) => setAssTitle(e.target.value)}
                    className={inputBase} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Description</label>
                <textarea placeholder="Instructions..." value={assDesc} onChange={(e) => setAssDesc(e.target.value)}
                  className={inputPlain} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Deadline</label>
                  <input type="datetime-local" value={assDeadline} onChange={(e) => setAssDeadline(e.target.value)}
                    className={inputPlain} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">File</label>
                  <input type="file" onChange={(e) => setAssFile(e.target.files[0])}
                    className="block w-full text-sm text-ink-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brass-50 dark:file:bg-brass-700/20 file:text-brass-700 dark:file:text-brass-400 hover:file:bg-brass-100 dark:hover:file:bg-brass-700/30 transition-colors cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setAssIcon(emoji)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border transition-colors ${
                        assIcon === emoji ? 'border-brass-500 bg-brass-50 dark:bg-brass-700/20' : 'border-ink-200 dark:border-navy-600 hover:border-ink-300 hover:bg-ink-50 dark:hover:bg-navy-700'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Voice instruction</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      if (isRecordingAss) { stopRecording(); setIsRecordingAss(false); }
                      else { setIsRecordingAss(true); startRecording(blob => { setAssAudio(blob); setAssAudioName('instruction.webm'); }); }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                      isRecordingAss ? 'bg-oxbrick-600 text-white' : 'bg-ink-100 dark:bg-navy-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-navy-600'
                    }`}
                  >
                    {isRecordingAss ? <Square className="w-4 h-4" strokeWidth={1.75} /> : <Mic className="w-4 h-4" strokeWidth={1.75} />}
                    {isRecordingAss ? 'Stop Recording' : 'Record Instruction'}
                  </button>
                  {assAudio && <span className="text-forest-600 dark:text-forest-500 text-sm font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-forest-500"></span> Recording attached</span>}
                </div>
              </div>
              <button type="submit" className={primaryBtn}>
                Create Assignment
              </button>
            </form>
          </div>

          {assignments.map(a => {
            const stats = assignmentStats[a.id] || { submitted: 0, graded: 0 };
            return (
              <div key={a.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-navy-800 dark:text-white flex items-center gap-2">
                      <span className="text-3xl">{a.icon || '📝'}</span> {a.title}
                    </h3>
                    {a.description && <p className="text-sm text-ink-500 dark:text-ink-300 mt-2">{a.description}</p>}
                    {a.deadline && (
                      <p className="text-xs font-semibold text-oxbrick-600 dark:text-oxbrick-500 mt-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} /> Due: {new Date(a.deadline).toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-ink-500 dark:text-ink-300 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" strokeWidth={1.75} /> {stats.submitted} submitted</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${stats.submitted === stats.graded && stats.submitted > 0 ? 'text-forest-600 dark:text-forest-500' : 'text-brass-600 dark:text-brass-400'}`}>
                        <PenSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> {stats.graded} graded
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button onClick={() => viewSubmissions(a.id)} className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">Submissions</button>
                    <button onClick={() => deleteAssignment(a.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-semibold hover:underline">Delete</button>
                  </div>
                </div>
                {a.audio_url && (
                  <div className="mt-4">
                    <p className="text-xs text-ink-500 dark:text-ink-300 mb-1 flex items-center gap-1"><Mic className="w-3.5 h-3.5" strokeWidth={1.75} /> Voice instruction</p>
                    <audio controls src={a.audio_url} className="w-full rounded-lg" />
                  </div>
                )}
                {a.file_url && (
                  <a href={a.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline mt-3 inline-flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" strokeWidth={1.75} /> Download Assignment File
                  </a>
                )}
                {selectedAss === a.id && (
                  <div className="mt-5 border-t border-ink-200 dark:border-navy-600 pt-4">
                    <h4 className="text-base font-semibold text-navy-800 dark:text-ink-100 mb-3">Submissions</h4>
                    {submissions.length === 0 ? (
                      <p className="text-sm text-ink-400 dark:text-ink-500">No submissions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map(s => (
                          <div key={s.id} className={`bg-ink-50 dark:bg-navy-700 rounded-xl p-4 border-l-4 ${s.grade ? 'border-forest-500' : 'border-brass-500'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-navy-800 dark:text-ink-100">{s.students?.display_name || 'Student'}</span>
                                {s.file_url && (
                                  <a href={s.file_url} target="_blank" rel="noreferrer" className="text-brass-600 dark:text-brass-400 text-sm underline">View File</a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  type="text"
                                  placeholder="Grade"
                                  value={grades[s.id]?.grade || ''}
                                  onChange={(e) => setGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], grade: e.target.value } }))}
                                  className="w-20 px-2 py-1 border border-ink-200 dark:border-navy-600 rounded-lg text-sm bg-white dark:bg-navy-800 text-navy-800 dark:text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Feedback"
                                  value={grades[s.id]?.feedback || ''}
                                  onChange={(e) => setGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))}
                                  className="flex-1 min-w-[120px] px-2 py-1 border border-ink-200 dark:border-navy-600 rounded-lg text-sm bg-white dark:bg-navy-800 text-navy-800 dark:text-white"
                                />
                                <button
                                  onClick={() => handleGrade(s.id)}
                                  className="bg-brass-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-brass-700 transition-colors"
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
            <div className="text-center py-20 bg-white dark:bg-navy-800 rounded-3xl border border-dashed border-ink-300 dark:border-navy-600">
              <Inbox className="w-10 h-10 text-ink-300 dark:text-ink-500 mx-auto" strokeWidth={1.5} />
              <p className="text-ink-400 dark:text-ink-500 mt-4 text-base font-medium">No assignments created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Megaphone} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Post Announcement</h2>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Title *</label>
                <div className="relative">
                  <TitleFieldIcon />
                  <input type="text" placeholder="Important update" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                    className={inputBase} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Content *</label>
                <textarea placeholder="Write your announcement here..." value={annContent} onChange={(e) => setAnnContent(e.target.value)}
                  className={inputPlain} rows={3} required />
              </div>
              <button type="submit" className={primaryBtn}>
                Post Announcement
              </button>
            </form>
          </div>
          {announcements.map(a => (
            <div key={a.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6 hover:shadow-elevated transition-shadow duration-200">
              <h3 className="font-semibold text-xl text-navy-800 dark:text-white">{a.title}</h3>
              <p className="text-sm text-ink-600 dark:text-ink-300 mt-2">{a.content}</p>
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-3">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-navy-800 rounded-3xl border border-dashed border-ink-300 dark:border-navy-600">
              <Inbox className="w-10 h-10 text-ink-300 dark:text-ink-500 mx-auto" strokeWidth={1.5} />
              <p className="text-ink-400 dark:text-ink-500 mt-4 text-base font-medium">No announcements posted yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={GraduationCap} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Add Student</h2>
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-300 mb-6">New students will be added to the currently selected class.</p>
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Student Number *</label>
                <input type="text" placeholder="S001" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)}
                  className={inputPlain} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Full Name *</label>
                <input type="text" placeholder="Alice Phiri" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  className={inputPlain} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Password *</label>
                <input type="password" placeholder="Min. 4 characters" value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)}
                  className={inputPlain} required />
              </div>
              <div className="sm:col-span-3 mt-2">
                <button type="submit" className={primaryBtn}>
                  Add Student
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 overflow-hidden">
            <div className="p-6 border-b border-ink-200 dark:border-navy-600">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-brass-500" strokeWidth={1.75} /> Student List
              </h2>
              <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">All students enrolled in <span className="font-semibold text-navy-700 dark:text-ink-100">{selectedClassName}</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy-700">
                    <th className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider">Number</th>
                    <th className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-navy-700">
                  {students.map((s, index) => (
                    <tr key={s.id} className={`hover:bg-ink-50 dark:hover:bg-navy-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-navy-800' : 'bg-ink-50/50 dark:bg-navy-800/60'}`}>
                      <td className="px-6 py-4 text-sm font-data text-ink-700 dark:text-ink-300">{s.student_number}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-navy-800 dark:text-ink-100">{s.display_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-300 px-3 py-1 rounded-full text-xs font-semibold">
                          {selectedClassName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => editStudent(s.id)} className="text-brass-600 hover:text-brass-700 transition-colors">
                            <Pencil className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <button onClick={() => deleteStudent(s.id)} className="text-oxbrick-600 hover:text-oxbrick-700 transition-colors">
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-ink-400 dark:text-ink-500 text-base font-medium">
                        <GraduationCap className="w-9 h-9 mx-auto mb-2 text-ink-300 dark:text-ink-500" strokeWidth={1.5} />
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
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Brain} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Create a New Quiz</h2>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-5 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Quiz Title *</label>
                  <input type="text" placeholder="e.g. Science Revision" value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className={inputPlain} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Description</label>
                  <input type="text" placeholder="Optional description" value={quizDesc}
                    onChange={(e) => setQuizDesc(e.target.value)}
                    className={inputPlain} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Total Points</label>
                  <input type="number" placeholder="e.g. 100" value={quizTotalPoints}
                    onChange={(e) => setQuizTotalPoints(e.target.value)}
                    className={inputPlain} />
                </div>
              </div>

              {/* Dynamic Questions */}
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="border border-ink-200 dark:border-navy-600 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-navy-800 dark:text-ink-100">Question {qIdx + 1}</h3>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qIdx)}
                        className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Remove</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <input type="text" placeholder="Enter question text" value={q.text}
                        onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500" required />
                    </div>
                    <div>
                      <input type="number" placeholder="Points" value={q.points || ''}
                        onChange={(e) => updateQuestion(qIdx, 'points', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-ink-600 dark:text-ink-300">Type:</label>
                    <select value={q.type}
                      onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white">
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="text">Text Answer</option>
                    </select>
                  </div>

                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-ink-600 dark:text-ink-300">Options (mark the correct one)</p>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <input type="radio" name={`correct-${qIdx}`}
                            checked={q.correctIndex === oIdx}
                            onChange={() => setCorrectOption(qIdx, oIdx)}
                            className="w-4 h-4 text-brass-600 border-ink-300 focus:ring-brass-500" />
                          <input type="text" value={opt}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500" required />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <p className="text-sm text-ink-500 dark:text-ink-300 italic">Student will type their answer.</p>
                  )}
                </div>
              ))}

              <button type="button" onClick={addQuestion}
                className="text-brass-600 dark:text-brass-400 font-semibold text-sm hover:underline">
                + Add Another Question
              </button>

              <div>
                <button type="submit" className={primaryBtn}>
                  Create Quiz
                </button>
              </div>
            </form>
          </div>

          {/* Existing Quizzes List */}
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white mb-6">My Quizzes</h2>
            {quizzes.length === 0 ? (
              <div className="text-center py-10">
                <Inbox className="w-9 h-9 text-ink-300 dark:text-ink-500 mx-auto" strokeWidth={1.5} />
                <p className="text-ink-400 dark:text-ink-500 mt-2 text-sm">No quizzes created yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-ink-200 dark:border-navy-600 rounded-2xl hover:bg-ink-50 dark:hover:bg-navy-700/50 transition-colors">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-navy-800 dark:text-ink-100">{quiz.title}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">
                        {quiz.is_published ? (
                          <span className="text-forest-600 dark:text-forest-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Published</span>
                        ) : (
                          <span className="text-brass-600 dark:text-brass-400 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" strokeWidth={1.75} /> Draft</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {quiz.is_published && (
                        <>
                          <button onClick={() => fetchQuizSubmissions(quiz.id)}
                            className="text-brass-600 dark:text-brass-400 text-sm font-semibold hover:underline">
                            Submissions
                          </button>
                          <button onClick={() => fetchQuizResults(quiz.id)}
                            className="text-forest-600 dark:text-forest-500 text-sm font-semibold hover:underline">
                            Results
                          </button>
                        </>
                      )}
                      {!quiz.is_published && (
                        <button onClick={() => publishQuiz(quiz.id)}
                          className="text-forest-600 dark:text-forest-500 text-sm font-semibold hover:underline">
                          Publish
                        </button>
                      )}
                      <button onClick={() => deleteQuiz(quiz.id)}
                        className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-semibold hover:underline">
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
    </Layout>
  );
}
