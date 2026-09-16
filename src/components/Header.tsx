import { useState, useEffect } from 'react';
import { Sparkles, Users, UserCheck, Volume2, VolumeX, Maximize2, Minimize2, Dna } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface HeaderProps {
  activeTab: 'picker' | 'groups' | 'roster';
  setActiveTab: (tab: 'picker' | 'groups' | 'roster') => void;
  studentCount: number;
}

export function Header({ activeTab, setActiveTab, studentCount }: HeaderProps) {
  const [isMuted, setIsMuted] = useState(soundEffects.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundEffects.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playPop();
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported in this frame
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                  課堂隨機抽籤與分組
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  教師助手
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                動畫音效抽籤 • 智慧均衡分組 • CSV名單支援
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-picker"
              type="button"
              onClick={() => {
                setActiveTab('picker');
                soundEffects.playPop();
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>隨機抽籤</span>
            </button>

            <button
              id="nav-tab-groups"
              type="button"
              onClick={() => {
                setActiveTab('groups');
                soundEffects.playPop();
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>自動分組</span>
            </button>

            <button
              id="nav-tab-roster"
              type="button"
              onClick={() => {
                setActiveTab('roster');
                soundEffects.playPop();
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">名單管理</span>
              <span className="sm:hidden">名單</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {studentCount}
              </span>
            </button>
          </nav>

          {/* Utility Tools: Sound Toggle & Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              id="btn-sound-toggle"
              type="button"
              onClick={toggleSound}
              title={isMuted ? '開啟音效' : '靜音'}
              className={`p-2 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-fullscreen-toggle"
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? '結束全螢幕' : '全螢幕放映模式'}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors hidden sm:flex"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
