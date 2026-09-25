import { useState, useRef, useCallback, useEffect } from 'react';
import {
  BookOpen, ClipboardList, Megaphone, Download, ArrowRight,
  GraduationCap, Users, Heart, Shield, Zap, Globe,
  X, Menu, CheckCircle2, Sparkles,
} from 'lucide-react';

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
  const playClick = useClickSound();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const goToLogin = () => {
    playClick();
    window.location.href = '/login';
  };

  const handleInstall = () => {
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

  const featuresRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setFeaturesVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  const featureItems = [
    { Icon: BookOpen, title: 'Learning Materials', desc: 'Teachers upload PDFs, videos, and notes accessible anytime, on any device.' },
    { Icon: ClipboardList, title: 'Assignments', desc: 'Students submit work digitally with streamlined review and feedback loops.' },
    { Icon: Megaphone, title: 'Announcements', desc: 'Important school updates delivered in real time to the right people.' },
  ];

  const roles = [
    { Icon: BookOpen, label: 'Teachers', desc: 'Manage classes, materials & assignments', accent: 'from-navy-500 to-navy-700' },
    { Icon: GraduationCap, label: 'Students', desc: 'Access learning materials & submit work', accent: 'from-forest-500 to-forest-700' },
    { Icon: Heart, label: 'Parents', desc: "Monitor your child's progress", accent: 'from-brass-500 to-brass-700' },
    { Icon: Shield, label: 'Admins', desc: 'System management & configuration', accent: 'from-oxbrick-500 to-oxbrick-700' },
  ];

  const stats = [
    { value: '24/7', label: 'Access Anywhere', Icon: Globe },
    { value: '100%', label: 'Digital Learning', Icon: Zap },
    { value: '4', label: 'User Roles', Icon: Users },
  ];

  const previewRows = [
    { Icon: BookOpen, title: 'Learning Materials', desc: 'Upload notes, PDFs & resources' },
    { Icon: ClipboardList, title: 'Assignment Tracking', desc: 'Submit and review work easily' },
    { Icon: Megaphone, title: 'Real-Time Updates', desc: 'School announcements instantly' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-parchment dark:bg-navy-900 overflow-hidden relative transition-colors duration-300">

      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-2 right-2 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-50 animate-slide-up sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-elevated border border-ink-200 dark:border-navy-600 p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brass-500 to-brass-700 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
              <Download className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-navy-800 dark:text-white text-sm">Get the App</h4>
              <p className="text-xs text-ink-500 dark:text-ink-300 truncate">Install Dayspring Hub on your device</p>
            </div>
            <button
              onClick={handleInstall}
              className="bg-brass-600 hover:bg-brass-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-soft transition-colors whitespace-nowrap flex-shrink-0"
            >
              Install
            </button>
            <button
              onClick={dismissInstall}
              aria-label="Dismiss"
              className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-navy-700 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Floating blobs */}
        <div className="pointer-events-none absolute top-0 left-0 w-48 h-48 bg-navy-100 dark:bg-navy-800 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-left" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 bg-brass-100 dark:bg-brass-900/40 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-right" />

        {/* Navbar */}
        <header
          className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 border-b ${
            scrolled
              ? 'bg-white/80 dark:bg-navy-900/80 border-ink-200 dark:border-navy-700 shadow-sm'
              : 'bg-white/60 dark:bg-navy-900/60 border-transparent'
          }`}
        >
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-brass-200 dark:border-brass-500/30 shadow-soft flex-shrink-0 group-hover:scale-105 transition-transform">
                <img src="/logo.jpeg" alt="Dayspring Hub" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-display font-semibold tracking-tight text-navy-800 dark:text-white">
                Dayspring<span className="text-brass-600 dark:text-brass-400"> Hub</span>
              </span>
            </a>

            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-ink-100 dark:bg-navy-700 hover:bg-ink-200 dark:hover:bg-navy-600 text-navy-700 dark:text-ink-200 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300"
              >
                <Download className="w-4 h-4" strokeWidth={1.75} /> Install App
              </button>
              <button
                onClick={goToLogin}
                className="bg-brass-600 hover:bg-brass-700 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm shadow-soft hover:shadow-elevated transition-all duration-300 active:scale-95"
              >
                Sign In
              </button>
            </div>

            <button
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-navy-700 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen
                ? <X className="w-6 h-6 text-navy-600 dark:text-ink-300" strokeWidth={1.75} />
                : <Menu className="w-6 h-6 text-navy-600 dark:text-ink-300" strokeWidth={1.75} />}
            </button>
          </nav>

          {mobileMenuOpen && (
            <div className="md:hidden bg-white dark:bg-navy-900 border-b border-ink-200 dark:border-navy-700 px-4 pb-4 animate-slide-down">
              <button
                onClick={() => { handleInstall(); setMobileMenuOpen(false); }}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-ink-100 dark:bg-navy-700 text-navy-700 dark:text-ink-200 py-3 rounded-2xl font-semibold text-sm"
              >
                <Download className="w-5 h-5" strokeWidth={1.75} /> Install App
              </button>
              <button
                onClick={() => { goToLogin(); setMobileMenuOpen(false); }}
                className="w-full mt-2 bg-brass-600 text-white py-3 rounded-2xl font-semibold shadow-soft text-sm"
              >
                Sign In
              </button>
            </div>
          )}
        </header>

        <main className="flex-grow relative">
          {/* Hero */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20 md:pt-24 md:pb-24">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-16 items-center">
              <div className="animate-fade-in-left text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-brass-50 dark:bg-brass-700/20 border border-brass-200 dark:border-brass-700/40 text-brass-700 dark:text-brass-300 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold mb-5 sm:mb-8 mx-auto sm:mx-0">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                  Trusted Digital Learning Platform
                </div>

                <h1 className="text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-navy-800 dark:text-white tracking-tight">
                  Smart Learning
                  <span className="block bg-gradient-to-r from-brass-500 to-brass-700 bg-clip-text text-transparent">
                    Starts Here
                  </span>
                </h1>

                <p className="mt-5 sm:mt-6 md:mt-8 text-sm sm:text-base md:text-lg text-ink-600 dark:text-ink-300 leading-relaxed max-w-2xl">
                  A modern education platform connecting teachers, students, parents, and administrators in one seamless digital ecosystem.
                </p>

                <div className="mt-7 sm:mt-9 md:mt-10">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={goToLogin}
                      className="group w-full sm:w-auto bg-brass-600 hover:bg-brass-700 text-white px-7 py-3.5 rounded-2xl text-base font-semibold shadow-soft hover:shadow-elevated transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-2"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                    </button>
                    <a
                      href="#features"
                      onClick={playClick}
                      className="w-full sm:w-auto bg-white dark:bg-navy-800 border-2 border-ink-200 dark:border-navy-600 hover:border-brass-300 dark:hover:border-brass-500 text-navy-700 dark:text-ink-200 px-7 py-3.5 rounded-2xl text-base font-semibold transition-all duration-300 text-center active:scale-95"
                    >
                      Learn More
                    </a>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-start flex-wrap gap-x-8 gap-y-5 mt-9 sm:mt-12">
                  {stats.map((stat, i) => (
                    <div key={i} className="animate-fade-in-up text-center sm:text-left" style={{ animationDelay: `${i * 0.15}s` }}>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                        <stat.Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brass-500" strokeWidth={1.75} />
                        <h3 className="text-xl sm:text-3xl font-display font-semibold text-navy-800 dark:text-white">{stat.value}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product preview */}
              <div className="animate-fade-in-right mt-4 lg:mt-0">
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-brass-300/30 via-transparent to-navy-300/20 dark:from-brass-500/10 dark:to-navy-500/10 blur-2xl rounded-[2.5rem]" />

                  <div className="relative bg-navy-800 dark:bg-navy-950 rounded-[1.75rem] sm:rounded-[2rem] p-2.5 sm:p-3 shadow-elevated border border-navy-700">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-1.5 px-2 py-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-oxbrick-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-brass-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-forest-400/80" />
                      <div className="ml-3 flex-1 h-5 rounded-md bg-navy-700/60" />
                    </div>

                    <div className="bg-white dark:bg-navy-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-navy-600/30">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-display font-semibold text-navy-800 dark:text-white">Dashboard</h3>
                          <p className="text-[11px] text-ink-400">Welcome back</p>
                        </div>
                        <div className="flex -space-x-2">
                          <span className="w-7 h-7 rounded-full bg-navy-200 dark:bg-navy-600 border-2 border-white dark:border-navy-800" />
                          <span className="w-7 h-7 rounded-full bg-brass-200 dark:bg-brass-700 border-2 border-white dark:border-navy-800" />
                          <span className="w-7 h-7 rounded-full bg-forest-200 dark:bg-forest-700 border-2 border-white dark:border-navy-800" />
                        </div>
                      </div>

                      <div className="space-y-2.5 sm:space-y-3">
                        {previewRows.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 dark:bg-navy-700/40 animate-fade-in-up"
                            style={{ animationDelay: `${idx * 0.12}s` }}
                          >
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-brass-500 to-brass-700 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
                              <item.Icon className="w-5 h-5" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm text-navy-800 dark:text-white truncate">{item.title}</h4>
                              <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{item.desc}</p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" strokeWidth={2} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="hidden sm:flex absolute -left-4 top-1/3 items-center gap-2 bg-white dark:bg-navy-800 border border-ink-200 dark:border-navy-600 rounded-2xl shadow-elevated px-3.5 py-2.5 animate-float-badge">
                    <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
                    <span className="text-xs font-semibold text-navy-700 dark:text-ink-200">Live now</span>
                  </div>
                  <div className="hidden sm:flex absolute -right-4 bottom-1/4 items-center gap-2 bg-white dark:bg-navy-800 border border-ink-200 dark:border-navy-600 rounded-2xl shadow-elevated px-3.5 py-2.5 animate-float-badge-delayed">
                    <Zap className="w-3.5 h-3.5 text-brass-500" strokeWidth={2} />
                    <span className="text-xs font-semibold text-navy-700 dark:text-ink-200">Fast & secure</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Roles */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white">Built for Everyone</h2>
              <div className="w-16 h-px bg-brass-500 mx-auto mt-3 mb-3" />
              <p className="text-sm sm:text-base text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">
                Four dedicated portals designed for each role in the school ecosystem.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {roles.map((role, i) => (
                <div
                  key={i}
                  className="group relative bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-5 sm:p-6 text-center hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.accent} flex items-center justify-center mx-auto mb-4 shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                    <role.Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display font-semibold text-base sm:text-lg text-navy-800 dark:text-white mb-1.5">{role.label}</h3>
                  <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section ref={featuresRef} id="features" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 md:pb-24">
            <div className={`text-center mb-10 sm:mb-14 ${featuresVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white">Everything You Need</h2>
              <div className="w-16 h-px bg-brass-500 mx-auto mt-3 mb-3" />
              <p className="text-sm sm:text-base text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">
                Designed to simplify communication, learning, and school management.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {featureItems.map((feature, i) => (
                <div
                  key={i}
                  className={`group relative bg-white dark:bg-navy-800 border border-ink-200 dark:border-navy-600 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-2 ${featuresVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <span className="absolute top-5 right-5 text-xs font-display font-semibold text-ink-300 dark:text-navy-600">
                    0{i + 1}
                  </span>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 dark:from-navy-500 dark:to-navy-700 flex items-center justify-center mb-5 shadow-soft group-hover:scale-110 transition-transform duration-300">
                    <feature.Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-semibold text-navy-800 dark:text-white mb-2.5">{feature.title}</h3>
                  <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-ink-200 dark:border-navy-700 bg-white/80 dark:bg-navy-800/50 backdrop-blur-sm py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-brass-200 dark:border-brass-500/30">
                <img src="/logo.jpeg" alt="Dayspring Hub" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-display font-semibold text-navy-800 dark:text-white">
                Dayspring<span className="text-brass-600 dark:text-brass-400"> Hub</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 text-center sm:text-right">
              © {new Date().getFullYear()} Dayspring Student Support Hub. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes float-left { 0%,100%{transform:translate(-20%,-20%) rotate(0deg)} 50%{transform:translate(-10%,-30%) rotate(5deg)} }
        @keyframes float-right { 0%,100%{transform:translate(20%,20%) rotate(0deg)} 50%{transform:translate(30%,10%) rotate(-5deg)} }
        @keyframes fade-in-left { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fade-in-right { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fade-in-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-down { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float-badge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .animate-float-left{animation:float-left 20s infinite linear}
        .animate-float-right{animation:float-right 25s infinite linear}
        .animate-fade-in-left{animation:fade-in-left 0.6s ease-out both}
        .animate-fade-in-right{animation:fade-in-right 0.6s ease-out both}
        .animate-fade-in-up{animation:fade-in-up 0.6s ease-out both}
        .animate-slide-down{animation:slide-down 0.4s ease-out}
        .animate-slide-up{animation:slide-up 0.4s ease-out}
        .animate-float-badge{animation:float-badge 4s ease-in-out infinite}
        .animate-float-badge-delayed{animation:float-badge 4s ease-in-out infinite; animation-delay:1.5s}
        @media (prefers-reduced-motion: reduce) {
          .animate-float-left,.animate-float-right,.animate-fade-in-left,
          .animate-fade-in-right,.animate-fade-in-up,.animate-slide-down,
          .animate-slide-up,.animate-float-badge,.animate-float-badge-delayed {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}