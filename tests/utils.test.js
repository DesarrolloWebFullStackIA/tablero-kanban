import { describe, it, expect, vi } from 'vitest';
import { escapeHtml, formatDate, formatCommentDate, isTaskOverdue } from '../src/js/ui.js';
import { debounce } from '../src/js/utils.js';

describe('UI & Date Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML tags to prevent XSS attacks', () => {
      const malicious = '<script>alert("xss")</script>';
      expect(escapeHtml(malicious)).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should escape ampersands and quotes properly', () => {
      expect(escapeHtml('Tom & "Jerry"\'s')).toBe('Tom &amp; &quot;Jerry&quot;&#39;s');
    });

    it('should return an empty string when null or undefined is passed', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format a YYYY-MM-DD date into a localized string', () => {
      const formatted = formatDate('2026-09-15');
      // Spanish output format will contain '15' and 'sept'
      expect(formatted).toContain('15');
      expect(formatted.toLowerCase()).toContain('sept');
      expect(formatted).toContain('2026');
    });

    it('should return fallback text when date is empty or null', () => {
      expect(formatDate('')).toBe('Sin fecha');
      expect(formatDate(null)).toBe('Sin fecha');
    });
  });

  describe('formatCommentDate', () => {
    it('should format an ISO date string into day and month', () => {
      const formatted = formatCommentDate('2026-09-08T10:30:00Z');
      expect(formatted).toContain('08');
      expect(formatted.toLowerCase()).toContain('sept');
    });

    it('should return empty string when date is empty', () => {
      expect(formatCommentDate('')).toBe('');
      expect(formatCommentDate(null)).toBe('');
    });
  });

  describe('isTaskOverdue', () => {
    it('should return true if due date is in the past and task is not done', () => {
      expect(isTaskOverdue('2020-01-01', 'todo')).toBe(true);
      expect(isTaskOverdue('2020-01-01', 'doing')).toBe(true);
    });

    it('should return false if task is already completed (status === done)', () => {
      expect(isTaskOverdue('2020-01-01', 'done')).toBe(false);
    });

    it('should return false if due date is in the future', () => {
      expect(isTaskOverdue('2099-12-31', 'todo')).toBe(false);
      expect(isTaskOverdue('2099-12-31', 'doing')).toBe(false);
    });

    it('should return false if due date is missing', () => {
      expect(isTaskOverdue('', 'todo')).toBe(false);
      expect(isTaskOverdue(null, 'todo')).toBe(false);
    });
  });
});

describe('Async & Debounce Utility', () => {
  it('should debounce rapid function calls and execute only the last one', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debouncedFn = debounce(spy, 200);

    debouncedFn('call 1');
    debouncedFn('call 2');
    debouncedFn('call 3');

    expect(spy).not.toHaveBeenCalled();

    // Fast-forward 199ms
    vi.advanceTimersByTime(199);
    expect(spy).not.toHaveBeenCalled();

    // Fast-forward past delay
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('call 3');

    vi.useRealTimers();
  });
});
