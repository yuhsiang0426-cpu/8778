import { Student } from '../types';

export const DEFAULT_DEMO_STUDENTS: Student[] = [
  { id: 's-1', seatNumber: 1, name: '陳韋志' },
  { id: 's-2', seatNumber: 2, name: '林雅婷' },
  { id: 's-3', seatNumber: 3, name: '黃冠宇' },
  { id: 's-4', seatNumber: 4, name: '張家瑋' },
  { id: 's-5', seatNumber: 5, name: '李佩珊' },
  { id: 's-6', seatNumber: 6, name: '王俊傑' },
  { id: 's-7', seatNumber: 7, name: '吳宜蓁' },
  { id: 's-8', seatNumber: 8, name: '劉建宏' },
  { id: 's-9', seatNumber: 9, name: '蔡欣怡' },
  { id: 's-10', seatNumber: 10, name: '楊承翰' },
  { id: 's-11', seatNumber: 11, name: '許家豪' },
  { id: 's-12', seatNumber: 12, name: '鄭惠雯' },
  { id: 's-13', seatNumber: 13, name: '謝政廷' },
  { id: 's-14', seatNumber: 14, name: '郭美玲' },
  { id: 's-15', seatNumber: 15, name: '洪偉哲' },
  { id: 's-16', seatNumber: 16, name: '曾詩婷' },
  { id: 's-17', seatNumber: 17, name: '邱柏翰' },
  { id: 's-18', seatNumber: 18, name: '廖子涵' },
  { id: 's-19', seatNumber: 19, name: '周宗翰' },
  { id: 's-20', seatNumber: 20, name: '徐雅筑' },
  { id: 's-21', seatNumber: 21, name: '蘇育賢' },
  { id: 's-22', seatNumber: 22, name: '葉佳穎' },
  { id: 's-23', seatNumber: 23, name: '莊宇翔' },
  { id: 's-24', seatNumber: 24, name: '呂宜婷' },
  { id: 's-25', seatNumber: 25, name: '江柏均' },
  { id: 's-26', seatNumber: 26, name: '何思穎' },
  { id: 's-27', seatNumber: 27, name: '蕭宏達' },
  { id: 's-28', seatNumber: 28, name: '潘靜萱' },
];

/**
 * Generates an arbitrary unique ID
 */
export function generateId(): string {
  return 's-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

/**
 * Parses raw text input (from paste textarea) into students.
 * Supports newline-separated, comma-separated, tab-separated or space-separated names.
 */
export function parsePastedNames(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check if it's newline separated
  const rawLines = cleanText.split('\n');
  const studentList: Student[] = [];
  let seatCounter = 1;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split on commas or tabs if multiple names are on the same line
    const tokens = trimmed.split(/[,，\t]+/);
    for (const token of tokens) {
      const name = token.trim();
      if (!name) continue;

      // Filter out pure headers if any
      if (['姓名', '名字', '學生姓名', 'name', 'student', '座號'].includes(name.toLowerCase())) {
        continue;
      }

      studentList.push({
        id: generateId(),
        seatNumber: seatCounter++,
        name,
      });
    }
  }

  return studentList;
}

/**
 * Parses CSV raw string into Student records.
 * Supports headers like "座號,姓名" or single column names.
 */
export function parseCsvContent(content: string): Student[] {
  if (!content) return [];

  // Remove potential UTF-8 BOM
  let cleaned = content;
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.substring(1);
  }

  const lines = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const results: Student[] = [];

  // Check if first line is a header
  const firstRowCols = splitCsvLine(lines[0]);
  let nameColIdx = 0;
  let seatColIdx = -1;
  let startIndex = 0;

  const headerKeywords = ['姓名', '名字', '學生', 'student', 'name', 'full name', '學生姓名'];
  const seatKeywords = ['座號', '學號', '編號', 'no', 'id', 'seat', 'number'];

  const hasHeader = firstRowCols.some((col) =>
    headerKeywords.includes(col.toLowerCase().trim()) || seatKeywords.includes(col.toLowerCase().trim())
  );

  if (hasHeader) {
    startIndex = 1;
    firstRowCols.forEach((col, idx) => {
      const lower = col.toLowerCase().trim();
      if (headerKeywords.includes(lower)) {
        nameColIdx = idx;
      } else if (seatKeywords.includes(lower)) {
        seatColIdx = idx;
      }
    });
  } else if (firstRowCols.length > 1) {
    // If no header, heuristic: if first column is numeric, seat is col 0, name is col 1
    if (/^\d+$/.test(firstRowCols[0].trim())) {
      seatColIdx = 0;
      nameColIdx = 1;
    }
  }

  let autoSeat = 1;
  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length === 0) continue;

    const rawName = cols[nameColIdx] !== undefined ? cols[nameColIdx].trim() : cols[0].trim();
    if (!rawName) continue;

    let seat: number | string = autoSeat++;
    if (seatColIdx !== -1 && cols[seatColIdx] !== undefined) {
      const rawSeat = cols[seatColIdx].trim();
      if (rawSeat) {
        seat = isNaN(Number(rawSeat)) ? rawSeat : Number(rawSeat);
      }
    }

    results.push({
      id: generateId(),
      name: rawName,
      seatNumber: seat,
    });
  }

  return results;
}

/**
 * Splits CSV line properly accounting for double quotes
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Exports students to CSV string
 */
export function exportToCsv(students: Student[]): string {
  const header = '\uFEFF座號,姓名\n';
  const rows = students
    .map((s, idx) => `${s.seatNumber ?? idx + 1},"${s.name.replace(/"/g, '""')}"`)
    .join('\n');
  return header + rows;
}
