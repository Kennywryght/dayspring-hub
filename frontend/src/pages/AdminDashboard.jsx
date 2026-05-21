import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api/v1/';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const navLinks = [
    { label: 'Classes', onClick: () => setTab('classes') },
    { label: 'Subjects', onClick: () => setTab('subjects') },
    { label: 'Teachers', onClick: () => setTab('teachers') },
    { label: 'Assign', onClick: () => setTab('assign') },
    { label: 'Stats', onClick: () => setTab('stats') },
  ];

  return (
    <Layout role="admin" navLinks={navLinks}>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage classes, subjects, teachers, and view system stats.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
          msgType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {msg}
        </div>
      )}

      {/* ---- Classes Tab ---- */}
      {tab === 'classes' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🏫</span> Create New Class
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Class name *</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 5A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Grade (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 5"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addClass}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span> Existing Classes
            </h2>
            {classes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 mt-2">No classes created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(c => (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800">{c.name}</h3>
                        {c.grade && <p className="text-sm text-gray-500">{c.grade}</p>}
                      </div>
                      <button
                        onClick={() => deleteClass(c.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
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

      {/* ---- Subjects Tab ---- */}
      {tab === 'subjects' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📖</span> Add Subject
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Subject name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addSubject}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition"
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📚</span> All Subjects
            </h2>
            {subjects.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 mt-2">No subjects added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map(s => (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
                    <span className="text-2xl">📘</span>
                    <p className="font-medium mt-1">{s.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Teachers Tab ---- */}
      {tab === 'teachers' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">👩‍🏫</span> Create Teacher Account
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Banda"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="teacher@school.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newTeacherPass}
                  onChange={(e) => setNewTeacherPass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
            <button
              onClick={addTeacher}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              Create Teacher
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">👥</span> Current Teachers
            </h2>
            {teachers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 mt-2">No teachers created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map(t => (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                      {t.full_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{t.full_name}</p>
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
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🔗</span> Assign Teacher to Class
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                >
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Teacher</label>
                <select
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                >
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={assignTeacher}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              Assign Teacher
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span> Current Assignments
            </h2>
            {assignmentsList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 mt-2">No assignments yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentsList.map(a => (
                  <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{a.classes?.name || 'Unknown'}</span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">{a.profiles?.full_name || 'Teacher'}</span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{a.subjects?.name || 'Subject'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Stats Tab ---- */}
      {tab === 'stats' && (
        <div className="space-y-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">📈</span> System Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Classes', value: stats.classes, color: 'from-blue-500 to-blue-600', icon: '🏫' },
              { label: 'Students', value: stats.students, color: 'from-green-500 to-green-600', icon: '🎓' },
              { label: 'Teachers', value: stats.teachers, color: 'from-purple-500 to-purple-600', icon: '👩‍🏫' },
              { label: 'Materials', value: stats.materials, color: 'from-orange-500 to-orange-600', icon: '📚' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium opacity-90">{label}</p>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-3xl md:text-4xl font-bold">{value ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}