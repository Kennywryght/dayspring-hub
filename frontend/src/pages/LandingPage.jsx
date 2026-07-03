import { useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen, ClipboardList, Megaphone, Download, ArrowRight,
  GraduationCap, Users, Heart, Shield, Zap, Globe,
  Menu, X, ChevronRight,
} from 'lucide-react';

const useClickSound = () => {
  const audioRef = useRef(null);
  if (!audioRef.current) { audioRef.current = new Audio('/sounds/click.mp3'); audioRef.current.volume = 0.2; }
  return useCallback(() => { audioRef.current?.play().catch(() => {}); }, []);
};

export default function LandingPage() {
  const navigate = useNavigate();
  const playClick = useClickSound();
  const { dark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (!dismissed) { const t = setTimeout(() => setShowInstallPrompt(true), 3000); return () => clearTimeout(t); }
  }, []);

  const handleInstall = () => {
    const link = document.createElement('a'); link.href = '/dayspring-hub.apk'; link.download = 'Dayspring-Hub.apk';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setShowInstallPrompt(false); localStorage.setItem('installPromptDismissed', 'true');
  };
  const dismissInstall = () => { setShowInstallPrompt(false); localStorage.setItem('installPromptDismissed', 'true'); };

  const featuresRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setFeaturesVisible(true); observer.disconnect(); } }, { threshold: 0.1 });
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  const featureItems = [
    { Icon: BookOpen, title: 'Learning Materials', desc: 'Teachers upload PDFs, videos, and notes accessible anytime.' },
    { Icon: ClipboardList, title: 'Assignments', desc: 'Students submit work digitally with streamlined review.' },
    { Icon: Megaphone, title: 'Announcements', desc: 'Important school updates delivered in real time.' },
  ];

  const roles = [
    { Icon: BookOpen, label: 'Teachers', desc: 'Manage classes, materials & assignments' },
    { Icon: GraduationCap, label: 'Students', desc: 'Access learning materials & submit work' },
    { Icon: Heart, label: 'Parents', desc: 'Monitor your child\'s progress' },
    { Icon: Shield, label: 'Admins', desc: 'System management & configuration' },
  ];

  const stats = [
    { value: '24/7', label: 'Access Anywhere', Icon: Globe },
    { value: '100%', label: 'Digital Learning', Icon: Zap },
    { value: '4 Roles', label: 'Unified Platform', Icon: Users },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-parchment dark:bg-navy-900 overflow-hidden relative transition-colors duration-300">
      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-2 right-2 sm:bottom-6 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 animate-slide-up sm:max-w-md">
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-elevated border border-ink-200 dark:border-navy-600 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brass-600 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
              <Download className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-navy-800 dark:text-white text-sm">Get the App</h4>
              <p className="text-xs text-ink-500 dark:text-ink-300 truncate">Install Dayspring Hub on your device</p>
            </div>
            <button onClick={handleInstall} className="bg-brass-600 hover:bg-brass-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-soft transition-colors whitespace-nowrap flex-shrink-0">Install</button>
            <button onClick={dismissInstall} className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-navy-700 transition-colors flex-shrink-0"><X className="w-5 h-5" strokeWidth={1.75} /></button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-navy-100 dark:bg-navy-800 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-left" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brass-100 dark:bg-brass-900/40 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-right" />

        {/* Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-navy-900/70 border-b border-ink-200 dark:border-navy-700 animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-brass-200 dark:border-brass-500/30 shadow-soft flex-shrink-0">
                <img src="/logo.jpg" alt="Dayspring Hub" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-display font-semibold tracking-tight text-navy-800 dark:text-white">
                Dayspring<span className="text-brass-600 dark:text-brass-400"> Hub</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={handleInstall} className="flex items-center gap-2 bg-ink-100 dark:bg-navy-700 hover:bg-ink-200 dark:hover:bg-navy-600 text-navy-700 dark:text-ink-200 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300">
                <Download className="w-5 h-5" strokeWidth={1.75} /> Install App
              </button>
              <button onClick={() => navigate('/login')} className="bg-brass-600 hover:bg-brass-700 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm shadow-soft transition-all duration-300">
                Sign In
              </button>
            </div>

            <button className="md:hidden p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-navy-700 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-navy-600 dark:text-ink-300" strokeWidth={1.75} /> : <Menu className="w-6 h-6 text-navy-600 dark:text-ink-300" strokeWidth={1.75} />}
            </button>
          </nav>
          <div className={`md:hidden bg-white dark:bg-navy-900 border-b border-ink-200 dark:border-navy-700 px-4 pb-4 transition-all duration-300 ${mobileMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <button onClick={() => { handleInstall(); setMobileMenuOpen(false); }} className="w-full mt-3 flex items-center justify-center gap-2 bg-ink-100 dark:bg-navy-700 text-navy-700 dark:text-ink-200 py-3 rounded-2xl font-semibold text-sm"><Download className="w-5 h-5" strokeWidth={1.75} /> Install App</button>
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="w-full mt-2 bg-brass-600 text-white py-3 rounded-2xl font-semibold shadow-soft text-sm">Sign In</button>
          </div>
        </header>

        <main className="flex-grow relative">
          {/* Hero */}
          <section className="max-w-7xl mx-auto px-4 pt-8 pb-12 sm:pt-16 sm:pb-16 md:pt-24 md:pb-20">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="animate-fade-in-left text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-brass-50 dark:bg-brass-700/20 border border-brass-200 dark:border-brass-700/40 text-brass-700 dark:text-brass-300 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold mb-4 sm:mb-8 mx-auto sm:mx-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass-600 animate-ping" />
                  <span>Trusted Digital Learning Platform</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-semibold text-navy-800 dark:text-white leading-tight tracking-tight">
                  Smart Learning
                  <span className="block text-brass-600 dark:text-brass-400">Starts Here</span>
                </h1>
                <p className="mt-4 sm:mt-6 md:mt-8 text-sm sm:text-base md:text-lg text-ink-600 dark:text-ink-300 leading-relaxed max-w-2xl">
                  A modern education platform connecting teachers, students, parents, and administrators in one seamless digital ecosystem.
                </p>
                <div className="mt-6 sm:mt-8 md:mt-10">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-brass-600 hover:bg-brass-700 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-soft transition-all duration-300 active:scale-95 text-center">
                      Get Started
                    </button>
                    <a href="#features" onClick={playClick} className="w-full sm:w-auto bg-white dark:bg-navy-800 border-2 border-ink-200 dark:border-navy-600 hover:border-brass-300 dark:hover:border-brass-500 text-navy-700 dark:text-ink-200 px-8 py-4 rounded-2xl text-base font-semibold transition-all duration-300 text-center active:scale-95">
                      Learn More
                    </a>
                  </div>
                </div>
                <div className="flex justify-center sm:justify-start flex-wrap gap-6 mt-8 sm:mt-12">
                  {stats.map((stat, i) => (
                    <div key={i} className="animate-fade-in-up text-center sm:text-left" style={{ animationDelay: `${i * 0.2}s` }}>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <stat.Icon className="w-5 h-5 text-brass-500" strokeWidth={1.75} />
                        <h3 className="text-xl sm:text-3xl font-display font-semibold text-navy-800 dark:text-white">{stat.value}</h3>
                      </div>
                      <p className="text-xs sm:text-base text-ink-500 dark:text-ink-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="animate-fade-in-right mt-8 lg:mt-0">
                <div className="bg-navy-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-elevated">
                  <div className="bg-white dark:bg-navy-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-card border border-navy-600/30">
                    <div className="space-y-3 sm:space-y-5">
                      {[{ Icon: BookOpen, title: 'Learning Materials', desc: 'Upload notes, PDFs & resources', bg: 'bg-navy-50 dark:bg-navy-600/30' },{ Icon: ClipboardList, title: 'Assignment Tracking', desc: 'Submit and review work easily', bg: 'bg-navy-50 dark:bg-navy-600/30' },{ Icon: Megaphone, title: 'Real-Time Updates', desc: 'School announcements instantly', bg: 'bg-navy-50 dark:bg-navy-600/30' }].map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl ${item.bg} animate-fade-in-up`} style={{ animationDelay: `${idx * 0.15}s` }}>
                          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-brass-600 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
                            <item.Icon className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1"><h3 className="font-semibold text-sm sm:text-base text-navy-800 dark:text-white">{item.title}</h3><p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400">{item.desc}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Roles */}
          <section className="max-w-7xl mx-auto px-4 pb-16 sm:pb-20">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white">Built for Everyone</h2>
              <div className="w-16 h-px bg-brass-500 mx-auto mt-3 mb-3" />
              <p className="text-sm sm:text-base text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">Four dedicated portals designed for each role in the school ecosystem.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {roles.map((role, i) => (
                <div key={i} className="bg-white dark:bg-navy-800 rounded-2xl shadow-card border border-ink-200 dark:border-navy-600 p-5 sm:p-6 text-center hover:shadow-elevated transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-14 h-14 rounded-2xl bg-navy-100 dark:bg-navy-700 flex items-center justify-center mx-auto mb-4">
                    <role.Icon className="w-6 h-6 text-navy-600 dark:text-navy-300" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-navy-800 dark:text-white mb-2">{role.label}</h3>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{role.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section ref={featuresRef} id="features" className="max-w-7xl mx-auto px-4 pb-16 sm:pb-20 md:pb-24">
            <div className={`text-center mb-10 sm:mb-16 ${featuresVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-navy-800 dark:text-white">Everything You Need</h2>
              <div className="w-16 h-px bg-brass-500 mx-auto mt-3 mb-3" />
              <p className="text-sm sm:text-base text-ink-500 dark:text-ink-400 max-w-2xl mx-auto">Designed to simplify communication, learning, and school management.</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {featureItems.map((feature, i) => (
                <div key={i} className={`group bg-white dark:bg-navy-800 border border-ink-200 dark:border-navy-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-2 ${featuresVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.2}s` }}>
                  <div className="w-14 h-14 rounded-2xl bg-navy-100 dark:bg-navy-700 flex items-center justify-center mb-4 sm:mb-6 transform transition-transform group-hover:scale-110 duration-300">
                    <feature.Icon className="w-7 h-7 text-navy-600 dark:text-navy-300" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-display font-semibold text-navy-800 dark:text-white mb-3 sm:mb-4">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-ink-500 dark:text-ink-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-ink-200 dark:border-navy-700 bg-white/80 dark:bg-navy-800/50 backdrop-blur-sm py-6 sm:py-8 text-center">
          <div className="max-w-7xl mx-auto px-4">
            <div className="w-16 h-px bg-brass-500/50 mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400">© {new Date().getFullYear()} Dayspring Student Support Hub. All rights reserved.</p>
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
        .animate-float-left{animation:float-left 20s infinite linear}
        .animate-float-right{animation:float-right 25s infinite linear}
        .animate-fade-in-left{animation:fade-in-left 0.6s ease-out both}
        .animate-fade-in-right{animation:fade-in-right 0.6s ease-out both}
        .animate-fade-in-up{animation:fade-in-up 0.6s ease-out both}
        .animate-slide-down{animation:slide-down 0.4s ease-out}
        .animate-slide-up{animation:slide-up 0.4s ease-out}
      `}</style>
    </div>
  );
}