import { MacroEntry } from '../types';
import { uid, parseDateStr } from '../utils';

export function parseMFPCsv(text: string): Omit<MacroEntry, 'id' | 'source'>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) {
    throw new Error('CSV looks empty');
  }

  const split = (l: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of l) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(x => x.trim());
  };

  const headers = split(lines[0]).map(h => h.toLowerCase());

  const findIndex = (names: string[]): number => {
    return headers.findIndex(h => names.some(n => h.includes(n)));
  };

  const dateIndex = findIndex(['date']);
  const calIndex = findIndex(['calories', 'kcal']);
  const proIndex = findIndex(['protein']);
  const carbIndex = findIndex(['carbohydrate', 'carbs']);
  const fatIndex = findIndex(['fat']);

  if (dateIndex < 0 || calIndex < 0) {
    throw new Error('CSV missing Date or Calories columns');
  }

  const byDate: Record<string, Omit<MacroEntry, 'id' | 'source'>> = {};

  for (let i = 1; i < lines.length; i++) {
    const row = split(lines[i]);
    if (!row[dateIndex]) continue;

    const date = parseDateStr(row[dateIndex]);
    if (!date) continue;

    const num = (value: string): number => {
      const x = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      return isNaN(x) ? 0 : x;
    };

    if (!byDate[date]) {
      byDate[date] = {
        date,
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    byDate[date].kcal += num(row[calIndex]);
    if (proIndex >= 0) byDate[date].protein += num(row[proIndex]);
    if (carbIndex >= 0) byDate[date].carbs += num(row[carbIndex]);
    if (fatIndex >= 0) byDate[date].fat += num(row[fatIndex]);
  }

  return Object.values(byDate).map(e => ({
    ...e,
    kcal: Math.round(e.kcal),
    protein: Math.round(e.protein),
    carbs: Math.round(e.carbs),
    fat: Math.round(e.fat),
  }));
}

export async function importMfpCsv(file: File): Promise<MacroEntry[]> {
  const text = await file.text();
  const rows = parseMFPCsv(text);

  if (!rows.length) {
    throw new Error('No rows parsed from this CSV');
  }

  return rows.map(row => ({
    ...row,
    id: uid(),
    source: 'mfp',
  }));
}
