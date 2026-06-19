import { useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// Click sound hook
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
  const { dark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Check if APK is already installed or prompt was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (!dismissed) {
      // Show after 3 seconds
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = () => {
    // Link to your APK file in the public folder
    const link = document.createElement('a');
    link.href = '/dayspring-hub.apk';
    link.download = 'Dayspring-Hub.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const dismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Intersection Observer for features section
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
    { icon: '📚', title: 'Learning Materials', desc: 'Teachers upload PDFs, videos, and notes accessible anytime.', color: 'blue' },
    { icon: '✏️', title: 'Assignments', desc: 'Students submit work digitally with streamlined review.', color: 'green' },
    { icon: '📢', title: 'Announcements', desc: 'Important school updates delivered in real time.', color: 'purple' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 overflow-hidden relative transition-colors duration-300">
      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up max-w-md w-[90%]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-lg">
              📱
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Get the App</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Install Dayspring Hub on your device</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Install
              </button>
              <button
                onClick={dismissInstall}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Animated floating blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 dark:bg-blue-900/60 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-left" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/60 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-right" />

        {/* Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-100 dark:border-gray-800 animate-slide-down">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-blue-200 dark:border-blue-500/30 shadow-md flex-shrink-0">
                <img src="/logo.jpg" alt="Dayspring Hub Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Dayspring
                <span className="text-blue-600 dark:text-blue-400"> Hub</span>
              </span>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </button>
              <button
                onClick={() => handleNavigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Sign In
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </nav>

          {/* Mobile menu */}
          <div className={`md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 pb-4 transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            <button
              onClick={() => { handleInstall(); setMobileMenuOpen(false); }}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-semibold active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install App
            </button>
            <button
              onClick={() => { handleNavigate('/login'); setMobileMenuOpen(false); }}
              className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow relative">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left content */}
              <div className="animate-fade-in-left">
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-full px-5 py-2 text-sm font-semibold mb-8">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  Trusted Digital Learning Platform
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                  Smart Learning
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Starts Here
                  </span>
                </h1>

                <p className="mt-8 text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  A modern education platform connecting teachers, students,
                  parents, and administrators in one seamless digital ecosystem.
                  Share materials, manage assignments, and stay connected from
                  anywhere.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 mt-10">
                  <button
                    onClick={() => handleNavigate('/login')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-blue-200 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Get Started
                  </button>
                  <a
                    href="#features"
                    onClick={playClick}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 text-center hover:scale-105 active:scale-95"
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
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side illustration */}
              <div className="animate-fade-in-right">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 shadow-2xl">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-transform hover:scale-105">
                    <div className="space-y-5">
                      {[
                        { icon: '📚', title: 'Learning Materials', desc: 'Upload notes, PDFs & resources', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                        { icon: '✏️', title: 'Assignment Tracking', desc: 'Submit and review work easily', bg: 'bg-green-50 dark:bg-green-900/30' },
                        { icon: '📢', title: 'Real-Time Updates', desc: 'School announcements instantly', bg: 'bg-purple-50 dark:bg-purple-900/30' },
                      ].map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl ${item.bg} animate-fade-in-up`}
                          style={{ animationDelay: `${idx * 0.15}s` }}>
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl">
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
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
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">Everything You Need</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                Designed to simplify communication, learning, and school management.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featureItems.map((feature, index) => (
                <div key={index}
                  className={`group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${
                    featuresVisible ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="text-5xl mb-6 transform transition-transform group-hover:scale-110 duration-300">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm py-8 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Dayspring Student Support Hub. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

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
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-left { animation: float-left 20s infinite linear; }
        .animate-float-right { animation: float-right 25s infinite linear; }
        .animate-fade-in-left { animation: fade-in-left 0.6s ease-out both; }
        .animate-fade-in-right { animation: fade-in-right 0.6s ease-out both; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .animate-slide-down { animation: slide-down 0.4s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
      `}</style>
    </div>
  );
}