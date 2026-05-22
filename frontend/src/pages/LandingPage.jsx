import { useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';

// Click sound hook (no external libraries)
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

export default function LandingPage() {
  const navigate = useNavigate();
  const playClick = useClickSound();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  // Intersection Observer to animate features when they scroll into view
  const featuresRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (path) => {
    playClick();
    navigate(path);
  };

  const featureItems = [
    {
      icon: '📚',
      title: 'Learning Materials',
      desc: 'Teachers upload PDFs, videos, and notes accessible anytime.',
      color: 'blue',
    },
    {
      icon: '✏️',
      title: 'Assignments',
      desc: 'Students submit work digitally with streamlined review.',
      color: 'green',
    },
    {
      icon: '📢',
      title: 'Announcements',
      desc: 'Important school updates delivered in real time.',
      color: 'purple',
    },
  ];

  return (
    // ✅ CHANGED: added flex flex-col to push footer down
    <div className="flex flex-col min-h-screen bg-white overflow-hidden relative">
      {/* Animated floating background blobs (pure CSS) */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30 animate-float-left" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30 animate-float-right" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-100 animate-slide-down">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              D
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Dayspring
              <span className="text-blue-600"> Hub</span>
            </span>
          </div>

          {/* Desktop Sign In */}
          <div className="hidden md:block">
            <button
              onClick={() => handleNavigate('/login')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className={`md:hidden bg-white border-b border-gray-100 px-6 pb-4 transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <button
            onClick={() => {
              handleNavigate('/login');
              setMobileMenuOpen(false);
            }}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ✅ CHANGED: added flex-grow so main fills remaining space */}
      <main className="flex-grow relative">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="animate-fade-in-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-5 py-2 text-sm font-semibold mb-8 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Trusted Digital Learning Platform
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight tracking-tight">
                Smart Learning
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Starts Here
                </span>
              </h1>

              <p className="mt-8 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
                A modern education platform connecting teachers, students,
                parents, and administrators in one seamless digital ecosystem.
                Share materials, manage assignments, and stay connected from
                anywhere.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 mt-10">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-blue-200 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Get Started
                </button>

                <a
                  href="#features"
                  onClick={playClick}
                  className="bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 text-center hover:scale-105 active:scale-95"
                >
                  Learn More
                </a>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-10 mt-14">
                {[
                  { value: '24/7', label: 'Access Anywhere' },
                  { value: '100%', label: 'Digital Learning' },
                  { value: '4 Roles', label: 'Unified Platform' },
                ].map((stat, i) => (
                  <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                    <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                    <p className="text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side illustration */}
            <div className="animate-fade-in-right">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 shadow-2xl">
                <div className="bg-white rounded-3xl p-8 shadow-xl transition-transform hover:scale-105">
                  <div className="space-y-5">
                    {[
                      { icon: '📚', title: 'Learning Materials', desc: 'Upload notes, PDFs & resources', bg: 'bg-blue-50' },
                      { icon: '✏️', title: 'Assignment Tracking', desc: 'Submit and review work easily', bg: 'bg-green-50' },
                      { icon: '📢', title: 'Real-Time Updates', desc: 'School announcements instantly', bg: 'bg-purple-50' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-4 p-4 rounded-2xl ${item.bg} animate-fade-in-up`}
                        style={{ animationDelay: `${idx * 0.15}s` }}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} id="features" className="max-w-7xl mx-auto px-6 pb-24">
          <div className={`text-center mb-16 ${featuresVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl font-black text-gray-900">
              Everything You Need
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              Designed to simplify communication, learning, and school management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featureItems.map((feature, index) => (
              <div
                key={index}
                className={`group bg-white border border-gray-100 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${
                  featuresVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-5xl mb-6 transform transition-transform group-hover:scale-110 duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8 text-center">
        <p className="text-gray-500">
          © {new Date().getFullYear()} Dayspring Student Support Hub
        </p>
      </footer>

      {/* Custom CSS animations */}
      <style>{`
        @keyframes float-left {
          0%, 100% { transform: translate(-20%, -20%) rotate(0deg); }
          50% { transform: translate(-10%, -30%) rotate(5deg); }
        }
        @keyframes float-right {
          0%, 100% { transform: translate(20%, 20%) rotate(0deg); }
          50% { transform: translate(30%, 10%) rotate(-5deg); }
        }
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-left { animation: float-left 20s infinite linear; }
        .animate-float-right { animation: float-right 25s infinite linear; }
        .animate-fade-in-left { animation: fade-in-left 0.6s ease-out both; }
        .animate-fade-in-right { animation: fade-in-right 0.6s ease-out both; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .animate-slide-down { animation: slide-down 0.4s ease-out; }
      `}</style>
    </div>
  );
}