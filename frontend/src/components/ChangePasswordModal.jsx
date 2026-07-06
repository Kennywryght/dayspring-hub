import { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function ChangePasswordModal({ isOpen, onClose, user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-brass-500" strokeWidth={1.75} />
            Change Password
          </h2>
          <button onClick={onClose} className="text-ink-400 hover:text-navy-700 dark:hover:text-white p-1.5 rounded transition-colors">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {success ? (
          <div className="bg-forest-50 dark:bg-forest-700/20 border border-forest-200 dark:border-forest-700/40 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-forest-600 dark:text-forest-500 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="font-semibold text-forest-800 dark:text-forest-300">Password Updated!</h3>
            <p className="text-sm text-forest-600 dark:text-forest-400 mt-2">Your password has been changed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-oxbrick-50 dark:bg-oxbrick-700/20 border border-oxbrick-200 dark:border-oxbrick-700/40 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-oxbrick-600 dark:text-oxbrick-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-sm text-oxbrick-700 dark:text-oxbrick-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white"
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" strokeWidth={1.75} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-ink-200 dark:border-navy-600 focus:border-brass-500 focus:ring-4 focus:ring-brass-50 dark:focus:ring-brass-500/20 outline-none transition-colors bg-white dark:bg-navy-700 text-navy-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brass-600 hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-2xl shadow-soft transition-colors duration-150"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-ink-100 dark:bg-navy-700 hover:bg-ink-200 dark:hover:bg-navy-600 text-ink-700 dark:text-ink-300 font-semibold px-6 py-3.5 rounded-2xl transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}