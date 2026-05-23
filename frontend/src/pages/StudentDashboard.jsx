import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';   // new
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateNotifications } = useNotifications();   // new
  const [tab, setTab] = useState('home');

  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [tab, user]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${user.access_token}` };
    const [matRes, assRes, annRes] = await Promise.all([
      fetch(`${API_URL}materials/`, { headers }),
      fetch(`${API_URL}assignments/`, { headers }),
      fetch(`${API_URL}announcements/`, { headers }),
    ]);
    if (matRes.ok) setMaterials(await matRes.json());
    if (assRes.ok) {
      const assData = await assRes.json();
      setAssignments(assData);
      // Update notification badge for new assignments
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
      // Update notification badge for new announcements
      updateNotifications('student', annData, 'announcements');
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

  // Home tab data
  const totalAssignments = assignments.length;
  const submittedCount = Object.values(submissionStatus).filter(s => s === 'submitted').length;
  const upcomingDeadlines = assignments
    .filter(a => a.deadline && new Date(a.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  const recentMaterials = materials.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 2);

  const navLinks = [
    { label: 'Home', onClick: () => setTab('home') },
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
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

      {/* ===== HOME TAB ===== */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <p className="text-3xl md:text-4xl font-black">{totalAssignments}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">Submitted</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl md:text-4xl font-black">{submittedCount}/{totalAssignments}</p>
            </div>
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

      {/* Animations */}
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