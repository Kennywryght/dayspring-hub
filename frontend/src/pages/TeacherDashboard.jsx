import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

const EMOJI_LIST = ['🐼', '📄', '▶️', '🎨', '✏️', '📖', '🌍', '🧮', '🔬', '🎵', '🐱', '🚀', '🍎', '🌈', '🎲', '📚'];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('materials');

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

  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const [students, setStudents] = useState([]);
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPass, setNewStudentPass] = useState('');

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
    if (selectedClassId) fetchData();
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
    if (assRes.ok) setAssignments(await assRes.json());
    if (annRes.ok) setAnnouncements(await annRes.json());
    if (studRes.ok) setStudents(await studRes.json());
  };

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

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
    } else showMsg('Upload failed', 'error');
  };

  const deleteMaterial = async (id) => {
    if (!confirm('Delete this material?')) return;
    await fetch(`${API_URL}materials/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.access_token}` }
    });
    fetchData();
  };

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
    } else showMsg('Creation failed', 'error');
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
      setSubmissions(await res.json());
      setSelectedAss(assignmentId);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}announcements/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
      body: JSON.stringify({ title: annTitle, content: annContent, class_id: selectedClassId }),
    });
    if (res.ok) { showMsg('Announcement posted'); setAnnTitle(''); setAnnContent(''); fetchData(); }
    else showMsg('Failed', 'error');
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
    if (res.ok) { showMsg('Student added'); setNewStudentNumber(''); setNewStudentName(''); setNewStudentPass(''); fetchData(); }
    else showMsg('Failed to add student', 'error');
  };

  const navLinks = [
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
    { label: 'Students', onClick: () => setTab('students') },
  ];

  // Get selected class name for display
  const selectedClassName = myClasses.find(c => c.id === selectedClassId)?.name || 'Unknown';

  return (
    <Layout role="teacher" navLinks={navLinks}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
            <span className="text-4xl">👩‍🏫</span> Teacher Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Manage materials, assignments, and students for your class.</p>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white shadow-sm font-semibold"
          >
            {myClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
            ))}
          </select>
        </div>
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
          {/* Upload Material Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">📚</div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Material</h2>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  </div>
                  <input type="text" placeholder="e.g. Week 1 Lesson" value={matTitle} onChange={(e) => setMatTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea placeholder="Brief description..." value={matDesc} onChange={(e) => setMatDesc(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select value={matType} onChange={(e) => setMatType(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white">
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">File</label>
                  <input type="file" onChange={(e) => setMatFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setMatIcon(emoji)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border-2 transition ${
                        matIcon === emoji ? 'border-blue-500 bg-blue-50 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Voice instruction</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      if (isRecordingMat) { stopRecording(); setIsRecordingMat(false); }
                      else { setIsRecordingMat(true); startRecording(blob => { setMatAudio(blob); setMatAudioName('instruction.webm'); }); }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
                      isRecordingMat ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isRecordingMat ? '⏹️ Stop Recording' : '🎤 Record Instruction'}
                  </button>
                  {matAudio && <span className="text-green-600 text-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Recording attached</span>}
                </div>
              </div>
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                Upload Material
              </button>
            </form>
          </div>

          {/* Materials Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materials.map(m => (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
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
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">🎤 Voice instruction</p>
                    <audio controls src={m.audio_url} className="w-full rounded-lg" />
                  </div>
                )}
                <button onClick={() => deleteMaterial(m.id)} className="text-red-500 text-sm mt-3 font-medium hover:underline">Delete</button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <span className="text-6xl">📭</span>
                <p className="text-gray-400 mt-4 text-lg font-medium">No materials uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg">📝</div>
              <h2 className="text-2xl font-bold text-gray-900">Create Assignment</h2>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  </div>
                  <input type="text" placeholder="Homework 1" value={assTitle} onChange={(e) => setAssTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea placeholder="Instructions..." value={assDesc} onChange={(e) => setAssDesc(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
                  <input type="datetime-local" value={assDeadline} onChange={(e) => setAssDeadline(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white/80" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">File</label>
                  <input type="file" onChange={(e) => setAssFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setAssIcon(emoji)}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl border-2 transition ${
                        assIcon === emoji ? 'border-purple-500 bg-purple-50 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Voice instruction</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      if (isRecordingAss) { stopRecording(); setIsRecordingAss(false); }
                      else { setIsRecordingAss(true); startRecording(blob => { setAssAudio(blob); setAssAudioName('instruction.webm'); }); }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
                      isRecordingAss ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isRecordingAss ? '⏹️ Stop Recording' : '🎤 Record Instruction'}
                  </button>
                  {assAudio && <span className="text-green-600 text-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Recording attached</span>}
                </div>
              </div>
              <button type="submit" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                Create Assignment
              </button>
            </form>
          </div>

          {assignments.map(a => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <span className="text-3xl">{a.icon || '📝'}</span> {a.title}
                  </h3>
                  {a.description && <p className="text-sm text-gray-500 mt-2">{a.description}</p>}
                  {a.deadline && (
                    <p className="text-xs font-semibold text-red-500 mt-2 flex items-center gap-1">
                      <span>📅</span> Due: {new Date(a.deadline).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => viewSubmissions(a.id)} className="text-blue-600 text-sm font-semibold hover:underline">Submissions</button>
                  <button onClick={() => deleteAssignment(a.id)} className="text-red-500 text-sm font-semibold hover:underline">Delete</button>
                </div>
              </div>
              {a.audio_url && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-1">🎤 Voice instruction</p>
                  <audio controls src={a.audio_url} className="w-full rounded-lg" />
                </div>
              )}
              {a.file_url && (
                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-semibold hover:underline mt-3 inline-block">
                  📎 Download Assignment File
                </a>
              )}
              {selectedAss === a.id && (
                <div className="mt-5 border-t pt-4">
                  <h4 className="text-base font-semibold text-gray-700 mb-3">Submissions</h4>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-gray-400">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                          <span className="text-sm font-medium">{s.students?.display_name || 'Student'}</span>
                          {s.file_url ? (
                            <a href={s.file_url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm font-medium hover:underline">View File</a>
                          ) : (
                            <span className="text-xs text-gray-400">No file</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📋</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No assignments created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg">📢</div>
              <h2 className="text-2xl font-bold text-gray-900">Post Announcement</h2>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  </div>
                  <input type="text" placeholder="Important update" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                <textarea placeholder="Write your announcement here..." value={annContent} onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400" rows={3} required />
              </div>
              <button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                Post Announcement
              </button>
            </form>
          </div>
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
              <h3 className="font-bold text-xl text-gray-900">{a.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{a.content}</p>
              <p className="text-xs text-gray-400 mt-3">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📢</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No announcements posted yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white text-2xl shadow-lg">👩‍🎓</div>
              <h2 className="text-2xl font-bold text-gray-900">Add Student</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">New students will be added to the currently selected class.</p>
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student Number *</label>
                <input type="text" placeholder="S001" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 bg-white/80" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input type="text" placeholder="Alice Phiri" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 bg-white/80" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <input type="password" placeholder="Min. 4 characters" value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 bg-white/80" required />
              </div>
              <div className="sm:col-span-3 mt-2">
                <button type="submit" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95">
                  Add Student
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">📋</span> Student List
              </h2>
              <p className="text-sm text-gray-500 mt-1">All students enrolled in <span className="font-semibold">{selectedClassName}</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Number</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, index) => (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">{s.student_number}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{s.display_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {selectedClassName}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center text-gray-400 text-lg font-medium">
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