import { describe, expect, it } from 'vitest';
import { formatBytes, formatDate, formatDuration, formatNumber } from '@/utils/formatters';

describe('Formatters Utility Suite', () => {
  it('formats bytes into human readable binary units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(null)).toBe('0 B');
  });

  it('formats execution duration seconds', () => {
    expect(formatDuration(0.5)).toBe('500 ms');
    expect(formatDuration(7.31)).toBe('7.3 s');
    expect(formatDuration(75)).toBe('1m 15s');
    expect(formatDuration(null)).toBe('—');
  });

  it('formats numbers with thousand commas', () => {
    expect(formatNumber(11961)).toBe('11,961');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(null)).toBe('0');
  });

  it('handles valid and invalid dates safely', () => {
    expect(formatDate(null)).toBe('—');
    const formatted = formatDate('2024-06-15T12:00:00Z');
    expect(formatted).toContain('2024');
  });
});
