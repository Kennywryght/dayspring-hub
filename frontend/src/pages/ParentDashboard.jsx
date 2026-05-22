import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('materials');

  // Children list from token
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Content
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Fetch children list on mount
  useEffect(() => {
    if (!user || user.role !== 'parent') {
      navigate('/login');
      return;
    }
    fetch(`${API_URL}parent/students/`, {
      headers: { Authorization: `Bearer ${user.access_token}` }
    })
      .then(r => r.json())
      .then(data => {
        setChildren(data);
        if (data.length > 0) setSelectedChildId(data[0].id);
      });
  }, [user]);

  // Fetch content when child or tab changes
  useEffect(() => {
    if (selectedChildId) fetchContent();
  }, [selectedChildId, tab]);

  const fetchContent = async () => {
    if (!selectedChildId) return;
    const headers = { Authorization: `Bearer ${user.access_token}` };
    const param = `?student_id=${selectedChildId}`;

    const [matRes, assRes, annRes] = await Promise.all([
      fetch(`${API_URL}materials/${param}`, { headers }),
      fetch(`${API_URL}assignments/${param}`, { headers }),
      fetch(`${API_URL}announcements/${param}`, { headers }),
    ]);
    if (matRes.ok) setMaterials(await matRes.json());
    if (assRes.ok) setAssignments(await assRes.json());
    if (annRes.ok) setAnnouncements(await annRes.json());
  };

  // Filter children based on search term
  const filteredChildren = children.filter(child => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return child.display_name.toLowerCase().includes(term) ||
           child.student_number.toLowerCase().includes(term);
  });

  const navLinks = [
    { label: 'Materials', onClick: () => setTab('materials') },
    { label: 'Assignments', onClick: () => setTab('assignments') },
    { label: 'Announcements', onClick: () => setTab('announcements') },
  ];

  return (
    <Layout role="parent" navLinks={navLinks}>
      {/* Header with child selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
            <span className="text-4xl">👨‍👩‍👧</span> Parent Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Monitor your child's learning progress.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Search input with icon */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 5.15z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search child..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white shadow-sm"
            />
          </div>
          {/* Child selector */}
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white shadow-sm font-semibold"
          >
            {filteredChildren.map(child => (
              <option key={child.id} value={child.id}>
                {child.display_name} ({child.student_number})
              </option>
            ))}
            {filteredChildren.length === 0 && (
              <option value="">No children found</option>
            )}
          </select>
        </div>
      </div>

      {/* Materials Tab */}
      {tab === 'materials' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">📚</div>
            <h2 className="text-2xl font-bold text-gray-900">Learning Materials</h2>
          </div>
          {materials.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📭</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No materials available for this student.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials.map(m => (
                <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 truncate">{m.title}</h3>
                    <span className="text-3xl">{m.icon || '📚'}</span>
                  </div>
                  {m.description && <p className="text-sm text-gray-500 mb-3">{m.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">{m.type}</span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-semibold hover:underline">
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg">📝</div>
            <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📋</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No assignments for this student yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(a => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <span className="text-3xl">{a.icon || '📝'}</span> {a.title}
                    </h3>
                  </div>
                  {a.description && <p className="text-sm text-gray-500 mb-3">{a.description}</p>}
                  {a.deadline && (
                    <p className="text-xs font-semibold text-red-500 mb-3 flex items-center gap-1">
                      <span>📅</span> Due: {new Date(a.deadline).toLocaleString()}
                    </p>
                  )}
                  {a.file_url && (
                    <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-semibold hover:underline inline-block">
                      📎 Download Assignment File
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg">📢</div>
            <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-6xl">📢</span>
              <p className="text-gray-400 mt-4 text-lg font-medium">No announcements for this class.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                  <h3 className="font-bold text-xl text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-3">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Animations */}
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