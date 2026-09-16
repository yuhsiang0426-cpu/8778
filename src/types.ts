export interface Student {
  id: string;
  name: string;
  seatNumber?: number | string;
}

export type DrawMode = 'unique' | 'repeatable';

export type GroupMode = 'by_group_size' | 'by_group_count';

export interface Group {
  id: string;
  name: string;
  members: Student[];
  leaderId?: string;
  colorTheme: {
    bg: string;
    border: string;
    badge: string;
    accent: string;
    lightBg: string;
  };
}

export interface DrawHistoryRecord {
  id: string;
  timestamp: string;
  studentName: string;
  mode: DrawMode;
}
