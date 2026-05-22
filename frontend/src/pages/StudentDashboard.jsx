import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('materials');

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
      assData.forEach(async (ass) => {
        const subRes = await fetch(`${API_URL}submissions/mine/${ass.id}/`, { headers });
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissionStatus(prev => ({ ...prev, [ass.id]: subData?.id ? 'submitted' : null }));
        }
      });
    }
    if (annRes.ok) setAnnouncements(await annRes.json());
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

  const navLinks = [
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
  ];

  return (
    <Layout role="student" navLinks={navLinks}>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
          <span className="text-4xl">🎓</span>
          Welcome, {user?.display_name || 'Student'}!
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Access your learning materials, submit assignments, and stay updated.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
          msgType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {msgType === 'error' ? '⚠️' : '✅'} {msg}
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">📚</div>
            <h2 className="text-2xl font-bold text-gray-900">Learning Materials</h2>
          </div>
          {materials.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📭</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No materials available yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 truncate">{m.title}</h3>
                    <span className="text-3xl">{m.icon || '📚'}</span>
                  </div>
                  {m.description && <p className="text-sm text-gray-500 mb-3">{m.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">{m.type}</span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-semibold hover:underline">
                        Open
                      </a>
                    )}
                  </div>
                  {m.audio_url && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">🎤 Voice instruction</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📋</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((ass) => (
                <div key={ass.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <span className="text-3xl">{ass.icon || '📝'}</span> {ass.title}
                    </h3>
                    {submissionStatus[ass.id] === 'submitted' && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Submitted
                      </span>
                    )}
                  </div>
                  {ass.description && <p className="text-sm text-gray-500 mb-3">{ass.description}</p>}
                  {ass.deadline && (
                    <p className="text-xs font-semibold text-red-500 mb-3 flex items-center gap-1">
                      <span>📅</span> Due: {new Date(ass.deadline).toLocaleString()}
                    </p>
                  )}
                  {ass.file_url && (
                    <a href={ass.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-semibold hover:underline block mb-3">
                      📎 Download Assignment File
                    </a>
                  )}
                  {ass.audio_url && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">🎤 Voice instruction</p>
                      <audio controls src={ass.audio_url} className="w-full rounded-lg" />
                    </div>
                  )}
                  {submissionStatus[ass.id] !== 'submitted' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 border-t pt-4">
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
            <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📢</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                  <h3 className="font-bold text-xl text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-3">{new Date(a.created_at).toLocaleString()}</p>
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