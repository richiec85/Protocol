import { describe, it, expect } from 'vitest';
import { pad, fmt, isoDate, today, daysSince, weekKey, uid, parseDateStr, phaseColor, emptyStore, migrateV1, normalize } from '../utils';
import { SCHEMA_VERSION, SEEDED_COMPOUNDS } from '../types';

describe('Utility Functions', () => {
  describe('pad', () => {
    it('pads single digit numbers', () => {
      expect(pad(5)).toBe('05');
      expect(pad(9)).toBe('09');
    });

    it('does not pad double digit numbers', () => {
      expect(pad(10)).toBe('10');
      expect(pad(99)).toBe('99');
    });
  });

  describe('isoDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-01-15T12:00:00Z');
      expect(isoDate(date)).toBe('2023-01-15');
    });
  });

  describe('today', () => {
    it('returns current date in ISO format', () => {
      const result = today();
      const todayDate = new Date();
      expect(result).toBe(`${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`);
    });
  });

  describe('daysSince', () => {
    it('calculates days since date correctly', () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const isoString = testDate.toISOString().split('T')[0];
      const result = daysSince(isoString);
      expect(result).toBeCloseTo(5, 1);
    });
  });

  describe('weekKey', () => {
    it('returns week start date for given date', () => {
      const result = weekKey('2023-01-15');
      expect(result).toBe('2023-01-16');
    });
  });

  describe('uid', () => {
    it('generates unique IDs', () => {
      const id1 = uid();
      const id2 = uid();
      expect(id1).not.toBe(id2);
    });
  });

  describe('parseDateStr', () => {
    it('parses ISO format dates', () => {
      expect(parseDateStr('2023-01-15')).toBe('2023-01-15');
    });

    it('parses DD/MM/YYYY format dates', () => {
      expect(parseDateStr('15/01/2023')).toBe('2023-01-15');
    });
  });

  describe('phaseColor', () => {
    it('returns correct colors for known phases', () => {
      expect(phaseColor('cut')).toBe('#00d4ff');
      expect(phaseColor('grow')).toBe('#7fff6b');
    });
  });

  describe('emptyStore', () => {
    it('returns store with seeded compounds', () => {
      const store = emptyStore();
      expect(store.compounds).toHaveLength(2);
      expect(store.compounds[0]).toEqual(SEEDED_COMPOUNDS[0]);
    });
  });
});
