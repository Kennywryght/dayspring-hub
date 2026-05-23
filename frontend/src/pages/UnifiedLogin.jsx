import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

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

export default function UnifiedLogin() {
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeacher, loginStudent, loginParent, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const playClick = useClickSound();

  // form state
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // visibility
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [showParentPass, setShowParentPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  const resetError = () => setError('');

  // Eye toggle icon
  const ToggleIcon = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a10.01 10.01 0 012.17-3.16m2.28-2.28A10.05 10.05 0 0112 5c5 0 9.27 3.11 11 7.5a10.01 10.01 0 01-2.17 3.16m-2.28 2.28L21 21M3 3l2.28 2.28" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  // Icons
  const EmailIcon = () => (
    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );

  /* ================= LOGIN HANDLERS ================= */
  // (identical to your existing code – no changes needed)
  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetError();
    try {
      const res = await fetch(`${API_URL}auth/teacher/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      loginTeacher(data);
      if (data.user.role === 'super_admin') navigate('/admin/dashboard');
      else navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetError();
    try {
      const res = await fetch(`${API_URL}auth/student/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_number: studentNumber, password: studentPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
      const data = await res.json();
      loginStudent(data);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetError();
    try {
      const res = await fetch(`${API_URL}auth/parent/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parentEmail, password: parentPassword }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      loginParent(data);
      navigate('/parent/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetError();
    try {
      const res = await fetch(`${API_URL}auth/admin/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
      const data = await res.json();
      loginAdmin(data);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ROLE SELECT SCREEN ================= */
  if (!role) {
    const roles = [
      { key: 'teacher', label: 'Teacher Portal', icon: '👩‍🏫', gradient: 'from-blue-600 to-indigo-600', shadowColor: 'shadow-blue-200' },
      { key: 'student', label: 'Student Portal', icon: '🎓', gradient: 'from-emerald-500 to-teal-600', shadowColor: 'shadow-emerald-200' },
      { key: 'parent', label: 'Parent Portal', icon: '👨‍👩‍👧', gradient: 'from-purple-600 to-violet-600', shadowColor: 'shadow-purple-200' },
      { key: 'admin', label: 'Admin Portal', icon: '⚙️', gradient: 'from-red-500 to-rose-600', shadowColor: 'shadow-rose-200' },
    ];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-200 dark:bg-blue-900/40 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-left pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/40 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-right pointer-events-none" />

        <div className="w-full max-w-5xl max-w-[100%] bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in-up z-10">
          <div className="grid lg:grid-cols-2">
            {/* Left Panel – Branding */}
            <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSI+PHBhdGggZD0iTS41LjVIMTkuNXYxOUguNXoiLz48cGF0aCBkPSJNNiA2aDh2OEg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 shadow-md mx-auto mb-4">
                  <img src="/logo.jpg" alt="Dayspring Hub Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-5xl font-black leading-tight mb-6">
                  Welcome to
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    Dayspring Hub
                  </span>
                </h1>
                <p className="text-lg text-gray-300 mb-8">A unified digital learning system for teachers, students, parents, and administrators.</p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-gray-900 text-xs">✓</span> Assignments & Learning Materials</li>
                  <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-gray-900 text-xs">✓</span> Real‑time communication</li>
                  <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-gray-900 text-xs">✓</span> Secure academic management</li>
                </ul>
              </div>
            </div>

            {/* Right Panel – Role Selection */}
            <div className="p-6 sm:p-8 md:p-12 animate-fade-in-right">
              {/* Logo for small screens */}
              <div className="lg:hidden flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200 shadow-md">
                  <img src="/logo.jpg" alt="Dayspring Hub Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-2">Choose Your Role</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8 sm:mb-10">Select your portal to continue</p>
              <div className="space-y-4">
                {roles.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => { playClick(); setRole(r.key); }}
                    className={`w-full group flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r ${r.gradient} text-white shadow-lg ${r.shadowColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                  >
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">{r.icon}</span>
                    <span className="text-base sm:text-lg font-bold">{r.label}</span>
                    <span className="ml-auto text-xl sm:text-2xl opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                ))}
              </div>
              <button onClick={() => navigate('/')} className="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white w-full transition-colors">← Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= LOGIN FORM ================= */
  const roleConfig = {
    teacher: { gradient: 'from-blue-600 to-indigo-600', accent: 'blue', title: 'Teacher Login', icon: '👩‍🏫', ringColor: 'focus:ring-blue-200', borderColor: 'focus:border-blue-500' },
    student: { gradient: 'from-emerald-500 to-teal-600', accent: 'emerald', title: 'Student Login', icon: '🎓', ringColor: 'focus:ring-emerald-200', borderColor: 'focus:border-emerald-500' },
    parent: { gradient: 'from-purple-600 to-violet-600', accent: 'purple', title: 'Parent Login', icon: '👨‍👩‍👧', ringColor: 'focus:ring-purple-200', borderColor: 'focus:border-purple-500' },
    admin: { gradient: 'from-red-500 to-rose-600', accent: 'rose', title: 'Admin Login', icon: '⚙️', ringColor: 'focus:ring-rose-200', borderColor: 'focus:border-rose-500' },
  };

  const currentRole = roleConfig[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-200 dark:bg-blue-900/40 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-left pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/40 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-right pointer-events-none" />

      <div className="w-full max-w-md max-w-[100%] relative z-10 animate-fade-in-up">
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r ${currentRole.gradient} rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-500`}></div>
          <div className="relative bg-white dark:bg-gray-800 backdrop-blur-sm rounded-[2.5rem] shadow-2xl border border-white/60 dark:border-gray-700 overflow-hidden min-h-[560px]">
            {/* Header */}
            <div className={`bg-gradient-to-r ${currentRole.gradient} px-8 py-8 text-white`}>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-md">
                  <img src="/logo.jpg" alt="Dayspring Hub Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-3xl font-black flex items-center gap-3 justify-center">
                <span className="text-4xl">{currentRole.icon}</span>
                {currentRole.title}
              </h2>
              <p className="mt-2 text-white/80 text-sm text-center">Enter your credentials to continue</p>
            </div>

            {/* Form body */}
            <div className="p-8 flex flex-col justify-center flex-grow">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2 animate-fade-in-up">
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
              } className="space-y-6">
                {/* Teacher fields */}
                {role === 'teacher' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <EmailIcon />
                        </div>
                        <input
                          type="email"
                          value={teacherEmail}
                          onChange={(e) => setTeacherEmail(e.target.value)}
                          required
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="teacher@school.com"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockIcon />
                        </div>
                        <input
                          type={showTeacherPass ? 'text' : 'password'}
                          value={teacherPassword}
                          onChange={(e) => setTeacherPassword(e.target.value)}
                          required
                          className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="••••••••"
                        />
                        <ToggleIcon show={showTeacherPass} onClick={() => setShowTeacherPass(!showTeacherPass)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Student fields */}
                {role === 'student' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Student Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserIcon />
                        </div>
                        <input
                          value={studentNumber}
                          onChange={(e) => setStudentNumber(e.target.value)}
                          required
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="e.g. STU12345"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockIcon />
                        </div>
                        <input
                          type={showStudentPass ? 'text' : 'password'}
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          required
                          className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="••••••••"
                        />
                        <ToggleIcon show={showStudentPass} onClick={() => setShowStudentPass(!showStudentPass)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Parent fields */}
                {role === 'parent' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <EmailIcon />
                        </div>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          required
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="parent@example.com"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockIcon />
                        </div>
                        <input
                          type={showParentPass ? 'text' : 'password'}
                          value={parentPassword}
                          onChange={(e) => setParentPassword(e.target.value)}
                          required
                          className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="••••••••"
                        />
                        <ToggleIcon show={showParentPass} onClick={() => setShowParentPass(!showParentPass)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Admin fields */}
                {role === 'admin' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <EmailIcon />
                        </div>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          required
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="admin@school.com"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockIcon />
                        </div>
                        <input
                          type={showAdminPass ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          required
                          className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-600 ${currentRole.borderColor} ${currentRole.ringColor} focus:ring-4 outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="••••••••"
                        />
                        <ToggleIcon show={showAdminPass} onClick={() => setShowAdminPass(!showAdminPass)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 overflow-hidden group`}
                >
                  <span className={`absolute inset-0 bg-gradient-to-r ${currentRole.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in…
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => { setRole(null); resetError(); }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Choose different role
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float-left {
          0%, 100% { transform: translate(-20%, -20%) rotate(0deg); }
          50% { transform: translate(-10%, -30%) rotate(5deg); }
        }
        @keyframes float-right {
          0%, 100% { transform: translate(20%, 20%) rotate(0deg); }
          50% { transform: translate(30%, 10%) rotate(-5deg); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-float-left { animation: float-left 20s infinite linear; }
        .animate-float-right { animation: float-right 25s infinite linear; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .animate-fade-in-left { animation: fade-in-left 0.6s ease-out both; }
        .animate-fade-in-right { animation: fade-in-right 0.6s ease-out both; }
      `}</style>
    </div>
  );
}