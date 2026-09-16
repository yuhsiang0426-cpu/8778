import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  History, 
  Users, 
  CheckCircle2, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { Student, DrawMode, DrawHistoryRecord } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export function RandomPicker({ students, onNavigateToRoster }: RandomPickerProps) {
  // Settings
  const [drawMode, setDrawMode] = useState<DrawMode>('unique'); // default to 'unique' (不重複)
  
  // State for unique mode pool
  const [remainingPool, setRemainingPool] = useState<Student[]>([]);
  const [drawnStudents, setDrawnStudents] = useState<Student[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawHistoryRecord[]>([]);

  // Animation & Picking State
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayCandidate, setDisplayCandidate] = useState<Student | null>(null);
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(soundEffects.getMuted());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Initialize or synchronize candidate pool when students or mode change
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // If students list changed, sync the remaining pool
    setRemainingPool((prevPool) => {
      // Keep only students that still exist in `students`
      const studentMap = new Map(students.map((s) => [s.id, s]));
      const validPool = prevPool.filter((s) => studentMap.has(s.id));
      
      // If pool is empty or wasn't set, initialize with all students
      if (validPool.length === 0 && students.length > 0) {
        return [...students];
      }
      return validPool;
    });

    setDrawnStudents((prev) => {
      const studentMap = new Map(students.map((s) => [s.id, s]));
      return prev.filter((s) => studentMap.has(s.id));
    });
  }, [students]);

  // Reset unique draw pool
  const handleResetPool = () => {
    setRemainingPool([...students]);
    setDrawnStudents([]);
    soundEffects.playPop();
  };

  // Put a student back into remaining pool
  const handlePutBack = (student: Student) => {
    setDrawnStudents((prev) => prev.filter((s) => s.id !== student.id));
    setRemainingPool((prev) => (prev.some((s) => s.id === student.id) ? prev : [...prev, student]));
    if (currentWinner?.id === student.id) {
      setCurrentWinner(null);
    }
    soundEffects.playPop();
  };

  // Fire celebratory confetti burst
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // Confetti fallback
    }
  };

  // Start the draw process with deceleration animation and ticking sound
  const handleStartDraw = () => {
    const candidates = drawMode === 'unique' ? remainingPool : students;

    if (candidates.length === 0) {
      soundEffects.playPop();
      return;
    }

    if (candidates.length === 1 && drawMode === 'unique') {
      // Only 1 student left, pick them with celebration
      const winner = candidates[0];
      setCurrentWinner(winner);
      setDisplayCandidate(winner);
      setRemainingPool([]);
      setDrawnStudents((prev) => [winner, ...prev]);
      setDrawHistory((prev) => [
        {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          studentName: winner.name,
          mode: drawMode,
        },
        ...prev,
      ]);
      soundEffects.playFanfare();
      triggerConfetti();
      return;
    }

    setIsSpinning(true);
    setCurrentWinner(null);

    // Randomly pick the final winner beforehand
    const winnerIndex = Math.floor(Math.random() * candidates.length);
    const finalWinner = candidates[winnerIndex];

    // Animation timeline parameters
    let currentSpeed = 40; // initial interval in ms (very fast)
    let elapsed = 0;
    const totalDuration = 2600; // total spin time ~2.6 seconds

    const spinStep = () => {
      if (!isMountedRef.current) return;

      // Pick a random candidate to show on screen
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const showing = candidates[randomIndex];
      setDisplayCandidate(showing);

      // Play procedural ticker sound
      const pitch = 0.8 + (1 - elapsed / totalDuration) * 0.4;
      soundEffects.playTick(pitch);

      elapsed += currentSpeed;

      // Gradually slow down speed using quadratic easing
      const progress = elapsed / totalDuration;
      if (progress < 0.6) {
        currentSpeed = 40 + Math.floor(progress * 40);
      } else if (progress < 0.85) {
        currentSpeed = 90 + Math.floor((progress - 0.6) * 350);
      } else {
        currentSpeed = 220 + Math.floor((progress - 0.85) * 600);
      }

      if (elapsed < totalDuration) {
        timerRef.current = setTimeout(spinStep, currentSpeed);
      } else {
        // Final reveal!
        setDisplayCandidate(finalWinner);
        setCurrentWinner(finalWinner);
        setIsSpinning(false);

        // Update pools
        if (drawMode === 'unique') {
          setRemainingPool((prev) => prev.filter((s) => s.id !== finalWinner.id));
          setDrawnStudents((prev) => [finalWinner, ...prev]);
        }

        // Add to history
        setDrawHistory((prev) => [
          {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            studentName: finalWinner.name,
            mode: drawMode,
          },
          ...prev,
        ]);

        // Play victory sound & confetti
        soundEffects.playFanfare();
        triggerConfetti();
      }
    };

    spinStep();
  };

  const toggleSound = () => {
    const next = !isSoundMuted;
    soundEffects.setMuted(next);
    setIsSoundMuted(next);
  };

  const candidatePool = drawMode === 'unique' ? remainingPool : students;

  if (students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">尚未匯入學生名單</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            抽籤前請先上傳 CSV 或貼上學生姓名名單。
          </p>
          <button
            type="button"
            onClick={onNavigateToRoster}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all"
          >
            前往名單管理
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Settings Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Draw Mode Switch */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-700">抽籤規則：</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              id="mode-unique"
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setDrawMode('unique');
                soundEffects.playPop();
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                drawMode === 'unique'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🚫 抽籤不重複 (推薦課堂點名)
            </button>
            <button
              id="mode-repeatable"
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setDrawMode('repeatable');
                soundEffects.playPop();
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                drawMode === 'repeatable'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 允許重複抽取
            </button>
          </div>
        </div>

        {/* Status & Pool Stats */}
        <div className="flex items-center gap-3">
          {drawMode === 'unique' && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
              <span className="text-slate-500">待抽候選：</span>
              <span className="font-bold text-indigo-700">
                {remainingPool.length} / {students.length} 人
              </span>
            </div>
          )}

          {drawMode === 'unique' && remainingPool.length < students.length && (
            <button
              id="btn-reset-pool"
              type="button"
              disabled={isSpinning}
              onClick={handleResetPool}
              title="重設抽籤池，讓所有學生重新進入待抽名單"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              重新洗牌
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isSoundMuted
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSoundMuted ? '音效已關閉' : '音效已開啟'}</span>
          </button>
        </div>
      </div>

      {/* Main Draw Arena / Interactive Stage */}
      <div className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-12 text-white shadow-2xl border border-indigo-900/60 overflow-hidden text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Tag */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>
            {drawMode === 'unique' ? '單次不重複抽籤模式' : '自由抽籤模式 (可重複)'}
          </span>
        </div>

        {/* Display Container / Slot-Machine Display */}
        <div className="relative z-10 max-w-xl mx-auto my-4">
          <div
            className={`relative min-h-[190px] sm:min-h-[220px] rounded-2xl flex flex-col items-center justify-center p-6 border transition-all ${
              isSpinning
                ? 'bg-slate-800/80 border-indigo-400/80 shadow-[0_0_40px_rgba(99,102,241,0.35)] scale-[1.02]'
                : currentWinner
                ? 'bg-gradient-to-br from-indigo-900/90 to-violet-900/90 border-amber-400/70 shadow-[0_0_50px_rgba(251,191,36,0.3)]'
                : 'bg-slate-800/40 border-white/10'
            }`}
          >
            {/* Spinning Indicator or Winner Trophy */}
            {currentWinner && !isSpinning && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 shadow-xs animate-bounce">
                <Trophy className="w-3.5 h-3.5" />
                恭喜中選！
              </div>
            )}

            {isSpinning && (
              <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-2 animate-pulse">
                🎲 正在隨機抽取中...
              </div>
            )}

            {/* Central Student Display */}
            <div className="py-2">
              {displayCandidate ? (
                <div className="space-y-1">
                  {displayCandidate.seatNumber && (
                    <span className="inline-block px-3 py-0.5 rounded-lg bg-white/15 text-indigo-200 font-mono text-sm sm:text-base font-semibold">
                      座號 {displayCandidate.seatNumber}
                    </span>
                  )}
                  <h2
                    className={`font-black tracking-wider transition-all ${
                      isSpinning
                        ? 'text-4xl sm:text-6xl text-slate-100 opacity-90 blur-[0.3px]'
                        : 'text-5xl sm:text-7xl text-white font-extrabold drop-shadow-md scale-105'
                    }`}
                  >
                    {displayCandidate.name}
                  </h2>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 text-white/70 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-300">
                    準備好開始抽籤了嗎？
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    點擊下方按鈕，伴隨動畫音效隨機選出幸運學生！
                  </p>
                </div>
              )}
            </div>

            {/* If all candidates are drawn in unique mode */}
            {drawMode === 'unique' && remainingPool.length === 0 && !isSpinning && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs">
                🎉 全班所有學生皆已抽過一輪！可點選上方「重新洗牌」重新開始。
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="btn-start-draw"
            type="button"
            disabled={isSpinning || candidatePool.length === 0}
            onClick={handleStartDraw}
            className={`w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-2xl text-lg sm:text-xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 ${
              isSpinning
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : candidatePool.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10'
                : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 hover:scale-105 active:scale-95 shadow-amber-500/20'
            }`}
          >
            <Sparkles className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>
              {isSpinning
                ? '抽取中...'
                : candidatePool.length === 0
                ? '名單已抽完'
                : '開始隨機抽籤'}
            </span>
          </button>

          {currentWinner && !isSpinning && drawMode === 'unique' && (
            <button
              id="btn-put-back-student"
              type="button"
              onClick={() => handlePutBack(currentWinner)}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors border border-white/15"
            >
              放回候選池
            </button>
          )}
        </div>
      </div>

      {/* Two Column Section: Remaining Pool & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Draw Pool Status (Remaining or All) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {drawMode === 'unique' ? '待抽名單池' : '全體學生名單'}
                </h3>
                <p className="text-xs text-slate-500">
                  {drawMode === 'unique'
                    ? `剩餘 ${remainingPool.length} 位同學尚未被抽出`
                    : `共有 ${students.length} 位同學可供隨機抽取`}
                </p>
              </div>
            </div>

            {drawMode === 'unique' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                剩餘 {remainingPool.length} 人
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            {candidatePool.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                目前待抽名單已空，請點選「重新洗牌」重置！
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidatePool.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/60"
                  >
                    {student.seatNumber && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        #{student.seatNumber}
                      </span>
                    )}
                    <span>{student.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Draw History & Drawn Students */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {drawMode === 'unique' ? '已抽出學生名單' : '抽籤歷史紀錄'}
                </h3>
                <p className="text-xs text-slate-500">
                  {drawMode === 'unique'
                    ? `已抽出 ${drawnStudents.length} 位同學`
                    : `共進行了 ${drawHistory.length} 次抽籤`}
                </p>
              </div>
            </div>

            {drawMode === 'unique' && drawnStudents.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                已抽出 {drawnStudents.length} 人
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            {drawMode === 'unique' ? (
              drawnStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  尚未抽出任何學生
                </div>
              ) : (
                <div className="space-y-2">
                  {drawnStudents.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                          {drawnStudents.length - idx}
                        </span>
                        <span className="font-medium text-slate-900">{s.name}</span>
                        {s.seatNumber && (
                          <span className="text-slate-400 text-xs font-mono">
                            (座號 {s.seatNumber})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePutBack(s)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        放回
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : drawHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                尚無抽籤紀錄
              </div>
            ) : (
              <div className="space-y-2">
                {drawHistory.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-mono">#{drawHistory.length - idx}</span>
                      <span className="font-semibold text-slate-900">{item.studentName}</span>
                    </div>
                    <span className="text-slate-400 text-xs font-mono">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
