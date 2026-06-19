import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const rawBase = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';
const API_URL = rawBase.endsWith('/') ? rawBase : rawBase + '/';

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

export default function UnifiedLogin() {
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeacher, loginStudent, loginParent, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const playClick = useClickSound();

  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [showParentPass, setShowParentPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  const resetError = () => setError('');

  const EyeIcon = ({ show, onClick }) => (
    <button type="button" onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );

  const handleTeacherLogin = async (e) => {
    e.preventDefault(); setLoading(true); resetError();
    try {
      const res = await fetch(`${API_URL}auth/teacher/login/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      loginTeacher(data);
      if (data.user.role === 'super_admin') navigate('/admin/dashboard');
      else navigate('/teacher/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault(); setLoading(true); resetError();
    try {
      const res = await fetch(`${API_URL}auth/student/login/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_number: studentNumber, password: studentPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
      const data = await res.json();
      loginStudent(data);
      navigate('/student/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleParentLogin = async (e) => {
    e.preventDefault(); setLoading(true); resetError();
    try {
      const res = await fetch(`${API_URL}auth/parent/login/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parentEmail, password: parentPassword }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      loginParent(data);
      navigate('/parent/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault(); setLoading(true); resetError();
    try {
      const res = await fetch(`${API_URL}auth/admin/login/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
      const data = await res.json();
      loginAdmin(data);
      navigate('/admin/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  /* ================= ROLE SELECT SCREEN ================= */
  if (!role) {
    const roles = [
      { key: 'teacher', label: 'Teacher', desc: 'Manage classes, materials & assignments', icon: '👩‍🏫', color: 'from-blue-500 to-indigo-600', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', border: 'hover:border-blue-300 dark:hover:border-blue-700' },
      { key: 'student', label: 'Student', desc: 'Access learning materials & submit work', icon: '🎓', color: 'from-emerald-500 to-teal-600', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20', border: 'hover:border-emerald-300 dark:hover:border-emerald-700' },
      { key: 'parent', label: 'Parent', desc: 'Monitor your child\'s progress', icon: '👨‍👩‍👧', color: 'from-purple-500 to-violet-600', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20', border: 'hover:border-purple-300 dark:hover:border-purple-700' },
      { key: 'admin', label: 'Admin', desc: 'System management & configuration', icon: '⚙️', color: 'from-rose-500 to-red-600', bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/20', border: 'hover:border-rose-300 dark:hover:border-rose-700' },
    ];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
              <img src="/logo.jpg" alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              Dayspring<span className="text-blue-600 dark:text-blue-400"> Hub</span>
            </h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Select your role to continue</p>
          </div>

          {/* Role Cards */}
          <div className="space-y-3">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => { playClick(); setRole(r.key); }}
                className={`w-full flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 ${r.bg} ${r.border} transition-all duration-200 hover:shadow-md group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0`}>
                  {r.icon}
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{r.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{r.desc}</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-sm text-gray-400 dark:text-gray-500">
            <button onClick={() => navigate('/')} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              ← Back to Home
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ================= LOGIN FORM ================= */
  const roleConfig = {
    teacher: { color: 'from-blue-500 to-indigo-600', icon: '👩‍🏫', title: 'Teacher Sign In', placeholder: 'teacher@school.com' },
    student: { color: 'from-emerald-500 to-teal-600', icon: '🎓', title: 'Student Sign In', placeholder: 'Student number' },
    parent: { color: 'from-purple-500 to-violet-600', icon: '👨‍👩‍👧', title: 'Parent Sign In', placeholder: 'parent@email.com' },
    admin: { color: 'from-rose-500 to-red-600', icon: '⚙️', title: 'Admin Sign In', placeholder: 'admin@school.com' },
  };

  const current = roleConfig[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => { setRole(null); resetError(); }}
          className="mb-6 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Choose different role
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${current.color} p-8 text-white text-center`}>
            <span className="text-5xl block mb-3">{current.icon}</span>
            <h2 className="text-2xl font-black">{current.title}</h2>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={
              role === 'teacher' ? handleTeacherLogin :
              role === 'student' ? handleStudentLogin :
              role === 'parent' ? handleParentLogin :
              handleAdminLogin
            } className="space-y-5">
              {/* Teacher */}
              {role === 'teacher' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                    <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="teacher@school.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showTeacherPass ? 'text' : 'password'} value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} required
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="••••••••" />
                      <EyeIcon show={showTeacherPass} onClick={() => setShowTeacherPass(!showTeacherPass)} />
                    </div>
                  </div>
                </>
              )}

              {/* Student */}
              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Student Number</label>
                    <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="e.g. S001" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showStudentPass ? 'text' : 'password'} value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="••••••••" />
                      <EyeIcon show={showStudentPass} onClick={() => setShowStudentPass(!showStudentPass)} />
                    </div>
                  </div>
                </>
              )}

              {/* Parent */}
              {role === 'parent' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                    <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="parent@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showParentPass ? 'text' : 'password'} value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} required
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="••••••••" />
                      <EyeIcon show={showParentPass} onClick={() => setShowParentPass(!showParentPass)} />
                    </div>
                  </div>
                </>
              )}

              {/* Admin */}
              {role === 'admin' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="admin@school.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showAdminPass ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="••••••••" />
                      <EyeIcon show={showAdminPass} onClick={() => setShowAdminPass(!showAdminPass)} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${current.color} text-white font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}