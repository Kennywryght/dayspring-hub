// frontend/src/pages/LiveClass.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  Share2,
  Settings,
  LogOut,
  AlertCircle,
  Loader2,
  Copy,
  CheckCircle2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://dayspring-hub.onrender.com/api/v1/';

export default function LiveClass() {
  const { roomName } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [classInfo, setClassInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // Jitsi Meet API configuration
  const [jitsiConfig, setJitsiConfig] = useState({
    roomName: roomName,
    width: '100%',
    height: '100%',
    parentNode: null,
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
      enableWelcomePage: false,
      disableDeepLinking: true,
      disableInviteFunctions: true,
      toolbarButtons: [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'tileview', 'download', 'help', 'mute-everyone'
      ],
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DEFAULT_BACKGROUND: '#1e293b',
      VERTICAL_FILMSTRIP: true,
      FILM_STRIP_MAX_HEIGHT: 120,
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'tileview', 'download', 'help', 'mute-everyone'
      ],
    },
  });

  // Load Jitsi Meet API script
  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript();
        
        // Initialize Jitsi Meet
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: iframeRef.current,
          configOverwrite: jitsiConfig.configOverwrite,
          interfaceConfigOverwrite: jitsiConfig.interfaceConfigOverwrite,
          userInfo: {
            displayName: user?.full_name || user?.display_name || 'Student',
            email: user?.email || '',
          },
        };

        const api = new JitsiMeetExternalAPI(domain, options);

        // Add event listeners
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Joined conference');
          setLoading(false);
        });

        api.addEventListener('participantJoined', (data) => {
          setParticipantCount(prev => prev + 1);
        });

        api.addEventListener('participantLeft', () => {
          setParticipantCount(prev => Math.max(0, prev - 1));
        });

        api.addEventListener('videoConferenceLeft', () => {
          navigate('/student');
        });

        // Store API reference
        window.jitsiApi = api;

        // Get participant count
        setTimeout(() => {
          const participants = api.getParticipantsInfo?.() || [];
          setParticipantCount(participants.length + 1);
        }, 2000);

      } catch (err) {
        console.error('Failed to load Jitsi:', err);
        setError('Failed to load video conference. Please check your internet connection.');
        setLoading(false);
      }
    };

    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Verify room access
    verifyRoomAccess();

    initializeJitsi();

    // Auto-hide controls after inactivity
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      if (window.jitsiApi) {
        window.jitsiApi.dispose();
        delete window.jitsiApi;
      }
    };
  }, [roomName, user]);

  const verifyRoomAccess = async () => {
    try {
      // Check if room is valid (optional - you can skip this)
      // This is a lightweight check to see if the room exists
      // You may want to query your database to verify the room is active
    } catch (err) {
      console.error('Room verification failed:', err);
      // Don't block access, just log the error
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('jitsi-container');
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/live/${roomName}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveClass = () => {
    if (window.jitsiApi) {
      window.jitsiApi.executeCommand('hangup');
    }
    navigate('/student');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 p-4">
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-elevated max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-oxbrick-600 dark:text-oxbrick-500 mx-auto mb-4" strokeWidth={1.75} />
          <h2 className="text-2xl font-display font-semibold text-navy-800 dark:text-white mb-4">
            Unable to Join Class
          </h2>
          <p className="text-ink-500 dark:text-ink-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-brass-600 hover:bg-brass-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-navy-900 z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brass-500 animate-spin mx-auto mb-4" strokeWidth={2} />
            <p className="text-white text-lg font-semibold">Joining Live Class...</p>
            <p className="text-navy-300 text-sm mt-2">Please wait while we connect you</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`bg-navy-800/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-forest-500 animate-pulse" />
          <span className="text-white font-semibold text-sm">Live</span>
          <span className="text-navy-300 text-sm">|</span>
          <span className="text-white text-sm font-medium truncate max-w-[200px]">
            {roomName?.replace('dayspring-', '') || 'Live Class'}
          </span>
          <div className="flex items-center gap-1 text-navy-300 text-sm">
            <Users className="w-4 h-4" strokeWidth={1.75} />
            <span>{participantCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="p-2 rounded hover:bg-navy-700 text-navy-300 hover:text-white transition-colors"
            title="Copy room link"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-forest-500" strokeWidth={1.75} />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded hover:bg-navy-700 text-navy-300 hover:text-white transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
          <button
            onClick={leaveClass}
            className="px-4 py-1.5 rounded bg-oxbrick-600 hover:bg-oxbrick-700 text-white text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Leave
          </button>
        </div>
      </div>

      {/* Jitsi Meet Container */}
      <div id="jitsi-container" className="flex-1 relative bg-navy-900">
        <div ref={iframeRef} className="w-full h-full" />
        
        {/* Bottom Controls Hint */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-navy-800/80 backdrop-blur-sm rounded-full px-4 py-2 text-navy-300 text-xs flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5" strokeWidth={1.75} /> Camera
            </span>
            <span className="flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" strokeWidth={1.75} /> Mic
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> Chat
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Share
            </span>
          </div>
        </div>
      </div>

      {/* Jitsi Meet Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Jitsi Meet External API is loaded dynamically
            // The iframe will be rendered by the JitsiMeetExternalAPI
          `
        }}
      />
    </div>
  );
}