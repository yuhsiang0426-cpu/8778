/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RandomPicker } from './components/RandomPicker';
import { GroupMaker } from './components/GroupMaker';
import { RosterManager } from './components/RosterManager';
import { Student } from './types';
import { DEFAULT_DEMO_STUDENTS } from './utils/csvParser';

const STORAGE_KEY = 'classroom_tools_students_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'picker' | 'groups' | 'roster'>('picker');
  
  // Initialize students from localStorage or fallback to default demo class
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage fallback
    }
    return DEFAULT_DEMO_STUDENTS;
  });

  // Persist student roster to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // Storage error failsafe
    }
  }, [students]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <GroupMaker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            setStudents={setStudents}
            onNavigateToPicker={() => setActiveTab('picker')}
          />
        )}
      </main>

      {/* Classroom Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">課堂隨機抽籤與分組小工具</span>
            <span className="text-slate-400">•</span>
            <span>支援 CSV 上傳、動畫音效抽籤、智慧均衡分組</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className="hover:text-indigo-600 transition-colors"
            >
              編輯名單 ({students.length} 人)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('picker')}
              className="hover:text-indigo-600 transition-colors"
            >
              隨機點名
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className="hover:text-indigo-600 transition-colors"
            >
              自動分組
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

