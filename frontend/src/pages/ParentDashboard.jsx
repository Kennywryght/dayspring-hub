import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api/v1/';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parent Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor your child's learning progress.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search child..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white shadow-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 5.15z" />
            </svg>
          </div>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white shadow-sm"
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
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📚</span> Learning Materials
          </h2>
          {materials.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📭</span>
              <p className="text-gray-400 mt-2">No materials available for this student.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials.map(m => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800 truncate">{m.title}</h3>
                    <span className="text-2xl">{m.icon || '📚'}</span>
                  </div>
                  {m.description && <p className="text-sm text-gray-500 mb-3">{m.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{m.type}</span>
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-medium hover:underline">
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
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📝</span> Assignments
          </h2>
          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📋</span>
              <p className="text-gray-400 mt-2">No assignments for this student yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(a => (
                <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="text-2xl">{a.icon || '📝'}</span> {a.title}
                    </h3>
                  </div>
                  {a.description && <p className="text-sm text-gray-500 mb-3">{a.description}</p>}
                  {a.deadline && <p className="text-xs text-red-500 mb-2">Due: {new Date(a.deadline).toLocaleString()}</p>}
                  {a.file_url && (
                    <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-medium hover:underline block">
                      Download Assignment File
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
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📢</span> Announcements
          </h2>
          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span className="text-4xl">📢</span>
              <p className="text-gray-400 mt-2">No announcements for this class.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}