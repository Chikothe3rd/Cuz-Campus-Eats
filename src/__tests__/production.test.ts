import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEnvironment, validateEmail, validatePhone, sanitizeInput, features } from '@/lib/production';

describe('Production Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('user@university.edu')).toBe(true);
      expect(validateEmail('test.user@example.com')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@university.edu')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('validates phone numbers', () => {
      expect(validatePhone('555-0100')).toBe(true);
      expect(validatePhone('(555) 010-0100')).toBe(true);
      expect(validatePhone('+1 555 010 0100')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('removes dangerous characters', () => {
      expect(sanitizeInput('Hello<script>alert("xss")</script>')).toBe('Helloscriptalert("xss")/script');
      expect(sanitizeInput('  normal text  ')).toBe('normal text');
    });
  });

  describe('features', () => {
    it('defines feature flags', () => {
      expect(features.maxOrderItems).toBeGreaterThan(0);
      expect(features.minOrderAmount).toBeGreaterThan(0);
      expect(typeof features.enableRealtimeUpdates).toBe('boolean');
    });
  });
});
