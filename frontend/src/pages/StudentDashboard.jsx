import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/';

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
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome, {user?.display_name || 'Student'}!
        </h1>
        <p className="text-gray-500 mt-1">Access your learning materials, submit assignments, and stay updated.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
          msgType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {msg}
        </div>
      )}

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📚</span> Learning Materials
          </h2>
          {materials.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📭</span>
              <p className="text-gray-400 mt-2">No materials available yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials.map((m) => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 truncate">{m.title}</h3>
                    <span className="text-2xl">{m.icon || '📚'}</span>
                  </div>
                  {m.description && <p className="text-sm text-gray-500 mb-3">{m.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{m.type}</span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-medium hover:underline">
                        Open
                      </a>
                    )}
                  </div>
                  {m.audio_url && (
                    <div className="mt-3">
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
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📝</span> Assignments
          </h2>
          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📋</span>
              <p className="text-gray-400 mt-2">No assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((ass) => (
                <div key={ass.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="text-2xl">{ass.icon || '📝'}</span> {ass.title}
                    </h3>
                    {submissionStatus[ass.id] === 'submitted' && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">✅ Submitted</span>
                    )}
                  </div>
                  {ass.description && <p className="text-sm text-gray-500 mb-3">{ass.description}</p>}
                  {ass.deadline && <p className="text-xs text-red-500 mb-2">Due: {new Date(ass.deadline).toLocaleString()}</p>}
                  {ass.file_url && (
                    <a href={ass.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-medium hover:underline block mb-3">
                      Download Assignment File
                    </a>
                  )}
                  {ass.audio_url && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">🎤 Voice instruction</p>
                      <audio controls src={ass.audio_url} className="w-full rounded-lg" />
                    </div>
                  )}
                  {submissionStatus[ass.id] !== 'submitted' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 border-t pt-3">
                      <input
                        type="file"
                        onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [ass.id]: e.target.files[0] }))}
                        className="text-sm"
                      />
                      <button
                        onClick={() => handleSubmit(ass.id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm transition text-sm"
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
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📢</span> Announcements
          </h2>
          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📢</span>
              <p className="text-gray-400 mt-2">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}