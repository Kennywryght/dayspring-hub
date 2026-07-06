import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${API_URL}auth/validate-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      setTokenValid(data.valid || false);
      if (!data.valid) {
        setError('This reset link is invalid or has expired');
      }
    } catch (err) {
      setError('Failed to validate reset link');
    } finally {
      setValidating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token, 
          new_password: password 
        })
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brass-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-ink-500 dark:text-ink-300 mt-4">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-elevated p-8 text-center">
          <AlertCircle className="w-16 h-16 text-oxbrick-600 dark:text-oxbrick-500 mx-auto mb-4" strokeWidth={1.75} />
          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Invalid Link</h2>
          <p className="text-ink-500 dark:text-ink-300 mt-2">{error || 'The password reset link is invalid or expired.'}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-6 text-brass-600 dark:text-brass-400 font-semibold hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-elevated p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-forest-600 dark:text-forest-500 mx-auto mb-4" strokeWidth={1.75} />
          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">Password Reset</h2>
          <p className="text-ink-500 dark:text-ink-300 mt-2">Your password has been reset successfully!</p>
          <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-navy-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-elevated p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-semibold text-navy-800 dark:text-white">
            Create New Password
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 border border-oxbrick-200 dark:border-oxbrick-700/40 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-oxbrick-600 dark:text-oxbrick-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-sm text-oxbrick-700 dark:text-oxbrick-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500"
                placeholder="Min. 6 characters"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white placeholder-ink-300 dark:placeholder-ink-500"
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brass-600 hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-2xl shadow-soft transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </div>
  );
}