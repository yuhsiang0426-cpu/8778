import { useState, useRef, ChangeEvent, DragEvent, FormEvent } from 'react';
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  Search, 
  Check, 
  Users, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types';
import { 
  parsePastedNames, 
  parseCsvContent, 
  exportToCsv, 
  DEFAULT_DEMO_STUDENTS, 
  generateId 
} from '../utils/csvParser';
import { soundEffects } from '../utils/soundEffects';

interface RosterManagerProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  onNavigateToPicker: () => void;
}

export function RosterManager({ students, setStudents, onNavigateToPicker }: RosterManagerProps) {
  const [pasteInput, setPasteInput] = useState('');
  const [singleNameInput, setSingleNameInput] = useState('');
  const [singleSeatInput, setSingleSeatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle direct paste import
  const handleImportPasted = () => {
    if (!pasteInput.trim()) {
      showToast('請先貼上或輸入學生姓名');
      return;
    }
    const newStudents = parsePastedNames(pasteInput);
    if (newStudents.length === 0) {
      showToast('未能辨識出學生名單，請確認格式');
      return;
    }

    setStudents(newStudents);
    setPasteInput('');
    soundEffects.playPop();
    showToast(`成功匯入 ${newStudents.length} 位學生名單！`);
  };

  // Handle CSV file upload
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseCsvContent(content);
        if (parsed.length > 0) {
          setStudents(parsed);
          soundEffects.playPop();
          showToast(`成功從 CSV 匯入 ${parsed.length} 位學生！`);
        } else {
          showToast('無法從檔案中辨識出學生名單，請確認格式');
        }
      }
    };
    reader.onerror = () => {
      showToast('讀取檔案失敗，請再試一次');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Add individual student
  const handleAddSingleStudent = (e: FormEvent) => {
    e.preventDefault();
    const name = singleNameInput.trim();
    if (!name) return;

    const newStudent: Student = {
      id: generateId(),
      name,
      seatNumber: singleSeatInput.trim() || students.length + 1,
    };

    setStudents([...students, newStudent]);
    setSingleNameInput('');
    setSingleSeatInput('');
    soundEffects.playPop();
    showToast(`已新增學生：${name}`);
  };

  // Delete student
  const handleDeleteStudent = (id: string, name: string) => {
    setStudents(students.filter((s) => s.id !== id));
    soundEffects.playPop();
    showToast(`已刪除 ${name}`);
  };

  // Clear all students
  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空目前的學生名單嗎？')) {
      setStudents([]);
      soundEffects.playPop();
      showToast('已清空名單');
    }
  };

  // Load demo sample students
  const handleLoadDemo = () => {
    setStudents([...DEFAULT_DEMO_STUDENTS]);
    soundEffects.playFanfare();
    showToast(`已載入範例班級名單（共 ${DEFAULT_DEMO_STUDENTS.length} 位學生）`);
  };

  // Export current roster to CSV
  const handleExportCsv = () => {
    if (students.length === 0) {
      showToast('目前尚無名單可匯出');
      return;
    }
    const csvData = exportToCsv(students);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEffects.playPop();
    showToast('名單 CSV 匯出完成');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.seatNumber || '').includes(searchQuery)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Quick Action */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                名單資料庫
              </span>
              <span className="text-xs text-indigo-300">
                目前名單：{students.length} 位學生
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              建立與管理班級學生名單
            </h2>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              支援上傳 CSV 試算表或直接複製貼上姓名，自動解析座號與學生名單，隨時隨地輕鬆抽籤與分組。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              id="btn-load-demo"
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-100 border border-indigo-400/40 text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              載入範例名單 (28人)
            </button>

            {students.length > 0 && (
              <button
                id="btn-quick-start-picker"
                type="button"
                onClick={onNavigateToPicker}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-sm shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                立即前往抽籤 ({students.length}人)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Input Methods: Grid layout with CSV Dropzone and Paste Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: CSV Upload with Drag & Drop */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">方式一：上傳 CSV / TXT 檔案</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              支援包含「座號、姓名」欄位的 Excel 匯出 CSV，或一般純文字檔。
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                點擊選取檔案 或 將 CSV 拖曳至此
              </p>
              <p className="text-xs text-slate-400 mt-1">
                支援 .csv, .txt 格式（自動解析編碼與欄位）
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>範例格式：座號,姓名 或 直接單欄姓名</span>
            <span className="font-mono text-slate-400">UTF-8 / Big5 自動識別</span>
          </div>
        </div>

        {/* Box 2: Direct Paste Input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">方式二：直接貼上姓名清單</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              支援一行一個名字，或以逗號（,）、空格分隔，系統將自動提取。
            </p>

            <textarea
              id="textarea-paste-students"
              rows={5}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="例如：&#10;陳小明&#10;林美麗&#10;張大千&#10;或：王小強, 李中天, 趙子龍"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-sans placeholder:text-slate-400 resize-none"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              貼上後點擊匯入即更新名單
            </span>
            <button
              id="btn-parse-paste"
              type="button"
              onClick={handleImportPasted}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
            >
              解析並匯入
            </button>
          </div>
        </div>
      </div>

      {/* Student List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header Controls */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">目前學生名單</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  {students.length} 人
                </span>
              </div>
              <p className="text-xs text-slate-500">
                可單獨新增、刪除或匯出備份
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋姓名或座號..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-36 sm:w-48"
              />
            </div>

            {students.length > 0 && (
              <>
                <button
                  id="btn-export-csv"
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出 CSV
                </button>

                <button
                  id="btn-clear-roster"
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空名單
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Add Single Student Bar */}
        <form
          onSubmit={handleAddSingleStudent}
          className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Plus className="w-4 h-4 text-indigo-600" />
            快速新增單一學生：
          </div>

          <input
            type="text"
            placeholder="座號 (選填)"
            value={singleSeatInput}
            onChange={(e) => setSingleSeatInput(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />

          <input
            type="text"
            placeholder="學生姓名 (必填)"
            value={singleNameInput}
            onChange={(e) => setSingleNameInput(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />

          <button
            type="submit"
            disabled={!singleNameInput.trim()}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            加入
          </button>
        </form>

        {/* Students Badges / Grid */}
        <div className="p-6">
          {students.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 opacity-80" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">目前名單是空的</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                您可以上傳 CSV 檔案、直接貼上名單，或是載入系統準備的 28 位學生範例名單進行體驗。
              </p>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                一鍵載入範例名單
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              查無符合「{searchQuery}」的學生
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="group relative flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {student.seatNumber || '#'}
                    </span>
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {student.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(student.id, student.name)}
                    title={`刪除 ${student.name}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
