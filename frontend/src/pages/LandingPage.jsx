import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-2xl font-extrabold text-blue-600 tracking-tight">
            Dayspring<span className="text-gray-800"> Hub</span>
          </span>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-sm transition-colors"
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            Now supporting primary to high school
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Dayspring Student{' '}
            <span className="text-blue-600">Support Hub</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            A seamless digital learning platform that connects teachers,
            students, and parents. Share materials, submit assignments, and
            stay updated — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-10 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Get Started
            </button>
            <a
              href="#features"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-lg px-10 py-4 rounded-2xl font-semibold shadow-sm transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Feature cards */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl px-4">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              📚
            </div>
            <h3 className="text-xl font-bold mb-2">Learning Materials</h3>
            <p className="text-gray-500">
              Teachers upload PDFs, videos, and links for students to access
              anytime.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              ✏️
            </div>
            <h3 className="text-xl font-bold mb-2">Assignments</h3>
            <p className="text-gray-500">
              Students submit work digitally and teachers review submissions
              with ease.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              📢
            </div>
            <h3 className="text-xl font-bold mb-2">Announcements</h3>
            <p className="text-gray-500">
              Stay informed with class‑wide updates visible to students and
              parents.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Dayspring Student Support Hub —
        version 1.0
      </footer>
    </div>
  );
}