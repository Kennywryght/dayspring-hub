import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Heart,
  Shield,
  BookOpen,
  GraduationCap,
  UserPlus,
  Link2,
  Unlink,
  Trash2,
  Pencil,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
  BarChart3,
  Zap,
  Target,
  Award,
  Calendar,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';

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

  // Main data states
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

  // Form states
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

  // Link states
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkParentId, setLinkParentId] = useState('');

  // Selection states
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

  // Trash/Soft delete states
  const [showTrash, setShowTrash] = useState(false);
  const [deletedClasses, setDeletedClasses] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [deletedTeachers, setDeletedTeachers] = useState([]);
  const [deletedParents, setDeletedParents] = useState([]);

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
    if (tab === 'trash') {
      fetchTrashItems();
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

  const fetchTrashItems = async () => {
    const [cRes, sRes, tRes, pRes] = await Promise.all([
      fetch(`${API_URL}admin/classes/trash/`, { headers }),
      fetch(`${API_URL}admin/students/trash/`, { headers }),
      fetch(`${API_URL}admin/teachers/trash/`, { headers }),
      fetch(`${API_URL}admin/parents/trash/`, { headers }),
    ]);
    if (cRes.ok) setDeletedClasses(await cRes.json());
    if (sRes.ok) setDeletedStudents(await sRes.json());
    if (tRes.ok) setDeletedTeachers(await tRes.json());
    if (pRes.ok) setDeletedParents(await pRes.json());
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

  // ===== SOFT DELETE & RESTORE FUNCTIONS =====
  const softDeleteClass = async (id) => {
    if (!confirm('Move this class to trash?')) return;
    const r = await fetch(`${API_URL}admin/classes/${id}/soft-delete/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Class moved to trash'); fetchAll(); fetchClassDetails(); if (tab === 'trash') fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const restoreClass = async (id) => {
    if (!confirm('Restore this class?')) return;
    const r = await fetch(`${API_URL}admin/classes/${id}/restore/`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Class restored'); fetchAll(); fetchClassDetails(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const permanentDeleteClass = async (id) => {
    if (!confirm('Permanently delete this class? This cannot be undone!')) return;
    const r = await fetch(`${API_URL}admin/classes/${id}/permanent/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Class permanently deleted'); fetchAll(); fetchClassDetails(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const softDeleteTeacher = async (id) => {
    if (!confirm('Move this teacher to trash?')) return;
    const r = await fetch(`${API_URL}admin/teachers/${id}/soft-delete/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Teacher moved to trash'); fetchAll(); fetchTeacherDetails(); if (tab === 'trash') fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const restoreTeacher = async (id) => {
    if (!confirm('Restore this teacher?')) return;
    const r = await fetch(`${API_URL}admin/teachers/${id}/restore/`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Teacher restored'); fetchAll(); fetchTeacherDetails(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const permanentDeleteTeacher = async (id) => {
    if (!confirm('Permanently delete this teacher? This cannot be undone!')) return;
    const r = await fetch(`${API_URL}admin/teachers/${id}/permanent/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Teacher permanently deleted'); fetchAll(); fetchTeacherDetails(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const softDeleteParent = async (id) => {
    if (!confirm('Move this parent to trash?')) return;
    const r = await fetch(`${API_URL}admin/parents/${id}/soft-delete/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Parent moved to trash'); fetchAll(); fetchParentDetails(); if (tab === 'trash') fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const restoreParent = async (id) => {
    if (!confirm('Restore this parent?')) return;
    const r = await fetch(`${API_URL}admin/parents/${id}/restore/`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Parent restored'); fetchAll(); fetchParentDetails(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const permanentDeleteParent = async (id) => {
    if (!confirm('Permanently delete this parent? This cannot be undone!')) return;
    const r = await fetch(`${API_URL}admin/parents/${id}/permanent/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Parent permanently deleted'); fetchAll(); fetchParentDetails(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const softDeleteStudent = async (id) => {
    if (!confirm('Move this student to trash?')) return;
    const r = await fetch(`${API_URL}admin/students/${id}/soft-delete/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Student moved to trash'); fetchAll(); if (tab === 'trash') fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const restoreStudent = async (id) => {
    if (!confirm('Restore this student?')) return;
    const r = await fetch(`${API_URL}admin/students/${id}/restore/`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Student restored'); fetchAll(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  const permanentDeleteStudent = async (id) => {
    if (!confirm('Permanently delete this student? This cannot be undone!')) return;
    const r = await fetch(`${API_URL}admin/students/${id}/permanent/`, { method: 'DELETE', headers });
    if (r.ok) { showMsg('Student permanently deleted'); fetchAll(); fetchTrashItems(); }
    else showMsg('Failed', 'error');
  };

  // ===== EDIT FUNCTIONS =====
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

  const updateTeacher = async () => {
    if (!editingTeacher || !editTeacherName.trim()) return;
    const r = await fetch(`${API_URL}admin/teachers/${editingTeacher}/?full_name=${encodeURIComponent(editTeacherName.trim())}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Teacher updated'); setEditingTeacher(null); fetchAll(); fetchTeacherDetails(); } else showMsg('Failed', 'error');
  };

  const updateParent = async () => {
    if (!editingParent || !editParentName.trim()) return;
    const r = await fetch(`${API_URL}admin/parents/${editingParent}/?full_name=${encodeURIComponent(editParentName.trim())}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Parent updated'); setEditingParent(null); fetchAll(); fetchParentDetails(); } else showMsg('Failed', 'error');
  };

  const updateStudent = async () => {
    if (!editingStudent || !editStudentName.trim()) return;
    const params = new URLSearchParams({ display_name: editStudentName.trim(), student_number: editStudentNumber.trim() });
    if (editStudentClassId) params.append('class_id', editStudentClassId);
    const r = await fetch(`${API_URL}admin/students/${editingStudent}/?${params.toString()}`, { method: 'PUT', headers });
    if (r.ok) { showMsg('Student updated'); setEditingStudent(null); fetchAll(); } else { const e = await r.json().catch(() => ({})); showMsg(e.detail || 'Failed', 'error'); }
  };

  const unassignTeacher = async (id) => { if (!confirm('Remove assignment?')) return; const r = await fetch(`${API_URL}admin/assign/${id}/`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Unassigned'); fetchAll(); fetchClassDetails(); fetchTeacherDetails(); } else showMsg('Failed', 'error'); };

  const unlinkParent = async (sid, pid) => { if (!confirm('Remove link?')) return; const r = await fetch(`${API_URL}admin/unlink-student-parent/?student_id=${sid}&parent_id=${pid}`, { method: 'DELETE', headers }); if (r.ok) { showMsg('Link removed'); fetchUnassignedStudents(); fetchParentDetails(); } else showMsg('Failed', 'error'); };

  // Computed stats
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
  const totalPendingTasks = unlinkedStudents + classesWithoutTeachers + teachersWithoutClasses + parentsWithoutStudents + studentsWithoutClass;

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

  // Navigation links with icons
  const navLinks = [
    { label: 'Home', onClick: () => setTab('home') },
    { label: 'Classes', onClick: () => setTab('classes') },
    { label: 'Students', onClick: () => setTab('students') },
    { label: 'Teachers', onClick: () => setTab('teachers') },
    { label: 'Parents', onClick: () => setTab('parents') },
    { label: 'Subjects', onClick: () => setTab('subjects') },
    { label: 'Assign', onClick: () => setTab('assign') },
    { label: 'Link Parent', onClick: () => setTab('link') },
    { label: 'Trash', onClick: () => setTab('trash') },
    { label: 'Stats', onClick: () => setTab('stats') },
  ];

  // Design system components
  const SectionIcon = ({ Icon, color = 'text-brass-400' }) => (
    <div className={`w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center ${color} flex-shrink-0`}>
      <Icon className="w-5 h-5" strokeWidth={1.75} />
    </div>
  );

  const inputBase = "w-full pl-11 pr-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500";
  const inputPlain = "w-full px-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500";
  const primaryBtn = "bg-brass-600 hover:bg-brass-700 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-soft transition-colors duration-150";
  const secondaryBtn = "bg-navy-700 hover:bg-navy-600 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-soft transition-colors duration-150";

  const TitleFieldIcon = () => (
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Pencil className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
    </div>
  );

  return (
    <Layout role="admin" navLinks={navLinks}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-3">
            <Building2 className="w-9 h-9 text-brass-500" strokeWidth={1.75} /> Admin Dashboard
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2 text-lg">Manage classes, subjects, teachers, parents, and students.</p>
        </div>
        <div className="flex items-center gap-3">
          {totalPendingTasks > 0 && (
            <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-oxbrick-600 dark:text-oxbrick-400" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-oxbrick-700 dark:text-oxbrick-300">{totalPendingTasks} pending</span>
            </div>
          )}
          <button onClick={() => setTab('trash')} className="bg-navy-700 hover:bg-navy-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" strokeWidth={1.75} /> Trash
          </button>
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

      {/* ===== EDIT MODALS ===== */}
      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Edit Class
              </h2>
              <button onClick={() => setEditingClass(null)} className="text-ink-400 hover:text-navy-700 dark:hover:text-white">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Name *</label>
                <input type="text" value={editClassName} onChange={(e) => setEditClassName(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Grade</label>
                <input type="text" value={editClassGrade} onChange={(e) => setEditClassGrade(e.target.value)} className={inputPlain} />
              </div>
              <div className="flex gap-3">
                <button onClick={updateClass} className={`flex-1 ${primaryBtn}`}>Save</button>
                <button onClick={() => setEditingClass(null)} className={`flex-1 ${secondaryBtn}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Edit Subject
              </h2>
              <button onClick={() => setEditingSubject(null)} className="text-ink-400 hover:text-navy-700 dark:hover:text-white">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Name *</label>
                <input type="text" value={editSubjectName} onChange={(e) => setEditSubjectName(e.target.value)} className={inputPlain} />
              </div>
              <div className="flex gap-3">
                <button onClick={updateSubject} className={`flex-1 ${primaryBtn}`}>Save</button>
                <button onClick={() => setEditingSubject(null)} className={`flex-1 ${secondaryBtn}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Edit Teacher
              </h2>
              <button onClick={() => setEditingTeacher(null)} className="text-ink-400 hover:text-navy-700 dark:hover:text-white">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Full Name *</label>
                <input type="text" value={editTeacherName} onChange={(e) => setEditTeacherName(e.target.value)} className={inputPlain} />
              </div>
              <div className="flex gap-3">
                <button onClick={updateTeacher} className={`flex-1 ${primaryBtn}`}>Save</button>
                <button onClick={() => setEditingTeacher(null)} className={`flex-1 ${secondaryBtn}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {editingParent && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Edit Parent
              </h2>
              <button onClick={() => setEditingParent(null)} className="text-ink-400 hover:text-navy-700 dark:hover:text-white">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Full Name *</label>
                <input type="text" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} className={inputPlain} />
              </div>
              <div className="flex gap-3">
                <button onClick={updateParent} className={`flex-1 ${primaryBtn}`}>Save</button>
                <button onClick={() => setEditingParent(null)} className={`flex-1 ${secondaryBtn}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Edit Student
              </h2>
              <button onClick={() => setEditingStudent(null)} className="text-ink-400 hover:text-navy-700 dark:hover:text-white">
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Display Name *</label>
                <input type="text" value={editStudentName} onChange={(e) => setEditStudentName(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Student Number *</label>
                <input type="text" value={editStudentNumber} onChange={(e) => setEditStudentNumber(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Class</label>
                <select value={editStudentClassId} onChange={(e) => setEditStudentClassId(e.target.value)} className={inputPlain}>
                  <option value="">No class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={updateStudent} className={`flex-1 ${primaryBtn}`}>Save</button>
                <button onClick={() => setEditingStudent(null)} className={`flex-1 ${secondaryBtn}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HOME TAB ===== */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Classes', value: stats.classes, Icon: Building2, onClick: () => setTab('classes') },
              { label: 'Students', value: stats.students, Icon: GraduationCap, onClick: () => setTab('students') },
              { label: 'Teachers', value: stats.teachers, Icon: Users, onClick: () => setTab('teachers') },
              { label: 'Parents', value: parents.length, Icon: Heart, onClick: () => setTab('parents') },
            ].map(({ label, value, Icon, onClick }) => (
              <div key={label} onClick={onClick} className="bg-navy-700 rounded-2xl p-5 shadow-card text-white cursor-pointer hover:bg-navy-600 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-navy-200">{label}</p>
                  <Icon className="w-5 h-5 text-brass-400" strokeWidth={1.75} />
                </div>
                <p className="text-3xl md:text-4xl font-display font-semibold">{value ?? 0}</p>
              </div>
            ))}
          </div>

          {/* Pending Tasks Alert */}
          {totalPendingTasks > 0 && (
            <div className="bg-brass-50 dark:bg-brass-700/20 border border-brass-200 dark:border-brass-700/40 rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-brass-600 dark:text-brass-400 flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h3 className="font-semibold text-brass-800 dark:text-brass-300">Pending Tasks</h3>
                  <ul className="text-sm text-brass-700 dark:text-brass-400 mt-1 space-y-1">
                    {unlinkedStudents > 0 && <li>• {unlinkedStudents} student(s) need parent linking</li>}
                    {classesWithoutTeachers > 0 && <li>• {classesWithoutTeachers} class(es) need teacher assignment</li>}
                    {teachersWithoutClasses > 0 && <li>• {teachersWithoutClasses} teacher(s) need class assignment</li>}
                    {parentsWithoutStudents > 0 && <li>• {parentsWithoutStudents} parent(s) need student linking</li>}
                    {studentsWithoutClass > 0 && <li>• {studentsWithoutClass} student(s) need class assignment</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Students Status */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Students
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Total</span>
                  <span className="font-semibold text-navy-800 dark:text-white">{totalStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Linked to Parents</span>
                  <span className="font-semibold text-forest-600 dark:text-forest-500">{linkedStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Unlinked</span>
                  <span className={`font-semibold ${unlinkedStudents > 0 ? 'text-oxbrick-600 dark:text-oxbrick-500' : 'text-ink-400'}`}>{unlinkedStudents}</span>
                </div>
                <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2">
                  <div className="bg-forest-500 h-2 rounded-full" style={{ width: `${totalStudents > 0 ? Math.round((linkedStudents / totalStudents) * 100) : 0}%` }} />
                </div>
                <p className="text-xs text-ink-400 dark:text-ink-500 text-right">{totalStudents > 0 ? Math.round((linkedStudents / totalStudents) * 100) : 0}% linked</p>
                {unlinkedStudents > 0 && (
                  <button onClick={() => setTab('link')} className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">
                    Link Students →
                  </button>
                )}
              </div>
            </div>

            {/* Classes Status */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Classes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Total</span>
                  <span className="font-semibold text-navy-800 dark:text-white">{classes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">With Teachers</span>
                  <span className="font-semibold text-forest-600 dark:text-forest-500">{classesWithTeachers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Without Teachers</span>
                  <span className={`font-semibold ${classesWithoutTeachers > 0 ? 'text-oxbrick-600 dark:text-oxbrick-500' : 'text-ink-400'}`}>{classesWithoutTeachers}</span>
                </div>
                <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2">
                  <div className="bg-forest-500 h-2 rounded-full" style={{ width: `${classes.length > 0 ? Math.round((classesWithTeachers / classes.length) * 100) : 0}%` }} />
                </div>
                <p className="text-xs text-ink-400 dark:text-ink-500 text-right">{classes.length > 0 ? Math.round((classesWithTeachers / classes.length) * 100) : 0}% assigned</p>
                {classesWithoutTeachers > 0 && (
                  <button onClick={() => setTab('assign')} className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">
                    Assign Teachers →
                  </button>
                )}
              </div>
            </div>

            {/* Teachers Status */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Teachers
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Total</span>
                  <span className="font-semibold text-navy-800 dark:text-white">{teachers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Assigned</span>
                  <span className="font-semibold text-forest-600 dark:text-forest-500">{teachersWithClasses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Unassigned</span>
                  <span className={`font-semibold ${teachersWithoutClasses > 0 ? 'text-oxbrick-600 dark:text-oxbrick-500' : 'text-ink-400'}`}>{teachersWithoutClasses}</span>
                </div>
                <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2">
                  <div className="bg-forest-500 h-2 rounded-full" style={{ width: `${teachers.length > 0 ? Math.round((teachersWithClasses / teachers.length) * 100) : 0}%` }} />
                </div>
                <p className="text-xs text-ink-400 dark:text-ink-500 text-right">{teachers.length > 0 ? Math.round((teachersWithClasses / teachers.length) * 100) : 0}% assigned</p>
                {teachersWithoutClasses > 0 && (
                  <button onClick={() => setTab('assign')} className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">
                    Assign Teachers →
                  </button>
                )}
              </div>
            </div>

            {/* Parents Status */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Parents
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Total</span>
                  <span className="font-semibold text-navy-800 dark:text-white">{parents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Linked</span>
                  <span className="font-semibold text-forest-600 dark:text-forest-500">{parentsWithStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600 dark:text-ink-300">Not Linked</span>
                  <span className={`font-semibold ${parentsWithoutStudents > 0 ? 'text-oxbrick-600 dark:text-oxbrick-500' : 'text-ink-400'}`}>{parentsWithoutStudents}</span>
                </div>
                <div className="w-full bg-ink-200 dark:bg-navy-600 rounded-full h-2">
                  <div className="bg-forest-500 h-2 rounded-full" style={{ width: `${parents.length > 0 ? Math.round((parentsWithStudents / parents.length) * 100) : 0}%` }} />
                </div>
                <p className="text-xs text-ink-400 dark:text-ink-500 text-right">{parents.length > 0 ? Math.round((parentsWithStudents / parents.length) * 100) : 0}% linked</p>
                {parentsWithoutStudents > 0 && (
                  <button onClick={() => setTab('link')} className="w-full bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">
                    Link Parents →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brass-500" strokeWidth={1.75} /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setTab('classes')} className="bg-navy-50 dark:bg-navy-700 hover:bg-navy-100 dark:hover:bg-navy-600 text-navy-700 dark:text-ink-200 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" strokeWidth={1.75} /> Add Class
              </button>
              <button onClick={() => setTab('teachers')} className="bg-navy-50 dark:bg-navy-700 hover:bg-navy-100 dark:hover:bg-navy-600 text-navy-700 dark:text-ink-200 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <UserPlus className="w-4 h-4" strokeWidth={1.75} /> Add Teacher
              </button>
              <button onClick={() => setTab('parents')} className="bg-navy-50 dark:bg-navy-700 hover:bg-navy-100 dark:hover:bg-navy-600 text-navy-700 dark:text-ink-200 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Heart className="w-4 h-4" strokeWidth={1.75} /> Add Parent
              </button>
              <button onClick={() => setTab('assign')} className="bg-navy-50 dark:bg-navy-700 hover:bg-navy-100 dark:hover:bg-navy-600 text-navy-700 dark:text-ink-200 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Link2 className="w-4 h-4" strokeWidth={1.75} /> Assign Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CLASSES TAB ===== */}
      {tab === 'classes' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Building2} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Create New Class</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Class Name *</label>
                <div className="relative">
                  <TitleFieldIcon />
                  <input type="text" placeholder="e.g. Grade 5A" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className={inputBase} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Grade (optional)</label>
                <input type="text" placeholder="e.g. Grade 5" value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)} className={inputPlain} />
              </div>
              <div className="flex items-end">
                <button onClick={() => { playClick(); addClass(); }} className={primaryBtn}>Add Class</button>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Class Overview</h2>
          <div className="space-y-4">
            {classes.map((c) => {
              const details = classDetails.find((d) => d.id === c.id);
              const classStudents = details?.students || [];
              const classTeachers = details?.teachers || [];

              return (
                <div key={c.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 overflow-hidden hover:shadow-elevated transition-shadow duration-200">
                  <div className="p-6 cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-700/50 flex items-center justify-between" onClick={() => setSelectedClass(selectedClass === c.id ? null : c.id)}>
                    <div className="flex items-center gap-4">
                      <Building2 className="w-8 h-8 text-brass-500" strokeWidth={1.75} />
                      <div>
                        <h3 className="font-display font-semibold text-xl text-navy-800 dark:text-white">{c.name}</h3>
                        <p className="text-sm text-ink-500 dark:text-ink-300">{classStudents.length} students · {classTeachers.length} teachers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-ink-100 dark:bg-navy-700 px-3 py-1 rounded-full text-ink-600 dark:text-ink-300 font-medium">{c.grade || 'No grade'}</span>
                      <button onClick={(e) => { e.stopPropagation(); setEditingClass(c.id); setEditClassName(c.name); setEditClassGrade(c.grade || ''); }} className="text-brass-600 dark:text-brass-400 text-sm font-medium hover:underline">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); softDeleteClass(c.id); }} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Delete</button>
                      <svg className={`w-5 h-5 text-ink-400 transition-transform ${selectedClass === c.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  {selectedClass === c.id && (
                    <div className="border-t border-ink-200 dark:border-navy-600 p-6 bg-ink-50 dark:bg-navy-700/50">
                      <h4 className="font-semibold text-navy-800 dark:text-white mb-3">👩‍🏫 Teachers & Subjects</h4>
                      {classTeachers.length === 0 ? (
                        <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">No teachers assigned.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {classTeachers.map((ct, idx) => (
                            <div key={idx} className="bg-white dark:bg-navy-800 rounded-xl p-3 border border-ink-200 dark:border-navy-600">
                              <p className="font-medium text-navy-800 dark:text-white">{ct.teacher_name}</p>
                              <p className="text-xs text-ink-500 dark:text-ink-300">{ct.subject_name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <h4 className="font-semibold text-navy-800 dark:text-white mb-3">🎓 Students ({classStudents.length})</h4>
                      {classStudents.length === 0 ? (
                        <p className="text-sm text-ink-500 dark:text-ink-300">No students enrolled.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {classStudents.map((s) => (
                            <div key={s.id} className="bg-white dark:bg-navy-800 rounded-lg p-2 text-center border border-ink-200 dark:border-navy-600">
                              <p className="text-sm font-medium text-navy-800 dark:text-white truncate">{s.display_name}</p>
                              <p className="text-xs text-ink-500 dark:text-ink-300">{s.student_number}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">All Students</h2>
            <button onClick={() => setTab('link')} className="bg-brass-600 hover:bg-brass-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
              <Link2 className="w-4 h-4" strokeWidth={1.75} /> Link to Parent
            </button>
          </div>
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy-700">
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider rounded-l-lg">Student Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-navy-700">
                  {students.map((s, index) => {
                    const studentClass = classes.find((c) => c.id === s.class_id);
                    const details = classDetails.find((d) => d.id === s.class_id);
                    const studentInDetails = details?.students?.find((st) => st.id === s.id);
                    const isLinked = studentInDetails?.has_parent;

                    return (
                      <tr key={s.id} className={`hover:bg-ink-50 dark:hover:bg-navy-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-navy-800' : 'bg-ink-50/50 dark:bg-navy-800/60'}`}>
                        <td className="px-6 py-4 text-sm font-data text-ink-700 dark:text-ink-300">{s.student_number}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-navy-800 dark:text-white">{s.display_name}</td>
                        <td className="px-6 py-4 text-sm text-ink-600 dark:text-ink-300">{studentClass?.name || 'Unassigned'}</td>
                        <td className="px-6 py-4">
                          {isLinked ? (
                            <span className="text-forest-600 dark:text-forest-500 text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Linked</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-oxbrick-600 dark:text-oxbrick-500 text-xs font-semibold">Not linked</span>
                              <button onClick={() => { setLinkStudentId(s.id); setTab('link'); }} className="text-brass-600 dark:text-brass-400 text-xs font-medium hover:underline">Link →</button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button onClick={() => { setEditingStudent(s.id); setEditStudentName(s.display_name); setEditStudentNumber(s.student_number); setEditStudentClassId(s.class_id || ''); }} className="text-brass-600 dark:text-brass-400 text-sm font-medium hover:underline">Edit</button>
                            <button onClick={() => softDeleteStudent(s.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Delete</button>
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
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Users} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Create Teacher Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Full Name *</label>
                <input type="text" placeholder="e.g. Mr. Banda" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Email *</label>
                <input type="email" placeholder="teacher@school.com" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Password *</label>
                <input type="password" placeholder="Min. 6 characters" value={newTeacherPass} onChange={(e) => setNewTeacherPass(e.target.value)} className={inputPlain} />
              </div>
            </div>
            <button onClick={() => { playClick(); addTeacher(); }} className={primaryBtn}>Create Teacher</button>
          </div>

          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Current Teachers</h2>
          <div className="space-y-4">
            {teachers.map((t) => {
              const details = teacherDetails.find((td) => td.id === t.id);
              const teacherClasses = details?.classes || [];
              return (
                <div key={t.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 overflow-hidden hover:shadow-elevated transition-shadow duration-200">
                  <div className="p-6 cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-700/50 flex items-center justify-between" onClick={() => setSelectedTeacher(selectedTeacher === t.id ? null : t.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center font-display font-semibold text-white text-lg flex-shrink-0">{t.full_name?.charAt(0) || 'T'}</div>
                      <div>
                        <h3 className="font-display font-semibold text-xl text-navy-800 dark:text-white">{t.full_name}</h3>
                        <p className="text-sm text-ink-500 dark:text-ink-300">{details?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-ink-100 dark:bg-navy-700 px-3 py-1 rounded-full text-ink-600 dark:text-ink-300 font-medium">{teacherClasses.length} classes</span>
                      <button onClick={(e) => { e.stopPropagation(); setEditingTeacher(t.id); setEditTeacherName(t.full_name); }} className="text-brass-600 dark:text-brass-400 text-sm font-medium hover:underline">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); softDeleteTeacher(t.id); }} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Delete</button>
                      <svg className={`w-5 h-5 text-ink-400 transition-transform ${selectedTeacher === t.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  {selectedTeacher === t.id && (
                    <div className="border-t border-ink-200 dark:border-navy-600 p-6 bg-ink-50 dark:bg-navy-700/50">
                      <h4 className="font-semibold text-navy-800 dark:text-white mb-3">Assigned Classes & Subjects</h4>
                      {teacherClasses.length === 0 ? (
                        <div>
                          <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">No classes assigned yet.</p>
                          <button onClick={() => { setAssignTeacherId(t.id); setTab('assign'); }} className="bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">Assign to Class →</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teacherClasses.map((tc, idx) => (
                            <div key={idx} className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-ink-200 dark:border-navy-600">
                              <p className="font-medium text-navy-800 dark:text-white">🏫 {tc.class_name}</p>
                              <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">📘 {tc.subject_name}</p>
                              <p className="text-xs text-ink-500 dark:text-ink-300 mt-2">👨‍🎓 {tc.student_count || 0} students</p>
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
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Heart} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Create Parent Account</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Full Name *</label>
                <input type="text" placeholder="e.g. Mrs. Phiri" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Email *</label>
                <input type="email" placeholder="parent@school.com" value={newParentEmail} onChange={(e) => setNewParentEmail(e.target.value)} className={inputPlain} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">Password *</label>
                <input type="password" placeholder="Min. 6 characters" value={newParentPass} onChange={(e) => setNewParentPass(e.target.value)} className={inputPlain} />
              </div>
            </div>
            <button onClick={() => { playClick(); addParent(); }} className={primaryBtn}>Create Parent</button>
          </div>

          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Current Parents</h2>
          <div className="space-y-4">
            {parents.map((p) => {
              const details = parentDetails.find((pd) => pd.id === p.id);
              const linkedStudents = details?.students || [];
              const hasStudents = linkedStudents.length > 0;
              return (
                <div key={p.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 overflow-hidden hover:shadow-elevated transition-shadow duration-200">
                  <div className="p-6 cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-700/50 flex items-center justify-between" onClick={() => setSelectedParent(selectedParent === p.id ? null : p.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center font-display font-semibold text-white text-lg flex-shrink-0">{p.full_name?.charAt(0) || 'P'}</div>
                      <div>
                        <h3 className="font-display font-semibold text-xl text-navy-800 dark:text-white">{p.full_name}</h3>
                        <p className="text-sm text-ink-500 dark:text-ink-300">{details?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${hasStudents ? 'bg-forest-50 dark:bg-forest-700/20 text-forest-700 dark:text-forest-500' : 'bg-oxbrick-50 dark:bg-oxbrick-700/20 text-oxbrick-700 dark:text-oxbrick-500'}`}>
                        {hasStudents ? `✅ ${linkedStudents.length} student(s)` : '❌ No students'}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setEditingParent(p.id); setEditParentName(p.full_name); }} className="text-brass-600 dark:text-brass-400 text-sm font-medium hover:underline">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); softDeleteParent(p.id); }} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Delete</button>
                      <svg className={`w-5 h-5 text-ink-400 transition-transform ${selectedParent === p.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  {selectedParent === p.id && (
                    <div className="border-t border-ink-200 dark:border-navy-600 p-6 bg-ink-50 dark:bg-navy-700/50">
                      <h4 className="font-semibold text-navy-800 dark:text-white mb-3">Linked Students</h4>
                      {linkedStudents.length === 0 ? (
                        <div>
                          <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">No students linked.</p>
                          <button onClick={() => { setLinkParentId(p.id); setTab('link'); }} className="bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brass-100 dark:hover:bg-brass-700/30 transition-colors">Link to Student →</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {linkedStudents.map((s) => (
                            <div key={s.id} className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-ink-200 dark:border-navy-600">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-navy-800 dark:text-white">{s.display_name}</p>
                                  <p className="text-sm text-ink-500 dark:text-ink-300">#{s.student_number}</p>
                                  <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">🏫 {s.class_name || 'No class'}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); unlinkParent(s.id, p.id); }} className="text-oxbrick-600 dark:text-oxbrick-500 text-xs font-medium hover:underline">Unlink</button>
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

      {/* ===== SUBJECTS TAB ===== */}
      {tab === 'subjects' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={BookOpen} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Add Subject</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input type="text" placeholder="e.g. Mathematics" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className={inputPlain} />
              </div>
              <button onClick={() => { playClick(); addSubject(); }} className={primaryBtn}>Add Subject</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((s) => (
              <div key={s.id} className="bg-white dark:bg-navy-800 rounded-xl shadow-card border border-ink-200 dark:border-navy-600 p-4 text-center hover:shadow-elevated hover:scale-105 transition-all duration-300">
                <BookOpen className="w-10 h-10 text-brass-500 mx-auto" strokeWidth={1.75} />
                <p className="font-semibold mt-2 text-navy-800 dark:text-white">{s.name}</p>
                <div className="flex justify-center gap-3 mt-3">
                  <button onClick={() => { setEditingSubject(s.id); setEditSubjectName(s.name); }} className="text-brass-600 dark:text-brass-400 text-sm font-medium hover:underline">Edit</button>
                  <button onClick={() => deleteSubject(s.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ASSIGN TAB ===== */}
      {tab === 'assign' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Link2} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Assign Teacher to Class</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} className={inputPlain}>
                <option value="">Select class</option>
                {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)} className={inputPlain}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (<option key={t.id} value={t.id}>{t.full_name}</option>))}
              </select>
              <select value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)} className={inputPlain}>
                <option value="">Select subject</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <button onClick={() => { playClick(); assignTeacher(); }} className={primaryBtn}>Assign Teacher</button>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 overflow-hidden">
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white p-6 border-b border-ink-200 dark:border-navy-600">Current Assignments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy-700">
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider rounded-l-lg">Class</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-navy-700">
                  {assignmentsList.map((a) => (
                    <tr key={a.id} className="hover:bg-ink-50 dark:hover:bg-navy-700/50 transition-colors bg-white dark:bg-navy-800">
                      <td className="px-6 py-4">
                        <span className="bg-ink-100 dark:bg-navy-700 px-3 py-1 rounded-full text-sm text-ink-700 dark:text-ink-300">🏫 {a.classes?.name || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-ink-100 dark:bg-navy-700 px-3 py-1 rounded-full text-sm text-ink-700 dark:text-ink-300">👩‍🏫 {a.profiles?.full_name || 'Teacher'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-ink-100 dark:bg-navy-700 px-3 py-1 rounded-full text-sm text-ink-700 dark:text-ink-300">📘 {a.subjects?.name || 'Subject'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => unassignTeacher(a.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Unassign</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== LINK PARENT TAB ===== */}
      {tab === 'link' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card border border-ink-200 dark:border-navy-600 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon Icon={Heart} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Link Student to Parent</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <select value={linkStudentId} onChange={(e) => setLinkStudentId(e.target.value)} className={inputPlain}>
                <option value="">Select student</option>
                {unassignedStudents.map((s) => (<option key={s.id} value={s.id}>{s.display_name} ({s.student_number})</option>))}
              </select>
              <select value={linkParentId} onChange={(e) => setLinkParentId(e.target.value)} className={inputPlain}>
                <option value="">Select parent</option>
                {parents.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
              </select>
              <button onClick={() => { playClick(); handleLinkParent(); }} className={primaryBtn}>Link</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRASH TAB ===== */}
      {tab === 'trash' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SectionIcon Icon={Trash2} />
              <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Trash</h2>
            </div>
            <button onClick={() => fetchTrashItems()} className="bg-navy-700 hover:bg-navy-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
              <RotateCcw className="w-4 h-4" strokeWidth={1.75} /> Refresh
            </button>
          </div>

          {/* Deleted Classes */}
          {deletedClasses.length > 0 && (
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4">Deleted Classes ({deletedClasses.length})</h3>
              <div className="space-y-3">
                {deletedClasses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                    <div>
                      <p className="font-medium text-navy-800 dark:text-white">{c.name}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300">Grade: {c.grade || 'N/A'}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => restoreClass(c.id)} className="text-forest-600 dark:text-forest-500 text-sm font-medium hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Restore
                      </button>
                      <button onClick={() => permanentDeleteClass(c.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Permanent Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Students */}
          {deletedStudents.length > 0 && (
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4">Deleted Students ({deletedStudents.length})</h3>
              <div className="space-y-3">
                {deletedStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                    <div>
                      <p className="font-medium text-navy-800 dark:text-white">{s.display_name}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300">{s.student_number}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => restoreStudent(s.id)} className="text-forest-600 dark:text-forest-500 text-sm font-medium hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Restore
                      </button>
                      <button onClick={() => permanentDeleteStudent(s.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Permanent Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Teachers */}
          {deletedTeachers.length > 0 && (
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4">Deleted Teachers ({deletedTeachers.length})</h3>
              <div className="space-y-3">
                {deletedTeachers.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                    <div>
                      <p className="font-medium text-navy-800 dark:text-white">{t.full_name}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300">{t.email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => restoreTeacher(t.id)} className="text-forest-600 dark:text-forest-500 text-sm font-medium hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Restore
                      </button>
                      <button onClick={() => permanentDeleteTeacher(t.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Permanent Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Parents */}
          {deletedParents.length > 0 && (
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
              <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4">Deleted Parents ({deletedParents.length})</h3>
              <div className="space-y-3">
                {deletedParents.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-ink-50 dark:bg-navy-700 rounded-xl">
                    <div>
                      <p className="font-medium text-navy-800 dark:text-white">{p.full_name}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-300">{p.email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => restoreParent(p.id)} className="text-forest-600 dark:text-forest-500 text-sm font-medium hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Restore
                      </button>
                      <button onClick={() => permanentDeleteParent(p.id)} className="text-oxbrick-600 dark:text-oxbrick-500 text-sm font-medium hover:underline">Permanent Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deletedClasses.length === 0 && deletedStudents.length === 0 && deletedTeachers.length === 0 && deletedParents.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-navy-800 rounded-3xl border border-dashed border-ink-300 dark:border-navy-600">
              <Trash2 className="w-10 h-10 text-ink-300 dark:text-ink-500 mx-auto" strokeWidth={1.5} />
              <p className="text-ink-400 dark:text-ink-500 mt-4 text-base font-medium">Trash is empty.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== STATS TAB ===== */}
      {tab === 'stats' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <SectionIcon Icon={BarChart3} />
            <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">System Overview</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Classes', value: stats.classes, Icon: Building2, onClick: () => setTab('classes') },
              { label: 'Students', value: stats.students, Icon: GraduationCap, onClick: () => setTab('students') },
              { label: 'Teachers', value: stats.teachers, Icon: Users, onClick: () => setTab('teachers') },
              { label: 'Parents', value: parents.length, Icon: Heart, onClick: () => setTab('parents') },
            ].map(({ label, value, Icon, onClick }) => (
              <div key={label} onClick={onClick} className="bg-navy-700 rounded-2xl p-6 shadow-card text-white cursor-pointer hover:bg-navy-600 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-navy-200">{label}</p>
                  <Icon className="w-6 h-6 text-brass-400" strokeWidth={1.75} />
                </div>
                <p className="text-4xl md:text-5xl font-display font-semibold">{value ?? 0}</p>
                <p className="text-xs text-navy-300 mt-2">Click to view details →</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-6">
            <h3 className="font-display font-semibold text-navy-800 dark:text-white mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-ink-50 dark:bg-navy-700 rounded-xl p-4">
                <p className="text-sm text-ink-500 dark:text-ink-300">Subjects</p>
                <p className="text-2xl font-display font-semibold text-navy-800 dark:text-white">{subjects.length}</p>
              </div>
              <div className="bg-ink-50 dark:bg-navy-700 rounded-xl p-4">
                <p className="text-sm text-ink-500 dark:text-ink-300">Assignments</p>
                <p className="text-2xl font-display font-semibold text-navy-800 dark:text-white">{assignmentsList.length}</p>
              </div>
              <div className="bg-ink-50 dark:bg-navy-700 rounded-xl p-4">
                <p className="text-sm text-ink-500 dark:text-ink-300">Pending Tasks</p>
                <p className="text-2xl font-display font-semibold text-navy-800 dark:text-white">{totalPendingTasks}</p>
              </div>
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