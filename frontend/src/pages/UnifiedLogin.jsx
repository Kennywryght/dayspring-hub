import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  UserRound,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Mail,
  CheckCircle2,
} from 'lucide-react';

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

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const resetErrorState = () => setError('');

  const EyeToggle = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-navy-600 transition-colors"
    >
      {show ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
    </button>
  );

  // ===== FORGOT PASSWORD =====
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    
    try {
      // Determine which endpoint to use based on the current role
      let endpoint = '';
      if (role === 'teacher') endpoint = 'auth/teacher/forgot-password';
      else if (role === 'parent') endpoint = 'auth/parent/forgot-password';
      else if (role === 'admin') endpoint = 'auth/admin/forgot-password';
      else endpoint = 'auth/student/forgot-password';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      
      if (response.ok) {
        setResetSent(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setResetError(data.detail || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setResetError('Network error. Please check your connection.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetSent(false);
    setResetEmail('');
    setResetError('');
  };

  // ===== LOGIN HANDLERS =====
  const handleTeacherLogin = async (e) => {
    e.preventDefault(); setLoading(true); resetErrorState();
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
    e.preventDefault(); setLoading(true); resetErrorState();
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
    e.preventDefault(); setLoading(true); resetErrorState();
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
    e.preventDefault(); setLoading(true); resetErrorState();
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

  const roleConfig = {
    teacher: {
      label: 'Teacher', desc: 'Manage classes, materials & assignments', Icon: BookOpen,
      title: 'Teacher Sign In', placeholder: 'teacher@school.com',
      solid: 'bg-navy-700 hover:bg-navy-800', ring: 'focus:border-navy-500 focus:ring-navy-100 dark:focus:ring-navy-500/20',
      iconBg: 'bg-navy-50 dark:bg-navy-700/40 text-navy-700 dark:text-navy-200',
      cardBorder: 'hover:border-navy-300 dark:hover:border-navy-500',
      formBorder: 'border-navy-300 dark:border-navy-500',
    },
    student: {
      label: 'Student', desc: 'Access learning materials & submit work', Icon: GraduationCap,
      title: 'Student Sign In', placeholder: 'Student number',
      solid: 'bg-forest-600 hover:bg-forest-700', ring: 'focus:border-forest-500 focus:ring-forest-50 dark:focus:ring-forest-500/20',
      iconBg: 'bg-forest-50 dark:bg-forest-700/20 text-forest-600 dark:text-forest-500',
      cardBorder: 'hover:border-forest-300 dark:hover:border-forest-600',
      formBorder: 'border-forest-300 dark:border-forest-500',
    },
    parent: {
      label: 'Parent', desc: "Monitor your child's progress", Icon: UserRound,
      title: 'Parent Sign In', placeholder: 'parent@email.com',
      solid: 'bg-brass-600 hover:bg-brass-700', ring: 'focus:border-brass-500 focus:ring-brass-50 dark:focus:ring-brass-500/20',
      iconBg: 'bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-300',
      cardBorder: 'hover:border-brass-300 dark:hover:border-brass-600',
      formBorder: 'border-brass-300 dark:border-brass-500',
    },
    admin: {
      label: 'Admin', desc: 'System management & configuration', Icon: ShieldCheck,
      title: 'Admin Sign In', placeholder: 'admin@school.com',
      solid: 'bg-oxbrick-600 hover:bg-oxbrick-700', ring: 'focus:border-oxbrick-500 focus:ring-oxbrick-50 dark:focus:ring-oxbrick-500/20',
      iconBg: 'bg-oxbrick-50 dark:bg-oxbrick-700/20 text-oxbrick-600 dark:text-oxbrick-500',
      cardBorder: 'hover:border-oxbrick-300 dark:hover:border-oxbrick-600',
      formBorder: 'border-oxbrick-300 dark:border-oxbrick-500',
    },
  };

  // ==================== FORGOT PASSWORD SCREEN ====================
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4 sm:p-6">
        <div className="w-full max-w-md">
          <button 
            onClick={handleBackToLogin}
            className="mb-6 text-sm text-ink-400 dark:text-ink-500 hover:text-navy-700 dark:hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Back to Login
          </button>

          <div className="bg-white dark:bg-navy-800 rounded-3xl border-2 border-brass-300 dark:border-brass-500 shadow-elevated overflow-hidden">
            <div className="bg-navy-800 dark:bg-navy-700 p-9 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-300">
                <Mail className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl font-display font-semibold text-white">Reset Password</h2>
              <p className="text-ink-300 mt-2 text-sm">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <div className="p-9">
              {resetSent ? (
                <div className="bg-forest-50 dark:bg-forest-700/20 border border-forest-200 dark:border-forest-700/40 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-forest-600 dark:text-forest-500 mx-auto mb-3" strokeWidth={1.75} />
                  <h3 className="font-semibold text-forest-800 dark:text-forest-300">Check Your Email</h3>
                  <p className="text-sm text-forest-600 dark:text-forest-400 mt-2">
                    We've sent a password reset link to <strong>{resetEmail}</strong>
                  </p>
                  <button 
                    onClick={handleBackToLogin}
                    className="mt-4 text-brass-600 dark:text-brass-400 font-semibold hover:underline transition-colors"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {resetError && (
                    <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 border border-oxbrick-200 dark:border-oxbrick-700/40 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-oxbrick-600 dark:text-oxbrick-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                      <p className="text-sm text-oxbrick-700 dark:text-oxbrick-300">{resetError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-brass-600 hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-2xl shadow-soft transition-colors duration-150 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Sending...</>
                    ) : (
                      <>Send Reset Link <ChevronRight className="w-4 h-4" strokeWidth={1.75} /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= ROLE SELECT SCREEN ================= */
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-navy-800 shadow-card border border-brass-500/30 mb-5">
              <img src="/logo.jpg" alt="Dayspring Hub" className="w-11 h-11 rounded-xl object-cover" />
            </div>
            <h1 className="text-3xl font-display font-semibold text-navy-800 dark:text-white">
              Dayspring <span className="text-brass-500">Hub</span>
            </h1>
            <div className="w-16 h-px bg-brass-500 mx-auto mt-3 mb-3" />
            <p className="text-ink-500 dark:text-ink-300 text-sm">Select your role to continue</p>
          </div>

          <div className="space-y-3">
            {Object.entries(roleConfig).map(([key, r]) => (
              <button
                key={key}
                onClick={() => { playClick(); setRole(key); }}
                className={`w-full flex items-center gap-4 p-5 bg-white dark:bg-navy-800 rounded-2xl border border-ink-200 dark:border-navy-600 ${r.cardBorder} transition-colors duration-150 group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${r.iconBg}`}>
                  <r.Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-navy-800 dark:text-white text-sm">{r.label}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300">{r.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-300 dark:text-ink-500 group-hover:translate-x-0.5 transition-transform duration-150" strokeWidth={1.75} />
              </button>
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-brass-600 dark:text-brass-400 hover:underline font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <p className="text-center mt-8 text-sm">
            <button onClick={() => navigate('/')} className="text-ink-400 dark:text-ink-500 hover:text-navy-700 dark:hover:text-white transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Back to Home
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ================= LOGIN FORM ================= */
  const current = roleConfig[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <button onClick={() => { setRole(null); resetErrorState(); }} className="mb-6 text-sm text-ink-400 dark:text-ink-500 hover:text-navy-700 dark:hover:text-white transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Choose different role
        </button>

        <div className={`bg-white dark:bg-navy-800 rounded-3xl border-2 ${current.formBorder} shadow-elevated overflow-hidden`}>
          <div className="bg-navy-800 dark:bg-navy-700 p-9 text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${current.iconBg}`}>
              <current.Icon className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-display font-semibold text-white">{current.title}</h2>
          </div>

          <div className="p-9">
            {error && (
              <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 border border-oxbrick-200 dark:border-oxbrick-700/40 text-oxbrick-600 dark:text-oxbrick-500 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} /> {error}
              </div>
            )}

            <form onSubmit={role === 'teacher' ? handleTeacherLogin : role === 'student' ? handleStudentLogin : role === 'parent' ? handleParentLogin : handleAdminLogin} className="space-y-4">
              {role === 'teacher' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Email address</label>
                    <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} required
                      className={`w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                      placeholder="teacher@school.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showTeacherPass ? 'text' : 'password'} value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} required
                        className={`w-full px-4 py-3 pr-11 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                        placeholder="••••••••" />
                      <EyeToggle show={showTeacherPass} onClick={() => setShowTeacherPass(!showTeacherPass)} />
                    </div>
                  </div>
                </>
              )}

              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Student Number</label>
                    <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required
                      className={`w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                      placeholder="e.g. S001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showStudentPass ? 'text' : 'password'} value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required
                        className={`w-full px-4 py-3 pr-11 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                        placeholder="••••••••" />
                      <EyeToggle show={showStudentPass} onClick={() => setShowStudentPass(!showStudentPass)} />
                    </div>
                  </div>
                </>
              )}

              {role === 'parent' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Email address</label>
                    <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required
                      className={`w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                      placeholder="parent@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showParentPass ? 'text' : 'password'} value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} required
                        className={`w-full px-4 py-3 pr-11 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                        placeholder="••••••••" />
                      <EyeToggle show={showParentPass} onClick={() => setShowParentPass(!showParentPass)} />
                    </div>
                  </div>
                </>
              )}

              {role === 'admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Email address</label>
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required
                      className={`w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                      placeholder="admin@school.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showAdminPass ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required
                        className={`w-full px-4 py-3 pr-11 rounded-xl border border-ink-200 dark:border-navy-600 ${current.ring} focus:ring-4 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`}
                        placeholder="••••••••" />
                      <EyeToggle show={showAdminPass} onClick={() => setShowAdminPass(!showAdminPass)} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-brass-600 dark:text-brass-400 hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </button>
                <span className="text-xs text-ink-400 dark:text-ink-500">Need help? Contact support</span>
              </div>

              <button type="submit" disabled={loading}
                className={`w-full py-3.5 rounded-xl ${current.solid} text-white font-semibold text-sm shadow-soft transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Signing in...</>) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}