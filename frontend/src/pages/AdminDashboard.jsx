import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

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
  const [tab, setTab] = useState('home');

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [teacherDetails, setTeacherDetails] = useState([]);
  const [parentDetails, setParentDetails] = useState([]);
  const [classDetails, setClassDetails] = useState([]);

  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPass, setNewParentPass] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkParentId, setLinkParentId] = useState('');

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);

  // Edit modal states
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingParent, setEditingParent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Edit form values
  const [editClassName, setEditClassName] = useState('');
  const [editClassGrade, setEditClassGrade] = useState('');
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentNumber, setEditStudentNumber] = useState('');
  const [editStudentClassId, setEditStudentClassId] = useState('');

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/login');
      return;
    }
    fetchAll();
    fetchUnassignedStudents();
    fetchClassDetails();
    fetchTeacherDetails();
    fetchParentDetails();
  }, []);

  useEffect(() => {
    if (tab === 'link' && unassignedStudents.length === 0) {
      fetchUnassignedStudents();
    }
    if (tab === 'teachers') {
      fetchTeacherDetails();
    }
    if (tab === 'parents') {
      fetchParentDetails();
    }
    if (tab === 'classes') {
      fetchClassDetails();
    }
  }, [tab]);

  const headers = {
    Authorization: `Bearer ${user?.access_token || ''}`,
  };

  const fetchAll = async () => {
    if (!user?.access_token) return;
    const [cRes, sRes, tRes, pRes, aRes, stRes, stuRes] = await Promise.all([
      fetch(`${API_URL}admin/classes/`, { headers }),
      fetch(`${API_URL}admin/subjects/`, { headers }),
      fetch(`${API_URL}admin/teachers/`, { headers }),
      fetch(`${API_URL}admin/parents/`, { headers }),
      fetch(`${API_URL}admin/assignments/`, { headers }),
      fetch(`${API_URL}admin/stats/`, { headers }),
      fetch(`${API_URL}admin/students/`, { headers }),
    ]);
    if (cRes.ok) setClasses(await cRes.json());
    if (sRes.ok) setSubjects(await sRes.json());
    if (tRes.ok) setTeachers(await tRes.json());
    if (pRes.ok) setParents(await pRes.json());
    if (aRes.ok) setAssignmentsList(await aRes.json());
    if (stRes.ok) setStats(await stRes.json());
    if (stuRes.ok) setStudents(await stuRes.json());
  };

  const fetchUnassignedStudents = async () => {
    const res = await fetch(`${API_URL}admin/students/unassigned/`, { headers });
    if (res.ok) setUnassignedStudents(await res.json());
  };

  const fetchTeacherDetails = async () => {
    const res = await fetch(`${API_URL}admin/teachers/detailed/`, { headers });
    if (res.ok) setTeacherDetails(await res.json());
  };

  const fetchParentDetails = async () => {
    const res = await fetch(`${API_URL}admin/parents/detailed/`, { headers });
    if (res.ok) setParentDetails(await res.json());
  };

  const fetchClassDetails = async () => {
    const res = await fetch(`${API_URL}admin/classes/detailed/`, { headers });
    if (res.ok) setClassDetails(await res.json());
  };

  // ===== EDIT/DELETE FUNCTIONS =====
  const updateClass = async () => {
    if (!editingClass || !editClassName.trim()) return;
    const params = new URLSearchParams({ name: editClassName.trim() });
    if (editClassGrade.trim()) params.append('grade', editClassGrade.trim());
    const res = await fetch(`${API_URL}admin/classes/${editingClass}/?${params.toString()}`, { method: 'PUT', headers });
    if (res.ok) { showMsg('Class updated'); setEditingClass(null); fetchAll(); fetchClassDetails(); }
    else { const err = await res.json().catch(() => ({})); showMsg(err.detail || 'Failed', 'error'); }
  };

  const deleteSubject = async (id) => { if (!confirm('Delete this subject?')) return; const r = await fetch(`${API_URL}admin/subjects/${id}/`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Subject deleted'); fetchAll(); } else showMsg('Failed', 'error'); };

  const updateSubject = async () => {
    if (!editingSubject || !editSubjectName.trim()) return;
    const r = await fetch(`${API_URL}admin/subjects/${editingSubject}/?name=${encodeURIComponent(editSubjectName.trim())}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Subject updated'); setEditingSubject(null); fetchAll(); } else showMsg('Failed', 'error');
  };

  const deleteTeacher = async (id) => { if (!confirm('Delete this teacher?')) return; const r = await fetch(`${API_URL}admin/teachers/${id}/`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Teacher deleted'); fetchAll(); fetchTeacherDetails(); } else showMsg('Failed', 'error'); };

  const updateTeacher = async () => {
    if (!editingTeacher || !editTeacherName.trim()) return;
    const r = await fetch(`${API_URL}admin/teachers/${editingTeacher}/?full_name=${encodeURIComponent(editTeacherName.trim())}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Teacher updated'); setEditingTeacher(null); fetchAll(); fetchTeacherDetails(); } else showMsg('Failed', 'error');
  };

  const deleteParent = async (id) => { if (!confirm('Delete this parent?')) return; const r = await fetch(`${API_URL}admin/parents/${id}/`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Parent deleted'); fetchAll(); fetchParentDetails(); } else showMsg('Failed', 'error'); };

  const updateParent = async () => {
    if (!editingParent || !editParentName.trim()) return;
    const r = await fetch(`${API_URL}admin/parents/${editingParent}/?full_name=${encodeURIComponent(editParentName.trim())}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Parent updated'); setEditingParent(null); fetchAll(); fetchParentDetails(); } else showMsg('Failed', 'error');
  };

  const deleteStudent = async (id) => { if (!confirm('Delete this student?')) return; const r = await fetch(`${API_URL}admin/students/${id}/`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Student deleted'); fetchAll(); } else showMsg('Failed', 'error'); };

  const updateStudent = async () => {
    if (!editingStudent || !editStudentName.trim()) return;
    const params = new URLSearchParams({ display_name: editStudentName.trim(), student_number: editStudentNumber.trim() });
    if (editStudentClassId) params.append('class_id', editStudentClassId);
    const r = await fetch(`${API_URL}admin/students/${editingStudent}/?${params.toString()}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Student updated'); setEditingStudent(null); fetchAll(); } else { const e = await r.json().catch(() => ({})); showMsg(e.detail || 'Failed', 'error'); }
  };

  const unassignTeacher = async (id) => { if (!confirm('Remove assignment?')) return; const r = await fetch(`${API_URL}admin/assign/${id}/`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Unassigned'); fetchAll(); fetchClassDetails(); fetchTeacherDetails(); } else showMsg('Failed', 'error'); };

  const unlinkParent = async (sid, pid) => { if (!confirm('Remove link?')) return; const r = await fetch(`${API_URL}admin/unlink-student-parent/?student_id=${sid}&parent_id=${pid}`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Link removed'); fetchUnassignedStudents(); fetchParentDetails(); } else showMsg('Failed', 'error'); };

  // Computed stats for pending work
  const unlinkedStudents = unassignedStudents.length;
  const totalStudents = students.length;
  const linkedStudents = totalStudents - unlinkedStudents;

  const classesWithoutTeachers = classDetails.filter((c) => c.teachers.length === 0).length;
  const classesWithTeachers = classDetails.filter((c) => c.teachers.length > 0).length;

  const teachersWithoutClasses = teacherDetails.filter((t) => t.classes.length === 0).length;
  const teachersWithClasses = teacherDetails.filter((t) => t.classes.length > 0).length;

  const parentsWithoutStudents = parentDetails.filter((p) => p.students.length === 0).length;
  const parentsWithStudents = parentDetails.filter((p) => p.students.length > 0).length;

  const studentsWithoutClass = students.filter((s) => !s.class_id).length;

  const totalPendingTasks =
    unlinkedStudents +
    classesWithoutTeachers +
    teachersWithoutClasses +
    parentsWithoutStudents +
    studentsWithoutClass;

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
      fetchClassDetails();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed to create class', 'error');
    }
  };

  const deleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    const res = await fetch(`${API_URL}admin/classes/${id}/`, { method: 'DELETE', headers });
    if (res.ok) {
      showMsg('Class deleted');
      fetchAll();
      fetchClassDetails();
    } else showMsg('Failed to delete class', 'error');
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
      fetchTeacherDetails();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed to create teacher', 'error');
    }
  };

  const addParent = async () => {
    if (!newParentEmail || !newParentPass || !newParentName)
      return showMsg('All parent fields are required', 'error');
    const params = new URLSearchParams({
      email: newParentEmail,
      password: newParentPass,
      full_name: newParentName,
    });
    const res = await fetch(`${API_URL}admin/parents/?${params}`, { method: 'POST', headers });
    if (res.ok) {
      showMsg('Parent created');
      setNewParentEmail('');
      setNewParentPass('');
      setNewParentName('');
      fetchAll();
      fetchParentDetails();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Failed to create parent', 'error');
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
      fetchClassDetails();
      fetchTeacherDetails();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Assignment failed', 'error');
    }
  };

  const handleLinkParent = async () => {
    if (!linkStudentId || !linkParentId) {
      showMsg('Please select a student and a parent', 'error');
      return;
    }
    const params = new URLSearchParams({ student_id: linkStudentId, parent_id: linkParentId });
    const res = await fetch(`${API_URL}admin/link-student-parent/?${params}`, { method: 'POST', headers });
    if (res.ok) {
      showMsg('Student linked to parent successfully');
      setLinkStudentId('');
      setLinkParentId('');
      fetchUnassignedStudents();
      fetchParentDetails();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg(err.detail || 'Linking failed', 'error');
    }
  };

  const navLinks = [
    { label: 'Home', onClick: () => setTab('home') },
    { label: 'Classes', onClick: () => setTab('classes') },
    { label: 'Students', onClick: () => setTab('students') },
    { label: 'Teachers', onClick: () => setTab('teachers') },
    { label: 'Parents', onClick: () => setTab('parents') },
    { label: 'Subjects', onClick: () => setTab('subjects') },
    { label: 'Assign', onClick: () => setTab('assign') },
    { label: 'Link Parent', onClick: () => setTab('link') },
    { label: 'Stats', onClick: () => setTab('stats') },
  ];

  return (
    <Layout role="admin" navLinks={navLinks}>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-4xl">⚙️</span> Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Manage classes, subjects, teachers, parents, and view system stats.
        </p>
      </div>

      {msg && (
        <div
          className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up flex items-center gap-2 ${
            msgType === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}
        >
          {msgType === 'error' ? '⚠️' : '✅'} {msg}
        </div>
      )}

      {/* ===== EDIT MODALS ===== */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Class</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                <input
                  type="text"
                  value={editClassGrade}
                  onChange={(e) => setEditClassGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateClass}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingClass(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Subject</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateSubject}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Teacher</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateTeacher}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingParent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Parent</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editParentName}
                  onChange={(e) => setEditParentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateParent}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-2xl"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingParent(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Student</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Student Number
                </label>
                <input
                  type="text"
                  value={editStudentNumber}
                  onChange={(e) => setEditStudentNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Class</label>
                <select
                  value={editStudentClassId}
                  onChange={(e) => setEditStudentClassId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={updateStudent}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HOME TAB ===== */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Classes',
                value: stats.classes,
                icon: '🏫',
                color: 'from-blue-600 to-indigo-600',
                onClick: () => setTab('classes'),
              },
              {
                label: 'Students',
                value: stats.students,
                icon: '🎓',
                color: 'from-emerald-500 to-teal-600',
                onClick: () => setTab('students'),
              },
              {
                label: 'Teachers',
                value: stats.teachers,
                icon: '👩‍🏫',
                color: 'from-purple-600 to-violet-600',
                onClick: () => setTab('teachers'),
              },
              {
                label: 'Parents',
                value: parents.length,
                icon: '👨‍👩‍👧',
                color: 'from-cyan-500 to-blue-600',
                onClick: () => setTab('parents'),
              },
            ].map(({ label, value, icon, color, onClick }) => (
              <div
                key={label}
                onClick={onClick}
                className={`bg-gradient-to-br ${color} rounded-2xl p-5 shadow-xl text-white cursor-pointer hover:scale-105 transition-transform duration-300`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold opacity-90">{label}</p>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-3xl md:text-4xl font-black">{value ?? 0}</p>
              </div>
            ))}
          </div>

          {/* Pending Tasks Alert */}
          {totalPendingTasks > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-amber-800 dark:text-amber-300">Pending Tasks</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {totalPendingTasks} task(s) require your attention
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Students Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🎓</span> Students Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                  <span className="font-bold text-gray-900 dark:text-white">{totalStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Linked to Parents</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{linkedStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unlinked</span>
                  <span
                    className={`font-bold ${
                      unlinkedStudents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {unlinkedStudents}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Without Class</span>
                  <span
                    className={`font-bold ${
                      studentsWithoutClass > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {studentsWithoutClass}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${totalStudents > 0 ? Math.round((linkedStudents / totalStudents) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {totalStudents > 0 ? Math.round((linkedStudents / totalStudents) * 100) : 0}% linked
                </p>
              </div>
              {unlinkedStudents > 0 && (
                <button
                  onClick={() => setTab('link')}
                  className="mt-4 w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                >
                  Link Students →
                </button>
              )}
            </div>

            {/* Classes Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🏫</span> Classes Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Classes</span>
                  <span className="font-bold text-gray-900 dark:text-white">{classes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">With Teachers</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{classesWithTeachers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Without Teachers</span>
                  <span
                    className={`font-bold ${
                      classesWithoutTeachers > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {classesWithoutTeachers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${classes.length > 0 ? Math.round((classesWithTeachers / classes.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {classes.length > 0 ? Math.round((classesWithTeachers / classes.length) * 100) : 0}% assigned
                </p>
              </div>
              {classesWithoutTeachers > 0 && (
                <button
                  onClick={() => setTab('assign')}
                  className="mt-4 w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                >
                  Assign Teachers →
                </button>
              )}
            </div>

            {/* Teachers Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>👩‍🏫</span> Teachers Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Teachers</span>
                  <span className="font-bold text-gray-900 dark:text-white">{teachers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Assigned to Classes</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{teachersWithClasses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unassigned</span>
                  <span
                    className={`font-bold ${
                      teachersWithoutClasses > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {teachersWithoutClasses}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${teachers.length > 0 ? Math.round((teachersWithClasses / teachers.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {teachers.length > 0 ? Math.round((teachersWithClasses / teachers.length) * 100) : 0}% assigned
                </p>
              </div>
              {teachersWithoutClasses > 0 && (
                <button
                  onClick={() => setTab('assign')}
                  className="mt-4 w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                >
                  Assign Teachers →
                </button>
              )}
            </div>

            {/* Parents Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>👨‍👩‍👧</span> Parents Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Parents</span>
                  <span className="font-bold text-gray-900 dark:text-white">{parents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Linked to Students</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{parentsWithStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Not Linked</span>
                  <span
                    className={`font-bold ${
                      parentsWithoutStudents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {parentsWithoutStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${parents.length > 0 ? Math.round((parentsWithStudents / parents.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {parents.length > 0 ? Math.round((parentsWithStudents / parents.length) * 100) : 0}% linked
                </p>
              </div>
              {parentsWithoutStudents > 0 && (
                <button
                  onClick={() => setTab('link')}
                  className="mt-4 w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                >
                  Link Parents →
                </button>
              )}
            </div>

            {/* Subjects Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📖</span> Subjects
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</span>
                  <span className="font-bold text-gray-900 dark:text-white">{subjects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Assignments</span>
                  <span className="font-bold text-gray-900 dark:text-white">{assignmentsList.length}</span>
                </div>
              </div>
              {subjects.length === 0 && (
                <button
                  onClick={() => setTab('subjects')}
                  className="mt-4 w-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                >
                  Add Subjects →
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>⚡</span> Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setTab('classes')}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                >
                  🏫 Create New Class
                </button>
                <button
                  onClick={() => setTab('teachers')}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                >
                  👩‍🏫 Add New Teacher
                </button>
                <button
                  onClick={() => setTab('parents')}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 text-sm font-medium hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition"
                >
                  👨‍👩‍👧 Add New Parent
                </button>
                <button
                  onClick={() => setTab('assign')}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
                >
                  🔗 Assign Teacher to Class
                </button>
                <button
                  onClick={() => setTab('link')}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 text-sm font-medium hover:bg-pink-100 dark:hover:bg-pink-900/40 transition"
                >
                  👨‍👩‍👧 Link Student to Parent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CLASSES TAB ===== */}
      {tab === 'classes' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl">
                🏫
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Class</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Class name *</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 5A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Grade (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grade 5"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    playClick();
                    addClass();
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Class Overview</h2>
          <div className="space-y-4">
            {classes.map((c) => {
              const details = classDetails.find((d) => d.id === c.id);
              const classStudents = details?.students || [];
              const classTeachers = details?.teachers || [];

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                    onClick={() => setSelectedClass(selectedClass === c.id ? null : c.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🏫</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{c.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {classStudents.length} students | {classTeachers.length} teachers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                        {c.grade || 'No grade'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(c.id);
                          setEditClassName(c.name);
                          setEditClassGrade(c.grade || '');
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClass(c.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>

                      <svg
                        className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                          selectedClass === c.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {selectedClass === c.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        👩‍🏫 Teachers & Subjects
                      </h4>
                      {classTeachers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No teachers assigned.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {classTeachers.map((ct, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-600"
                            >
                              <p className="font-medium text-gray-800 dark:text-gray-200">{ct.teacher_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{ct.subject_name}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        🎓 Students ({classStudents.length})
                      </h4>
                      {classStudents.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No students enrolled.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {classStudents.map((s) => (
                            <div
                              key={s.id}
                              className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-600"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {s.display_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{s.student_number}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== STUDENTS TAB ===== */}
      {tab === 'students' && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Students</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Student Number</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Class</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Parent</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {students.map((s, index) => {
                    const studentClass = classes.find((c) => c.id === s.class_id);
                    const details = classDetails.find((d) => d.id === s.class_id);
                    const studentInDetails = details?.students?.find((st) => st.id === s.id);
                    const isLinked = studentInDetails?.has_parent;

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">{s.student_number}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{s.display_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {studentClass?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4">
                          {isLinked ? (
                            <span className="text-green-600 dark:text-green-400 text-xs font-semibold">✅ Linked</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">❌ Not linked</span>
                              <button onClick={() => { setLinkStudentId(s.id); setTab('link'); }} className="text-indigo-500 hover:text-indigo-700 text-xs font-medium">Link →</button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingStudent(s.id);
                                setEditStudentName(s.display_name);
                                setEditStudentNumber(s.student_number);
                                setEditStudentClassId(s.class_id || '');
                              }}
                              className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStudent(s.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* ===== TEACHERS TAB ===== */}
      {tab === 'teachers' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-xl">
                👩‍🏫
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Teacher Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Banda"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="teacher@school.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newTeacherPass}
                  onChange={(e) => setNewTeacherPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
            <button
              onClick={() => {
                playClick();
                addTeacher();
              }}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Create Teacher
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Teachers</h2>
          <div className="space-y-4">
            {teachers.map((t) => {
              const details = teacherDetails.find((td) => td.id === t.id);
              const teacherClasses = details?.classes || [];
              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                    onClick={() => setSelectedTeacher(selectedTeacher === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center font-bold text-white text-lg flex-shrink-0">
                        {t.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.full_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{details?.email || 'No email'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                        {teacherClasses.length} classes
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTeacher(t.id);
                          setEditTeacherName(t.full_name);
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTeacher(t.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>

                      <svg
                        className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                          selectedTeacher === t.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {selectedTeacher === t.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Assigned Classes & Subjects</h4>
                      {teacherClasses.length === 0 ? (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No classes assigned yet.</p>
                          <button onClick={() => { setAssignTeacherId(t.id); setTab('assign'); }} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 transition">Assign to Class →</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teacherClasses.map((tc, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <p className="font-medium text-gray-800 dark:text-gray-200">🏫 {tc.class_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">📘 {tc.subject_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">👨‍🎓 {tc.student_count || 0} students</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== PARENTS TAB ===== */}
      {tab === 'parents' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl">
                👨‍👩‍👧
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Parent Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Phiri"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:focus:ring-cyan-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="parent@school.com"
                  value={newParentEmail}
                  onChange={(e) => setNewParentEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:focus:ring-cyan-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newParentPass}
                  onChange={(e) => setNewParentPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:focus:ring-cyan-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
            <button
              onClick={() => {
                playClick();
                addParent();
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Create Parent
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Parents</h2>
          <div className="space-y-4">
            {parents.map((p) => {
              const details = parentDetails.find((pd) => pd.id === p.id);
              const linkedStudents = details?.students || [];
              const hasStudents = linkedStudents.length > 0;
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                    onClick={() => setSelectedParent(selectedParent === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white text-lg flex-shrink-0">
                        {p.full_name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.full_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{details?.email || 'No email'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          hasStudents
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {hasStudents ? `✅ ${linkedStudents.length} student(s)` : '❌ No students'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingParent(p.id);
                          setEditParentName(p.full_name);
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteParent(p.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>

                      <svg
                        className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                          selectedParent === p.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {selectedParent === p.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Linked Students</h4>
                      {linkedStudents.length === 0 ? (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No students linked.</p>
                          <button onClick={() => { setLinkParentId(p.id); setTab('link'); }} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-200 transition">Link to Student →</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {linkedStudents.map((s) => (
                            <div
                              key={s.id}
                              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{s.display_name}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">#{s.student_number}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">🏫 {s.class_name || 'No class'}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unlinkParent(s.id, p.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-medium ml-2"
                                >
                                  Unlink
                                </button>
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
          </div>
        </div>
      )}

      {/* ---- Subjects Tab ---- */}
      {tab === 'subjects' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl">
                📖
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Subject</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => {
                  playClick();
                  addSubject();
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Add Subject
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 text-center hover:shadow-md hover:scale-105 transition-all duration-300"
              >
                <span className="text-3xl">📘</span>
                <p className="font-semibold mt-2 text-gray-800 dark:text-gray-200">{s.name}</p>
                <div className="flex justify-center gap-3 mt-3">
                  <button
                    onClick={() => {
                      setEditingSubject(s.id);
                      setEditSubjectName(s.name);
                    }}
                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSubject(s.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Assign Tab ---- */}
      {tab === 'assign' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xl">
                🔗
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Teacher to Class</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <select
                value={assignClassId}
                onChange={(e) => setAssignClassId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>

              <select
                value={assignSubjectId}
                onChange={(e) => setAssignSubjectId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                playClick();
                assignTeacher();
              }}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Assign Teacher
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">
              Current Assignments
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Class</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Teacher</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Subject</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {assignmentsList.map((a,) => (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
                    >
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                          🏫 {a.classes?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                          👩‍🏫 {a.profiles?.full_name || 'Teacher'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">
                          📘 {a.subjects?.name || 'Subject'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => unassignTeacher(a.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Unassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- Link Parent Tab ---- */}
      {tab === 'link' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xl">
                👨‍👩‍👧
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Link Student to Parent</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <select
                value={linkStudentId}
                onChange={(e) => setLinkStudentId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select student</option>
                {unassignedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name} ({s.student_number})
                  </option>
                ))}
              </select>

              <select
                value={linkParentId}
                onChange={(e) => setLinkParentId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-900 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select parent</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  playClick();
                  handleLinkParent();
                }}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Stats Tab ---- */}
      {tab === 'stats' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xl">
              📈
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Overview</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                label: 'Classes',
                value: stats.classes,
                color: 'from-blue-600 to-indigo-600',
                icon: '🏫',
                onClick: () => setTab('classes'),
              },
              {
                label: 'Students',
                value: stats.students,
                color: 'from-emerald-500 to-teal-600',
                icon: '🎓',
                onClick: () => setTab('students'),
              },
              {
                label: 'Teachers',
                value: stats.teachers,
                color: 'from-purple-600 to-violet-600',
                icon: '👩‍🏫',
                onClick: () => setTab('teachers'),
              },
              {
                label: 'Parents',
                value: parents.length,
                color: 'from-cyan-500 to-blue-600',
                icon: '👨‍👩‍👧',
                onClick: () => setTab('parents'),
              },
            ].map(({ label, value, color, icon, onClick }) => (
              <div
                key={label}
                onClick={onClick}
                className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-xl text-white transition-transform hover:scale-105 duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold opacity-90">{label}</p>
                  <span className="text-3xl">{icon}</span>
                </div>
                <p className="text-4xl md:text-5xl font-black">{value ?? 0}</p>
                <p className="text-xs opacity-70 mt-2">Click to view details →</p>
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