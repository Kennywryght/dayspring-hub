import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/';

export default function UnifiedLogin() {
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginTeacher, loginStudent, loginParent, loginAdmin } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');

  // Password visibility
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [showParentPass, setShowParentPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  const resetError = () => setError('');

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
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
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

  // Role selection
  if (!role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-500">Select your role to continue</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setRole('teacher')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg transition-all"
            >
              👩‍🏫 I'm a Teacher
            </button>
            <button
              onClick={() => setRole('student')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg transition-all"
            >
              🎓 I'm a Student
            </button>
            <button
              onClick={() => setRole('parent')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg transition-all"
            >
              👨‍👩‍👧 I'm a Parent
            </button>
            <button
              onClick={() => setRole('admin')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg transition-all"
            >
              ⚙️ I'm an Admin
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 block mx-auto"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  // Password toggle icon
  const ToggleIcon = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a10.01 10.01 0 012.17-3.16m2.28-2.28A10.05 10.05 0 0112 5c5 0 9.27 3.11 11 7.5a10.01 10.01 0 01-2.17 3.16m-2.28 2.28L21 21M3 3l2.28 2.28" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  const renderForm = () => {
    switch (role) {
      case 'teacher':
        return (
          <form onSubmit={handleTeacherLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="teacher@school.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showTeacherPass ? 'text' : 'password'}
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <ToggleIcon show={showTeacherPass} onClick={() => setShowTeacherPass(!showTeacherPass)} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        );
      case 'student':
        return (
          <form onSubmit={handleStudentLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                placeholder="S001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showStudentPass ? 'text' : 'password'}
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <ToggleIcon show={showStudentPass} onClick={() => setShowStudentPass(!showStudentPass)} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        );
      case 'parent':
        return (
          <form onSubmit={handleParentLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="parent@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showParentPass ? 'text' : 'password'}
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <ToggleIcon show={showParentPass} onClick={() => setShowParentPass(!showParentPass)} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        );
      case 'admin':
        return (
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                placeholder="admin@school.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <ToggleIcon show={showAdminPass} onClick={() => setShowAdminPass(!showAdminPass)} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {role === 'teacher' && 'Teacher Login'}
              {role === 'student' && 'Student Login'}
              {role === 'parent' && 'Parent Login'}
              {role === 'admin' && 'Admin Login'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {role === 'student'
                ? 'Enter your student number and password'
                : 'Enter your email and password'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center text-sm">
              {error}
            </div>
          )}

          {renderForm()}

          <button
            onClick={() => {
              setRole(null);
              resetError();
            }}
            className="mt-5 text-sm text-gray-400 hover:text-gray-600 w-full text-center"
          >
            ← Choose different role
          </button>
        </div>
      </div>
    </div>
  );
}