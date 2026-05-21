import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api/v1/';

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

  return (
    <Layout role="teacher" navLinks={navLinks}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage materials, assignments, and students for your class.</p>
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white shadow-sm"
        >
          {myClasses.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
          ))}
        </select>
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
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📚</span> Upload Material
            </h2>
            <form onSubmit={handleUploadMaterial} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" placeholder="e.g. Week 1 Lesson" value={matTitle} onChange={(e) => setMatTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea placeholder="Brief description..." value={matDesc} onChange={(e) => setMatDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={matType} onChange={(e) => setMatType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setMatIcon(emoji)}
                      className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg border-2 transition ${
                        matIcon === emoji ? 'border-blue-500 bg-blue-50 scale-110' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice instruction</label>
                <button type="button"
                  onClick={() => {
                    if (isRecordingMat) { stopRecording(); setIsRecordingMat(false); }
                    else { setIsRecordingMat(true); startRecording(blob => { setMatAudio(blob); setMatAudioName('instruction.webm'); }); }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
                    isRecordingMat ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isRecordingMat ? '⏹️ Stop Recording' : '🎤 Record Instruction'}
                </button>
                {matAudio && <span className="ml-2 text-green-600 text-sm">✅ Recording attached</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input type="file" onChange={(e) => setMatFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition">
                Upload Material
              </button>
            </form>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materials.map(m => (
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
                <button onClick={() => deleteMaterial(m.id)} className="text-red-500 text-sm mt-3 hover:underline">Delete</button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 mt-2">No materials uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📝</span> Create Assignment
            </h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" placeholder="Homework 1" value={assTitle} onChange={(e) => setAssTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea placeholder="Instructions..." value={assDesc} onChange={(e) => setAssDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input type="datetime-local" value={assDeadline} onChange={(e) => setAssDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setAssIcon(emoji)}
                      className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg border-2 transition ${
                        assIcon === emoji ? 'border-purple-500 bg-purple-50 scale-110' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice instruction</label>
                <button type="button"
                  onClick={() => {
                    if (isRecordingAss) { stopRecording(); setIsRecordingAss(false); }
                    else { setIsRecordingAss(true); startRecording(blob => { setAssAudio(blob); setAssAudioName('instruction.webm'); }); }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
                    isRecordingAss ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isRecordingAss ? '⏹️ Stop Recording' : '🎤 Record Instruction'}
                </button>
                {assAudio && <span className="ml-2 text-green-600 text-sm">✅ Recording attached</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input type="file" onChange={(e) => setAssFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              </div>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition">
                Create Assignment
              </button>
            </form>
          </div>

          {assignments.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="text-2xl">{a.icon || '📝'}</span> {a.title}
                  </h3>
                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                  {a.deadline && <p className="text-xs text-red-500 mt-1">Due: {new Date(a.deadline).toLocaleString()}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewSubmissions(a.id)} className="text-blue-600 text-sm font-medium hover:underline">Submissions</button>
                  <button onClick={() => deleteAssignment(a.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
              </div>
              {a.audio_url && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">🎤 Voice instruction</p>
                  <audio controls src={a.audio_url} className="w-full rounded-lg" />
                </div>
              )}
              {a.file_url && (
                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-medium hover:underline block mt-2">
                  Download Assignment File
                </a>
              )}
              {selectedAss === a.id && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Submissions</h4>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-gray-400">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <span className="text-sm font-medium">{s.students?.display_name || 'Student'}</span>
                          {s.file_url ? (
                            <a href={s.file_url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline">View File</a>
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
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📋</span>
              <p className="text-gray-400 mt-2">No assignments created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📢</span> Post Announcement
            </h2>
            <form onSubmit={handlePostAnnouncement} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" placeholder="Important update" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea placeholder="Write your announcement here..." value={annContent} onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" rows={3} required />
              </div>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition">
                Post Announcement
              </button>
            </form>
          </div>
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-lg">{a.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{a.content}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📢</span>
              <p className="text-gray-400 mt-2">No announcements posted yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">👩‍🎓</span> Add Student
            </h2>
            <p className="text-sm text-gray-500 mb-4">New students will be added to the currently selected class.</p>
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Number *</label>
                <input type="text" placeholder="S001" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" placeholder="Alice Phiri" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" placeholder="Min. 4 characters" value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition">
                  Add Student
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">📋</span> Student List
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-sm font-medium text-gray-600">Number</th>
                    <th className="p-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="p-3 text-sm font-medium text-gray-600">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-3 text-sm">{s.student_number}</td>
                      <td className="p-3 text-sm font-medium">{s.display_name}</td>
                      <td className="p-3 text-sm text-gray-500">{s.grade || '-'}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" className="p-6 text-center text-gray-400">No students enrolled in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}