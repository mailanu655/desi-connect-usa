/**
 * TemplateManager Tests
 *
 * Tests for Twilio template management and Meta 2026 message classification.
 * Covers: getTemplate, formatTemplateBody, classifyMessage,
 * session window logic, cost estimation.
 */

import { TemplateManager } from '@desi-connect/middleware';
import type { TemplateType, MessageClassification } from '@desi-connect/shared';

describe('TemplateManager', () => {
  let manager: TemplateManager;

  beforeEach(() => {
    manager = new TemplateManager();
  });

  // ── getTemplate ───────────────────────────────────────────

  describe('getTemplate', () => {
    it('should return a template for welcome type', () => {
      const template = manager.getTemplate('welcome', { user_name: 'Ravi' });
      expect(template).toBeDefined();
      expect(template.template_type).toBe('welcome');
      expect(template.content_variables).toEqual({ user_name: 'Ravi' });
    });

    it('should return a template for daily_digest type', () => {
      const template = manager.getTemplate('daily_digest', { date: '2026-03-01' });
      expect(template).toBeDefined();
      expect(template.template_type).toBe('daily_digest');
    });

    it('should return a template for immigration_alert type', () => {
      const template = manager.getTemplate('immigration_alert', { category: 'H-1B' });
      expect(template).toBeDefined();
      expect(template.template_type).toBe('immigration_alert');
    });

    it('should return a template for deal_notification type', () => {
      const template = manager.getTemplate('deal_notification', { deal_title: '20% off' });
      expect(template).toBeDefined();
      expect(template.template_type).toBe('deal_notification');
    });

    it('should return a template for event_reminder type', () => {
      const template = manager.getTemplate('event_reminder', { event_name: 'Holi Fest' });
      expect(template).toBeDefined();
      expect(template.template_type).toBe('event_reminder');
    });

    it('should include template_sid', () => {
      const template = manager.getTemplate('welcome', {});
      expect(template.template_sid).toBeDefined();
      expect(typeof template.template_sid).toBe('string');
    });
  });

  // ── formatTemplateBody ────────────────────────────────────

  describe('formatTemplateBody', () => {
    it('should return a formatted string for welcome template', () => {
      const body = manager.formatTemplateBody('welcome', { user_name: 'Priya' });
      expect(typeof body).toBe('string');
      expect(body.length).toBeGreaterThan(0);
    });

    it('should return a formatted string for daily_digest template', () => {
      const body = manager.formatTemplateBody('daily_digest', { date: '2026-03-01' });
      expect(typeof body).toBe('string');
      expect(body.length).toBeGreaterThan(0);
    });

    it('should return a formatted string for immigration_alert template', () => {
      const body = manager.formatTemplateBody('immigration_alert', { category: 'EB-2' });
      expect(typeof body).toBe('string');
    });

    it('should return a formatted string for deal_notification', () => {
      const body = manager.formatTemplateBody('deal_notification', { deal_title: '50% off' });
      expect(typeof body).toBe('string');
    });

    it('should return a formatted string for event_reminder', () => {
      const body = manager.formatTemplateBody('event_reminder', { event_name: 'Diwali' });
      expect(typeof body).toBe('string');
    });
  });

  // ── classifyMessage ───────────────────────────────────────

  describe('classifyMessage', () => {
    it('should classify welcome template as utility', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('welcome', now);
      expect(result.classification).toBe('utility');
    });

    it('should classify daily_digest template as marketing', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('daily_digest', now);
      expect(result.classification).toBe('marketing');
    });

    it('should classify immigration_alert as utility', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('immigration_alert', now);
      expect(result.classification).toBe('utility');
    });

    it('should classify deal_notification as marketing', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('deal_notification', now);
      expect(result.classification).toBe('marketing');
    });

    it('should classify event_reminder as utility', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('event_reminder', now);
      expect(result.classification).toBe('utility');
    });

    it('should include estimated cost in the result', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('welcome', now);
      expect(result.estimated_cost_usd).toBeDefined();
      expect(typeof result.estimated_cost_usd).toBe('number');
    });

    it('should set lower cost for utility messages', () => {
      const now = new Date().toISOString();
      const utilityResult = manager.classifyMessage('welcome', now);
      const marketingResult = manager.classifyMessage('daily_digest', now);
      expect(utilityResult.estimated_cost_usd).toBeLessThan(marketingResult.estimated_cost_usd);
    });

    it('should include template_type in result', () => {
      const now = new Date().toISOString();
      const result = manager.classifyMessage('welcome', now);
      expect(result.template_type).toBe('welcome');
    });
  });

  // ── Session Window ────────────────────────────────────────

  describe('isWithinSessionWindow', () => {
    it('should return true for recent messages (within 24h)', () => {
      const recentTime = new Date().toISOString();
      expect(manager.isWithinSessionWindow(recentTime)).toBe(true);
    });

    it('should return false for messages older than 24h', () => {
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(manager.isWithinSessionWindow(oldTime)).toBe(false);
    });

    it('should return true for messages exactly at the boundary', () => {
      const justUnder = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
      expect(manager.isWithinSessionWindow(justUnder)).toBe(true);
    });
  });

  // ── requiresTemplate ──────────────────────────────────────

  describe('requiresTemplate', () => {
    it('should not require template within session window', () => {
      const recentTime = new Date().toISOString();
      expect(manager.requiresTemplate(recentTime)).toBe(false);
    });

    it('should require template outside session window', () => {
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(manager.requiresTemplate(oldTime)).toBe(true);
    });
  });

  // ── getAvailableTemplateTypes ─────────────────────────────

  describe('getAvailableTemplateTypes', () => {
    it('should return all 5 template types', () => {
      const types = manager.getAvailableTemplateTypes();
      expect(types).toHaveLength(5);
      expect(types).toContain('welcome');
      expect(types).toContain('daily_digest');
      expect(types).toContain('immigration_alert');
      expect(types).toContain('deal_notification');
      expect(types).toContain('event_reminder');
    });
  });

  // ── getClassification ─────────────────────────────────────

  describe('getClassification', () => {
    it('should return utility for welcome template', () => {
      expect(manager.getClassification('welcome')).toBe('utility');
    });

    it('should return marketing for daily_digest template', () => {
      expect(manager.getClassification('daily_digest')).toBe('marketing');
    });

    it('should return utility for immigration_alert template', () => {
      expect(manager.getClassification('immigration_alert')).toBe('utility');
    });

    it('should return marketing for deal_notification template', () => {
      expect(manager.getClassification('deal_notification')).toBe('marketing');
    });

    it('should return utility for event_reminder template', () => {
      expect(manager.getClassification('event_reminder')).toBe('utility');
    });
  });

  // ── Custom Session Window Config ──────────────────────────

  describe('custom configuration', () => {
    it('should respect custom session window duration', () => {
      // 1 hour window
      const customManager = new TemplateManager({ sessionWindowHours: 1 });
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(customManager.isWithinSessionWindow(twoHoursAgo)).toBe(false);

      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      expect(customManager.isWithinSessionWindow(thirtyMinAgo)).toBe(true);
    });
  });
});
