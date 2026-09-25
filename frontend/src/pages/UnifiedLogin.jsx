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
  Lock,
  AtSign,
  Hash,
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

/* ---------- Small reusable pieces ---------- */

const EyeToggle = ({ show, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={show ? 'Hide password' : 'Show password'}
    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-navy-600 transition-colors"
  >
    {show ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
  </button>
);

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none"
          strokeWidth={1.75}
        />
      )}
      {children}
    </div>
  </div>
);

const inputClasses = (ring, withIcon) =>
  `w-full ${withIcon ? 'pl-11' : 'pl-4'} pr-11 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 ${ring} focus:ring-4 outline-none transition-all duration-150 bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500`;

/* ---------- Main component ---------- */

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

  // Forgot Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const resetErrorState = () => setError('');

  /* ===== FORGOT PASSWORD ===== */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');

    try {
      let endpoint = '';
      if (role === 'teacher') endpoint = 'auth/teacher/forgot-password';
      else if (role === 'parent') endpoint = 'auth/parent/forgot-password';
      else if (role === 'admin') endpoint = 'auth/admin/forgot-password';
      else endpoint = 'auth/student/forgot-password';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
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

  /* ===== LOGIN HANDLERS ===== */
  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrorState();
    try {
      const res = await fetch(`${API_URL}auth/teacher/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      loginTeacher(data);
      if (data.user.role === 'super_admin') navigate('/admin');
      else navigate('/teacher');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrorState();
    try {
      const res = await fetch(`${API_URL}auth/student/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_number: studentNumber, password: studentPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
      const data = await res.json();
      loginStudent(data);
      navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrorState();
    try {
      const res = await fetch(`${API_URL}auth/parent/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parentEmail, password: parentPassword }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      loginParent(data);
      navigate('/parent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrorState();
    try {
      const res = await fetch(`${API_URL}auth/admin/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Invalid credentials');
      const data = await res.json();
      loginAdmin(data);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    teacher: {
      label: 'Teacher',
      desc: 'Manage classes, materials & assignments',
      Icon: BookOpen,
      title: 'Teacher Sign In',
      placeholder: 'teacher@school.com',
      solid: 'bg-navy-700 hover:bg-navy-800',
      ring: 'focus:border-navy-500 focus:ring-navy-100 dark:focus:ring-navy-500/20',
      iconBg: 'from-navy-500 to-navy-700',
      iconSoft: 'bg-navy-50 dark:bg-navy-700/40 text-navy-700 dark:text-navy-200',
      cardHover: 'hover:border-navy-300 dark:hover:border-navy-500',
      formBorder: 'border-navy-200 dark:border-navy-600',
      glow: 'from-navy-400/25 to-navy-600/10',
    },
    student: {
      label: 'Student',
      desc: 'Access learning materials & submit work',
      Icon: GraduationCap,
      title: 'Student Sign In',
      placeholder: 'Student number',
      solid: 'bg-forest-600 hover:bg-forest-700',
      ring: 'focus:border-forest-500 focus:ring-forest-50 dark:focus:ring-forest-500/20',
      iconBg: 'from-forest-500 to-forest-700',
      iconSoft: 'bg-forest-50 dark:bg-forest-700/20 text-forest-600 dark:text-forest-500',
      cardHover: 'hover:border-forest-300 dark:hover:border-forest-600',
      formBorder: 'border-forest-200 dark:border-forest-600',
      glow: 'from-forest-400/25 to-forest-600/10',
    },
    parent: {
      label: 'Parent',
      desc: "Monitor your child's progress",
      Icon: UserRound,
      title: 'Parent Sign In',
      placeholder: 'parent@email.com',
      solid: 'bg-brass-600 hover:bg-brass-700',
      ring: 'focus:border-brass-500 focus:ring-brass-50 dark:focus:ring-brass-500/20',
      iconBg: 'from-brass-500 to-brass-700',
      iconSoft: 'bg-brass-50 dark:bg-brass-700/20 text-brass-700 dark:text-brass-300',
      cardHover: 'hover:border-brass-300 dark:hover:border-brass-600',
      formBorder: 'border-brass-200 dark:border-brass-600',
      glow: 'from-brass-400/25 to-brass-600/10',
    },
    admin: {
      label: 'Admin',
      desc: 'System management & configuration',
      Icon: ShieldCheck,
      title: 'Admin Sign In',
      placeholder: 'admin@school.com',
      solid: 'bg-oxbrick-600 hover:bg-oxbrick-700',
      ring: 'focus:border-oxbrick-500 focus:ring-oxbrick-50 dark:focus:ring-oxbrick-500/20',
      iconBg: 'from-oxbrick-500 to-oxbrick-700',
      iconSoft: 'bg-oxbrick-50 dark:bg-oxbrick-700/20 text-oxbrick-600 dark:text-oxbrick-500',
      cardHover: 'hover:border-oxbrick-300 dark:hover:border-oxbrick-600',
      formBorder: 'border-oxbrick-200 dark:border-oxbrick-600',
      glow: 'from-oxbrick-400/25 to-oxbrick-600/10',
    },
  };

  /* ==================== FORGOT PASSWORD SCREEN ==================== */
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4 sm:p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <button
            onClick={handleBackToLogin}
            className="mb-6 text-sm text-ink-400 dark:text-ink-500 hover:text-navy-700 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Back to Login
          </button>

          <div className="bg-white dark:bg-navy-800 rounded-3xl border border-ink-200 dark:border-navy-700 shadow-elevated overflow-hidden">
            <div className="relative bg-navy-800 dark:bg-navy-950 p-8 sm:p-9 text-center overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-brass-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-brass-500 to-brass-700 text-white shadow-soft">
                  <Mail className="w-7 h-7" strokeWidth={1.75} />
                </div>
                <h2 className="text-2xl font-display font-semibold text-white">Reset Password</h2>
                <p className="text-ink-300 mt-2 text-sm max-w-xs mx-auto">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>
            </div>

            <div className="p-7 sm:p-9">
              {resetSent ? (
                <div className="bg-forest-50 dark:bg-forest-700/20 border border-forest-200 dark:border-forest-700/40 rounded-2xl p-6 text-center animate-fade-in-up">
                  <CheckCircle2 className="w-12 h-12 text-forest-600 dark:text-forest-500 mx-auto mb-3" strokeWidth={1.75} />
                  <h3 className="font-semibold text-forest-800 dark:text-forest-300">Check Your Email</h3>
                  <p className="text-sm text-forest-600 dark:text-forest-400 mt-2">
                    We've sent a password reset link to <strong className="break-all">{resetEmail}</strong>
                  </p>
                  <button
                    onClick={handleBackToLogin}
                    className="mt-4 text-brass-600 dark:text-brass-400 font-semibold hover:underline transition-colors"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  {resetError && (
                    <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 border border-oxbrick-200 dark:border-oxbrick-700/40 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-oxbrick-600 dark:text-oxbrick-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                      <p className="text-sm text-oxbrick-700 dark:text-oxbrick-300">{resetError}</p>
                    </div>
                  )}

                  <Field label="Email Address" icon={Mail}>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={inputClasses('focus:border-brass-500 focus:ring-brass-50 dark:focus:ring-brass-500/20', true)}
                      placeholder="your@email.com"
                      required
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-brass-600 hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-2xl shadow-soft transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Sending...</>
                    ) : (
                      <>Send Reset Link <ChevronRight className="w-4 h-4" strokeWidth={2} /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .animate-fade-in-up{animation:fade-in-up 0.5s ease-out both}
          @media (prefers-reduced-motion: reduce){ .animate-fade-in-up{animation:none !important} }
        `}</style>
      </div>
    );
  }

  /* ================= ROLE SELECT SCREEN — 2×2 GRID ================= */
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-navy-800 shadow-card border border-brass-500/30 mb-5">
              <img src="/logo.jpeg" alt="Dayspring Hub" className="w-11 h-11 rounded-xl object-cover" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-semibold text-navy-800 dark:text-white">
              Dayspring <span className="text-brass-500">Hub</span>
            </h1>
            <div className="w-16 h-px bg-brass-500 mx-auto mt-3 mb-3" />
            <p className="text-ink-500 dark:text-ink-300 text-sm sm:text-base">Select your role to continue</p>
          </div>

          {/* Role cards — 2 rows × 2 columns */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Object.entries(roleConfig).map(([key, r], i) => (
              <button
                key={key}
                onClick={() => { playClick(); setRole(key); }}
                style={{ animationDelay: `${i * 0.06}s` }}
                className={`group relative w-full overflow-hidden flex flex-col items-start gap-3 p-4 sm:p-5 bg-white dark:bg-navy-800 rounded-2xl border border-ink-200 dark:border-navy-600 ${r.cardHover} transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.99] animate-fade-in-up text-left`}
              >
                {/* Soft glow on hover */}
                <div className={`pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${r.glow} opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300`} />

                {/* Icon chip + arrow row */}
                <div className="relative w-full flex items-start justify-between">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${r.iconBg} text-white shadow-soft group-hover:scale-105 transition-transform duration-200`}>
                    <r.Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-ink-100 dark:bg-navy-700 text-ink-500 dark:text-ink-400 group-hover:bg-navy-700 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-navy-800 transition-all duration-200">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2} />
                  </div>
                </div>

                {/* Text */}
                <div className="relative min-w-0">
                  <h3 className="font-semibold text-navy-800 dark:text-white text-sm sm:text-base leading-tight">
                    {r.label}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-ink-500 dark:text-ink-300 leading-snug mt-1">
                    {r.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-7">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-brass-600 dark:text-brass-400 hover:underline font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <p className="text-center mt-8 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-ink-400 dark:text-ink-500 hover:text-navy-700 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Back to Home
            </button>
          </p>
        </div>

        <style>{`
          @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .animate-fade-in-up{animation:fade-in-up 0.5s ease-out both}
          @media (prefers-reduced-motion: reduce){ .animate-fade-in-up{animation:none !important} }
        `}</style>
      </div>
    );
  }

  /* ================= LOGIN FORM ================= */
  const current = roleConfig[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4 sm:p-6">
      {/* Reduced width: max-w-3xl instead of max-w-5xl */}
      <div className="w-full max-w-3xl">
        <button
          onClick={() => { setRole(null); resetErrorState(); }}
          className="mb-6 text-sm text-ink-400 dark:text-ink-500 hover:text-navy-700 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Choose different role
        </button>

        <div className="bg-white dark:bg-navy-800 rounded-3xl border border-ink-200 dark:border-navy-700 shadow-elevated overflow-hidden grid lg:grid-cols-2 animate-fade-in-up">
          {/* Left: brand panel — taller via increased padding */}
          <div className="relative hidden lg:flex flex-col justify-between bg-navy-800 dark:bg-navy-950 p-8 xl:p-10 min-h-[520px] overflow-hidden">
            <div className={`absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br ${current.glow} blur-3xl`} />
            <div className={`absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-gradient-to-tr ${current.glow} blur-3xl`} />

            <div className="relative">
              <div className="flex items-center gap-2.5 mb-10">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-brass-500/30">
                  <img src="/logo.jpeg" alt="Dayspring Hub" className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-display font-semibold text-white">
                  Dayspring<span className="text-brass-400"> Hub</span>
                </span>
              </div>

              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br ${current.iconBg} text-white shadow-soft`}>
                <current.Icon className="w-8 h-8" strokeWidth={1.75} />
              </div>

              <h2 className="text-3xl font-display font-semibold text-white leading-tight">
                {current.title}
              </h2>
              <p className="text-ink-300 mt-3 text-sm leading-relaxed max-w-sm">
                {current.desc}. Sign in to continue to your personalized dashboard.
              </p>
            </div>

            <div className="relative flex items-center gap-3 text-xs text-ink-400">
              <ShieldCheck className="w-4 h-4 text-brass-400" strokeWidth={1.75} />
              Secure, encrypted sign-in
            </div>
          </div>

          {/* Right: form — taller via increased vertical padding */}
          <div className="p-7 sm:p-9 xl:p-10 flex flex-col justify-center min-h-[520px]">
            {/* Mobile-only header */}
            <div className="lg:hidden text-center mb-7">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br ${current.iconBg} text-white shadow-soft`}>
                <current.Icon className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-semibold text-navy-800 dark:text-white">
                {current.title}
              </h2>
            </div>

            {error && (
              <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 border border-oxbrick-200 dark:border-oxbrick-700/40 text-oxbrick-600 dark:text-oxbrick-500 px-4 py-3 rounded-2xl text-sm mb-6 flex items-center gap-2 animate-fade-in-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={
                role === 'teacher' ? handleTeacherLogin
                : role === 'student' ? handleStudentLogin
                : role === 'parent' ? handleParentLogin
                : handleAdminLogin
              }
              className="space-y-5"
            >
              {role === 'teacher' && (
                <>
                  <Field label="Email address" icon={AtSign}>
                    <input
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="teacher@school.com"
                    />
                  </Field>
                  <Field label="Password" icon={Lock}>
                    <input
                      type={showTeacherPass ? 'text' : 'password'}
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="••••••••"
                    />
                    <EyeToggle show={showTeacherPass} onClick={() => setShowTeacherPass(!showTeacherPass)} />
                  </Field>
                </>
              )}

              {role === 'student' && (
                <>
                  <Field label="Student Number" icon={Hash}>
                    <input
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="e.g. S001"
                    />
                  </Field>
                  <Field label="Password" icon={Lock}>
                    <input
                      type={showStudentPass ? 'text' : 'password'}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="••••••••"
                    />
                    <EyeToggle show={showStudentPass} onClick={() => setShowStudentPass(!showStudentPass)} />
                  </Field>
                </>
              )}

              {role === 'parent' && (
                <>
                  <Field label="Email address" icon={AtSign}>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="parent@email.com"
                    />
                  </Field>
                  <Field label="Password" icon={Lock}>
                    <input
                      type={showParentPass ? 'text' : 'password'}
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="••••••••"
                    />
                    <EyeToggle show={showParentPass} onClick={() => setShowParentPass(!showParentPass)} />
                  </Field>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Field label="Email address" icon={AtSign}>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="admin@school.com"
                    />
                  </Field>
                  <Field label="Password" icon={Lock}>
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className={inputClasses(current.ring, true)}
                      placeholder="••••••••"
                    />
                    <EyeToggle show={showAdminPass} onClick={() => setShowAdminPass(!showAdminPass)} />
                  </Field>
                </>
              )}

              <div className="flex items-center justify-between mt-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-brass-600 dark:text-brass-400 hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </button>
                <span className="text-xs text-ink-400 dark:text-ink-500 hidden sm:inline">Need help? Contact support</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl ${current.solid} text-white font-semibold text-sm shadow-soft transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> Signing in...</>
                ) : (
                  <>Sign In <ChevronRight className="w-4 h-4" strokeWidth={2} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-in-up{animation:fade-in-up 0.5s ease-out both}
        @media (prefers-reduced-motion: reduce){ .animate-fade-in-up{animation:none !important} }
      `}</style>
    </div>
  );
}