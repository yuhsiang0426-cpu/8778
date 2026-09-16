import { useState, useMemo } from 'react';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Download, 
  Crown, 
  Check, 
  ArrowRight,
  Sparkles,
  ArrowRightLeft,
  Settings2
} from 'lucide-react';
import { Student, Group, GroupMode } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface GroupMakerProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

const COLOR_PALETTES = [
  {
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-200',
    badge: 'bg-indigo-600 text-white',
    accent: 'text-indigo-700',
    lightBg: 'bg-indigo-100/60',
  },
  {
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    accent: 'text-emerald-700',
    lightBg: 'bg-emerald-100/60',
  },
  {
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    badge: 'bg-amber-600 text-white',
    accent: 'text-amber-800',
    lightBg: 'bg-amber-100/60',
  },
  {
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    badge: 'bg-rose-600 text-white',
    accent: 'text-rose-700',
    lightBg: 'bg-rose-100/60',
  },
  {
    bg: 'bg-cyan-50/70',
    border: 'border-cyan-200',
    badge: 'bg-cyan-600 text-white',
    accent: 'text-cyan-700',
    lightBg: 'bg-cyan-100/60',
  },
  {
    bg: 'bg-violet-50/70',
    border: 'border-violet-200',
    badge: 'bg-violet-600 text-white',
    accent: 'text-violet-700',
    lightBg: 'bg-violet-100/60',
  },
  {
    bg: 'bg-orange-50/70',
    border: 'border-orange-200',
    badge: 'bg-orange-600 text-white',
    accent: 'text-orange-700',
    lightBg: 'bg-orange-100/60',
  },
  {
    bg: 'bg-teal-50/70',
    border: 'border-teal-200',
    badge: 'bg-teal-600 text-white',
    accent: 'text-teal-700',
    lightBg: 'bg-teal-100/60',
  },
];

export function GroupMaker({ students, onNavigateToRoster }: GroupMakerProps) {
  const [groupMode, setGroupMode] = useState<GroupMode>('by_group_size'); // 'by_group_size' (每組幾人) or 'by_group_count' (分幾組)
  const [targetSize, setTargetSize] = useState<number>(4);
  const [targetCount, setTargetCount] = useState<number>(4);
  const [assignLeader, setAssignLeader] = useState<boolean>(true);
  const [balanceRemainder, setBalanceRemainder] = useState<boolean>(true);

  const [groups, setGroups] = useState<Group[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Selected student for quick manual move/swap between groups
  const [selectedStudentForMove, setSelectedStudentForMove] = useState<{
    groupId: string;
    student: Student;
  } | null>(null);

  // Calculate estimated group distribution for preview
  const previewInfo = useMemo(() => {
    const total = students.length;
    if (total === 0) return { groupCount: 0, text: '' };

    if (groupMode === 'by_group_size') {
      const size = Math.max(1, targetSize);
      const calculatedGroups = Math.ceil(total / size);
      const remainder = total % size;

      if (remainder === 0) {
        return {
          groupCount: calculatedGroups,
          text: `全班 ${total} 人，每組 ${size} 人 ➔ 剛好分成 ${calculatedGroups} 組`,
        };
      } else if (balanceRemainder) {
        // Distribute remainder evenly
        const baseSize = Math.floor(total / calculatedGroups);
        const extraStudents = total % calculatedGroups;
        return {
          groupCount: calculatedGroups,
          text: `全班 ${total} 人，預計分成 ${calculatedGroups} 組 ➔ ${extraStudents} 組有 ${baseSize + 1} 人，${calculatedGroups - extraStudents} 組有 ${baseSize} 人 (均衡平分)`,
        };
      } else {
        const fullGroups = Math.floor(total / size);
        return {
          groupCount: fullGroups + 1,
          text: `全班 ${total} 人 ➔ ${fullGroups} 組為 ${size} 人，最後 1 組為 ${remainder} 人`,
        };
      }
    } else {
      const count = Math.max(1, Math.min(targetCount, total));
      const base = Math.floor(total / count);
      const extra = total % count;
      return {
        groupCount: count,
        text: `全班 ${total} 人，分成 ${count} 組 ➔ ${extra > 0 ? `${extra} 組有 ${base + 1} 人，其餘 ${count - extra} 組有 ${base} 人` : `每組剛好 ${base} 人`}`,
      };
    }
  }, [students.length, groupMode, targetSize, targetCount, balanceRemainder]);

  // Execute random grouping algorithm
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    soundEffects.playShuffle();

    setTimeout(() => {
      // Fisher-Yates shuffle
      const shuffled = [...students];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      let numGroups = 1;
      const total = shuffled.length;

      if (groupMode === 'by_group_size') {
        const size = Math.max(1, targetSize);
        numGroups = Math.max(1, Math.ceil(total / size));
      } else {
        numGroups = Math.max(1, Math.min(targetCount, total));
      }

      // Initialize buckets
      const groupBuckets: Student[][] = Array.from({ length: numGroups }, () => []);

      if (balanceRemainder || groupMode === 'by_group_count') {
        // Distribute round-robin to keep sizes as even as possible
        shuffled.forEach((student, index) => {
          const bucketIndex = index % numGroups;
          groupBuckets[bucketIndex].push(student);
        });
      } else {
        // Sequential grouping
        const size = Math.max(1, targetSize);
        let currentBucket = 0;
        shuffled.forEach((student) => {
          if (groupBuckets[currentBucket].length >= size && currentBucket < numGroups - 1) {
            currentBucket++;
          }
          groupBuckets[currentBucket].push(student);
        });
      }

      // Filter out empty groups if any
      const resultGroups: Group[] = groupBuckets
        .filter((b) => b.length > 0)
        .map((members, idx) => {
          const colorTheme = COLOR_PALETTES[idx % COLOR_PALETTES.length];
          // Assign random leader if requested
          let leaderId: string | undefined = undefined;
          if (assignLeader && members.length > 0) {
            const randomLeaderIndex = Math.floor(Math.random() * members.length);
            leaderId = members[randomLeaderIndex].id;
          }

          return {
            id: `group-${idx + 1}-${Date.now()}`,
            name: `第 ${idx + 1} 組`,
            members,
            leaderId,
            colorTheme,
          };
        });

      setGroups(resultGroups);
      setSelectedStudentForMove(null);
      setIsShuffling(false);
      soundEffects.playFanfare();
    }, 400);
  };

  // Move student to another group
  const handleMoveStudentToGroup = (targetGroupId: string) => {
    if (!selectedStudentForMove) return;
    const { groupId: sourceGroupId, student } = selectedStudentForMove;

    if (sourceGroupId === targetGroupId) {
      setSelectedStudentForMove(null);
      return;
    }

    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id === sourceGroupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.id !== student.id),
            leaderId: g.leaderId === student.id ? undefined : g.leaderId,
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, student],
          };
        }
        return g;
      })
    );

    setSelectedStudentForMove(null);
    soundEffects.playPop();
  };

  // Toggle leader in group
  const handleToggleLeader = (groupId: string, studentId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            leaderId: g.leaderId === studentId ? undefined : studentId,
          };
        }
        return g;
      })
    );
    soundEffects.playPop();
  };

  // Copy formatted group result to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;

    let text = `【分組結果】共 ${groups.length} 組（全班 ${students.length} 人）\n\n`;
    groups.forEach((g) => {
      const leader = g.members.find((m) => m.id === g.leaderId);
      text += `${g.name} (${g.members.length}人):\n`;
      if (leader) {
        text += `  👑 組長：${leader.name}${leader.seatNumber ? ` (座號${leader.seatNumber})` : ''}\n`;
      }
      text += `  成員：${g.members.map((m) => `${m.name}${m.seatNumber ? `(${m.seatNumber})` : ''}`).join('、')}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    soundEffects.playPop();
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Download groups as CSV
  const handleExportCsv = () => {
    if (groups.length === 0) return;

    let csv = '\uFEFF組別,組長,座號,姓名\n';
    groups.forEach((g) => {
      g.members.forEach((m) => {
        const isLeader = m.id === g.leaderId ? '是' : '否';
        csv += `"${g.name}","${isLeader}","${m.seatNumber ?? ''}","${m.name}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `課堂分組結果_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEffects.playPop();
  };

  if (students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">尚未匯入學生名單</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            進行自動分組前，請先建立或載入學生名單。
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
      {/* Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">分組文字已複製到剪貼簿！</span>
        </div>
      )}

      {/* Control & Setting Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">設定分組規則</h3>
              <p className="text-xs text-slate-500">
                可指定每組人數或總組數，支援智慧均分與指派小組長
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">目前人數：</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              全班共 {students.length} 人
            </span>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode 1: By Group Size */}
          <div
            onClick={() => {
              setGroupMode('by_group_size');
              soundEffects.playPop();
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              groupMode === 'by_group_size'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                方式 A
              </span>
              <input
                type="radio"
                name="groupMode"
                checked={groupMode === 'by_group_size'}
                onChange={() => setGroupMode('by_group_size')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              指定每組人數
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                max={students.length}
                value={targetSize}
                onChange={(e) => setTargetSize(Math.max(1, Number(e.target.value)))}
                disabled={groupMode !== 'by_group_size'}
                className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
              <span className="text-xs text-slate-500">人 / 組</span>
            </div>
          </div>

          {/* Mode 2: By Group Count */}
          <div
            onClick={() => {
              setGroupMode('by_group_count');
              soundEffects.playPop();
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              groupMode === 'by_group_count'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                方式 B
              </span>
              <input
                type="radio"
                name="groupMode"
                checked={groupMode === 'by_group_count'}
                onChange={() => setGroupMode('by_group_count')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              指定總組數
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                max={Math.max(2, Math.floor(students.length / 2))}
                value={targetCount}
                onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
                disabled={groupMode !== 'by_group_count'}
                className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
              <span className="text-xs text-slate-500">組</span>
            </div>
          </div>

          {/* Setting: Assign Leader */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                組長機制
              </span>
              <span className="text-sm font-bold text-slate-800">
                隨機指定小組長 👑
              </span>
              <p className="text-xs text-slate-400 mt-1">
                每組隨機指派 1 位同學擔任小組長
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={assignLeader}
                onChange={(e) => setAssignLeader(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2 text-xs font-medium text-slate-600">
                {assignLeader ? '已啟用' : '已關閉'}
              </span>
            </label>
          </div>

          {/* Setting: Balance Remainder */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                餘數處理
              </span>
              <span className="text-sm font-bold text-slate-800">
                平衡均分餘數
              </span>
              <p className="text-xs text-slate-400 mt-1">
                避免最後一組人數過少，將餘數均分到各組
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={balanceRemainder}
                onChange={(e) => setBalanceRemainder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2 text-xs font-medium text-slate-600">
                {balanceRemainder ? '均分補入' : '最後獨立一組'}
              </span>
            </label>
          </div>
        </div>

        {/* Preview Banner and Action Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-medium">{previewInfo.text}</span>
          </div>

          <button
            id="btn-generate-groups"
            type="button"
            disabled={isShuffling}
            onClick={handleGenerateGroups}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 ${
              isShuffling
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/20'
            }`}
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{groups.length === 0 ? '開始自動分組' : '重新隨機洗牌分組'}</span>
          </button>
        </div>
      </div>

      {/* Manual Move Helper Notice */}
      {selectedStudentForMove && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-indigo-900">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <span>
              已選取學生：<strong>{selectedStudentForMove.student.name}</strong>，請點擊目標組別以完成調動。
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStudentForMove(null)}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-1 rounded bg-white border border-indigo-200"
          >
            取消調動
          </button>
        </div>
      )}

      {/* Groups Display Section */}
      {groups.length > 0 && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-base">
                分組結果展示
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                共 {groups.length} 組
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-copy-groups"
                type="button"
                onClick={handleCopyGroups}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                複製分組名單
              </button>

              <button
                id="btn-download-group-csv"
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-slate-500" />
                下載 CSV
              </button>
            </div>
          </div>

          {/* Group Visual Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  if (selectedStudentForMove) {
                    handleMoveStudentToGroup(group.id);
                  }
                }}
                className={`rounded-2xl border ${group.colorTheme.border} ${
                  group.colorTheme.bg
                } p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                  selectedStudentForMove && selectedStudentForMove.groupId !== group.id
                    ? 'ring-2 ring-indigo-400 ring-offset-2 cursor-pointer hover:scale-[1.02]'
                    : ''
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold ${group.colorTheme.badge}`}
                    >
                      {group.name}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {group.members.length} 人
                    </span>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    {group.members.map((member) => {
                      const isLeader = member.id === group.leaderId;
                      const isSelected = selectedStudentForMove?.student.id === member.id;

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white border-slate-200/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {member.seatNumber || '#'}
                            </span>
                            <span
                              className={`text-sm font-semibold truncate ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {member.name}
                            </span>
                            {isLeader && (
                              <span
                                title="小組長"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300"
                              >
                                <Crown className="w-2.5 h-2.5" />
                                組長
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Toggle Leader Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLeader(group.id, member.id);
                              }}
                              title={isLeader ? '取消組長' : '設為組長'}
                              className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                                isLeader ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                              }`}
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>

                            {/* Move / Swap Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  setSelectedStudentForMove(null);
                                } else {
                                  setSelectedStudentForMove({ groupId: group.id, student: member });
                                  soundEffects.playPop();
                                }
                              }}
                              title="移動至其他組"
                              className={`p-1 rounded text-xs transition-colors ${
                                isSelected
                                  ? 'text-white bg-indigo-700'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                              }`}
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer hint */}
                <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>點擊 👑 可指派組長</span>
                  <span>點擊 ⇄ 可微調換組</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
