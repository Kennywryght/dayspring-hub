import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

// Optional click sound
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const playClick = useClickSound();
  const [tab, setTab] = useState('classes');

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [stats, setStats] = useState({});

  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [tab]);

  const headers = {
    Authorization: `Bearer ${user?.access_token || ''}`,
  };

  const fetchAll = async () => {
    if (!user?.access_token) return;
    const [cRes, sRes, tRes, aRes, stRes] = await Promise.all([
      fetch(`${API_URL}admin/classes/`, { headers }),
      fetch(`${API_URL}admin/subjects/`, { headers }),
      fetch(`${API_URL}admin/teachers/`, { headers }),
      fetch(`${API_URL}admin/assignments/`, { headers }),
      fetch(`${API_URL}admin/stats/`, { headers }),
    ]);
    if (cRes.ok) setClasses(await cRes.json());
    if (sRes.ok) setSubjects(await sRes.json());
    if (tRes.ok) setTeachers(await tRes.json());
    if (aRes.ok) setAssignmentsList(await aRes.json());
    if (stRes.ok) setStats(await stRes.json());
  };

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const addClass = async () => {
    if (!newClassName.trim()) return showMsg('Class name is required', 'error');
    const params = new URLSearchParams({ name: newClassName });
    if (newClassGrade.trim()) params.append('grade', newClassGrade);
    const res = await fetch(`${API_URL}admin/classes/?${params}`, { method: 'POST', headers });
    if (res.ok) {
      showMsg('Class created');
      setNewClassName('');
      setNewClassGrade('');
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed to create class', 'error');
    }
  };

  const deleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    const res = await fetch(`${API_URL}admin/classes/${id}/`, { method: 'DELETE', headers });
    if (res.ok) { showMsg('Class deleted'); fetchAll(); }
    else showMsg('Failed to delete class', 'error');
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return showMsg('Subject name is required', 'error');
    const params = new URLSearchParams({ name: newSubjectName });
    const res = await fetch(`${API_URL}admin/subjects/?${params}`, { method: 'POST', headers });
    if (res.ok) {
      showMsg('Subject added');
      setNewSubjectName('');
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed to add subject', 'error');
    }
  };

  const addTeacher = async () => {
    if (!newTeacherEmail || !newTeacherPass || !newTeacherName)
      return showMsg('All teacher fields are required', 'error');
    const params = new URLSearchParams({
      email: newTeacherEmail,
      password: newTeacherPass,
      full_name: newTeacherName,
    });
    const res = await fetch(`${API_URL}admin/teachers/?${params}`, { method: 'POST', headers });
    if (res.ok) {
      showMsg('Teacher created');
      setNewTeacherEmail('');
      setNewTeacherPass('');
      setNewTeacherName('');
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed to create teacher', 'error');
    }
  };

  const assignTeacher = async () => {
    if (!assignClassId || !assignTeacherId || !assignSubjectId)
      return showMsg('Please select class, teacher, and subject', 'error');
    const params = new URLSearchParams({
      class_id: assignClassId,
      teacher_id: assignTeacherId,
      subject_id: assignSubjectId,
    });
    const res = await fetch(`${API_URL}admin/assign/?${params}`, { method: 'POST', headers });
    if (res.ok) {
      showMsg('Teacher assigned successfully');
      setAssignClassId('');
      setAssignTeacherId('');
      setAssignSubjectId('');
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Assignment failed', 'error');
    }
  };

  // Navigation for the Layout component (tab switching)
  const navLinks = [
    { label: 'Classes', onClick: () => setTab('classes') },
    { label: 'Subjects', onClick: () => setTab('subjects') },
    { label: 'Teachers', onClick: () => setTab('teachers') },
    { label: 'Assign', onClick: () => setTab('assign') },
    { label: 'Stats', onClick: () => setTab('stats') },
  ];

  return (
    <Layout role="admin" navLinks={navLinks}>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
          <span className="text-4xl">⚙️</span> Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Manage classes, subjects, teachers, and view system stats.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
          msgType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {msgType === 'error' ? '⚠️' : '✅'} {msg}
        </div>
      )}

      {/* ---- Classes Tab ---- */}
      {tab === 'classes' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl">🏫</div>
              <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Grade 5A"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Grade (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5 2.25h.008v.008H17.25v-.008zm0 3h.008v.008H17.25v-.008zm0 3h.008v.008H17.25v-.008zM3 18h3.75v-3.75H3v3.75z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Grade 5"
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { playClick(); addClass(); }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xl">📋</div>
              <h2 className="text-xl font-bold text-gray-900">Existing Classes</h2>
            </div>
            {classes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-5xl">📭</span>
                <p className="text-gray-400 mt-4 text-lg">No classes created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(c => (
                  <div key={c.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                      {c.grade && <p className="text-sm text-gray-500 mt-1">{c.grade}</p>}
                    </div>
                    <button
                      onClick={() => deleteClass(c.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Subjects Tab ---- */}
      {tab === 'subjects' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl">📖</div>
              <h2 className="text-xl font-bold text-gray-900">Add Subject</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { playClick(); addSubject(); }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-xl">📚</div>
              <h2 className="text-xl font-bold text-gray-900">All Subjects</h2>
            </div>
            {subjects.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-5xl">📭</span>
                <p className="text-gray-400 mt-4 text-lg">No subjects added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map(s => (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md hover:scale-105 transition-all duration-300">
                    <span className="text-3xl">📘</span>
                    <p className="font-semibold mt-2 text-gray-800">{s.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Teachers Tab ---- */}
      {tab === 'teachers' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-xl">👩‍🏫</div>
              <h2 className="text-xl font-bold text-gray-900">Create Teacher Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Banda"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="teacher@school.com"
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newTeacherPass}
                    onChange={(e) => setNewTeacherPass(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white/80 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => { playClick(); addTeacher(); }}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Create Teacher
            </button>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-xl">👥</div>
              <h2 className="text-xl font-bold text-gray-900">Current Teachers</h2>
            </div>
            {teachers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-5xl">📭</span>
                <p className="text-gray-400 mt-4 text-lg">No teachers created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map(t => (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center font-bold text-white text-lg">
                      {t.full_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{t.full_name}</p>
                      <p className="text-sm text-gray-500">{t.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Assign Tab ---- */}
      {tab === 'assign' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xl">🔗</div>
              <h2 className="text-xl font-bold text-gray-900">Assign Teacher to Class</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 bg-white/80"
                >
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher</label>
                <select
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 bg-white/80"
                >
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all duration-200 bg-white/80"
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => { playClick(); assignTeacher(); }}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Assign Teacher
            </button>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-xl">📊</div>
              <h2 className="text-xl font-bold text-gray-900">Current Assignments</h2>
            </div>
            {assignmentsList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-5xl">📭</span>
                <p className="text-gray-400 mt-4 text-lg">No assignments yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Teacher</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignmentsList.map((a, index) => (
                        <tr key={a.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                              <span>🏫</span> {a.classes?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                              <span>👩‍🏫</span> {a.profiles?.full_name || 'Teacher'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                              <span>📘</span> {a.subjects?.name || 'Subject'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Stats Tab ---- */}
      {tab === 'stats' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xl">📈</div>
            <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Classes', value: stats.classes, color: 'from-blue-600 to-indigo-600', icon: '🏫' },
              { label: 'Students', value: stats.students, color: 'from-emerald-500 to-teal-600', icon: '🎓' },
              { label: 'Teachers', value: stats.teachers, color: 'from-purple-600 to-violet-600', icon: '👩‍🏫' },
              { label: 'Materials', value: stats.materials, color: 'from-orange-500 to-amber-600', icon: '📚' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-xl text-white transition-transform hover:scale-105 duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold opacity-90">{label}</p>
                  <span className="text-3xl">{icon}</span>
                </div>
                <p className="text-4xl md:text-5xl font-black">{value ?? 0}</p>
              </div>
            ))}
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