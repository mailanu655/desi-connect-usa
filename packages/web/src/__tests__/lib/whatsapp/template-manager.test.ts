/**
 * Jest Test Suite for WhatsApp Template Manager
 *
 * Comprehensive tests for template management, rendering, classification,
 * cost estimation, and compliance validation.
 */

import type { TemplateType, MessageClassification } from '@desi-connect/shared';
import {
  getTemplate,
  renderTemplate,
  classifyMessage,
  validateTemplate,
  getAllTemplates,
  estimateTemplateCost,
  estimateBulkTemplateCost,
  getComplianceInfo,
  canSendMessage,
} from '@/lib/whatsapp/template-manager';

describe('WhatsApp Template Manager', () => {
  describe('getTemplate()', () => {
    it('should return template for welcome type', () => {
      const template = getTemplate('welcome');
      expect(template).toBeDefined();
      expect(template.template_type).toBe('welcome');
      expect(template.template_sid).toBe('welcome_msg_123');
      expect(template.content_variables).toHaveProperty('user_name');
      expect(template.content_variables).toHaveProperty('feature_list');
    });

    it('should return template for daily_digest type', () => {
      const template = getTemplate('daily_digest');
      expect(template).toBeDefined();
      expect(template.template_type).toBe('daily_digest');
      expect(template.template_sid).toBe('daily_digest_123');
      expect(template.content_variables).toHaveProperty('date');
      expect(template.content_variables).toHaveProperty('news_count');
      expect(template.content_variables).toHaveProperty('deals_count');
      expect(template.content_variables).toHaveProperty('jobs_count');
    });

    it('should return template for immigration_alert type', () => {
      const template = getTemplate('immigration_alert');
      expect(template).toBeDefined();
      expect(template.template_type).toBe('immigration_alert');
      expect(template.template_sid).toBe('immigration_alert_123');
      expect(template.content_variables).toHaveProperty('visa_type');
      expect(template.content_variables).toHaveProperty('priority_date');
      expect(template.content_variables).toHaveProperty('action_needed');
    });

    it('should return template for deal_notification type', () => {
      const template = getTemplate('deal_notification');
      expect(template).toBeDefined();
      expect(template.template_type).toBe('deal_notification');
      expect(template.template_sid).toBe('deal_notification_123');
      expect(template.content_variables).toHaveProperty('business_name');
      expect(template.content_variables).toHaveProperty('discount_percent');
      expect(template.content_variables).toHaveProperty('expiry_date');
    });

    it('should return template for event_reminder type', () => {
      const template = getTemplate('event_reminder');
      expect(template).toBeDefined();
      expect(template.template_type).toBe('event_reminder');
      expect(template.template_sid).toBe('event_reminder_123');
      expect(template.content_variables).toHaveProperty('event_name');
      expect(template.content_variables).toHaveProperty('event_date');
      expect(template.content_variables).toHaveProperty('event_time');
      expect(template.content_variables).toHaveProperty('event_location');
    });

    it('should throw error for invalid template type', () => {
      expect(() => {
        getTemplate('invalid_type' as TemplateType);
      }).toThrow('Template not found for type: invalid_type');
    });
  });

  describe('renderTemplate()', () => {
    it('should replace single variable in template', () => {
      const template = getTemplate('welcome');
      const result = renderTemplate(template, { user_name: 'John Doe' });
      expect(result).toContain('John Doe');
      expect(result).not.toContain('{{user_name}}');
    });

    it('should replace multiple variables in template', () => {
      const template = getTemplate('event_reminder');
      const result = renderTemplate(template, {
        event_name: 'Holi Celebration',
        event_date: '2026-03-15',
        event_time: '7:00 PM',
        event_location: 'Central Park',
      });
      expect(result).toContain('Holi Celebration');
      expect(result).toContain('2026-03-15');
      expect(result).toContain('7:00 PM');
      expect(result).toContain('Central Park');
      expect(result).not.toContain('{{event_name}}');
      expect(result).not.toContain('{{event_date}}');
    });

    it('should handle deal_notification template variables', () => {
      const template = getTemplate('deal_notification');
      const result = renderTemplate(template, {
        discount_percent: '50',
        business_name: 'Taj Sweets',
        expiry_date: '2026-03-10',
      });
      expect(result).toContain('50%');
      expect(result).toContain('Taj Sweets');
      expect(result).toContain('2026-03-10');
    });

    it('should handle daily_digest template variables', () => {
      const template = getTemplate('daily_digest');
      const result = renderTemplate(template, {
        date: '2026-03-04',
        news_count: '5',
        deals_count: '8',
        jobs_count: '12',
      });
      expect(result).toContain('2026-03-04');
      expect(result).toContain('5');
      expect(result).toContain('8');
      expect(result).toContain('12');
    });

    it('should handle immigration_alert template variables', () => {
      const template = getTemplate('immigration_alert');
      const result = renderTemplate(template, {
        visa_type: 'H-1B',
        priority_date: '2024-06-01',
        action_needed: 'true',
      });
      expect(result).toContain('H-1B');
      expect(result).toContain('2024-06-01');
      expect(result).toContain('true');
    });

    it('should replace multiple occurrences of same variable', () => {
      const template = getTemplate('welcome');
      const result = renderTemplate(template, { user_name: 'Jane' });
      expect(result.includes('Jane')).toBe(true);
    });

    it('should handle empty variable values', () => {
      const template = getTemplate('event_reminder');
      const result = renderTemplate(template, {
        event_name: '',
        event_date: '',
        event_time: '',
        event_location: '',
      });
      expect(result).toBeDefined();
      expect(result).not.toContain('{{event_name}}');
    });
  });

  describe('classifyMessage()', () => {
    it('should classify welcome template as authentication', () => {
      const result = classifyMessage('welcome', true);
      expect(result.classification).toBe('authentication');
      expect(result.template_type).toBe('welcome');
      expect(result.is_within_session_window).toBe(true);
    });

    it('should classify immigration_alert template as authentication', () => {
      const result = classifyMessage('immigration_alert', false);
      expect(result.classification).toBe('authentication');
      expect(result.template_type).toBe('immigration_alert');
    });

    it('should classify deal_notification template as marketing', () => {
      const result = classifyMessage('deal_notification', true);
      expect(result.classification).toBe('marketing');
      expect(result.template_type).toBe('deal_notification');
    });

    it('should classify event_reminder template as marketing', () => {
      const result = classifyMessage('event_reminder', true);
      expect(result.classification).toBe('marketing');
      expect(result.template_type).toBe('event_reminder');
    });

    it('should classify daily_digest template as marketing', () => {
      const result = classifyMessage('daily_digest', true);
      expect(result.classification).toBe('marketing');
      expect(result.template_type).toBe('daily_digest');
    });

    it('should classify null templateType as utility', () => {
      const result = classifyMessage(null, false);
      expect(result.classification).toBe('utility');
      expect(result.template_type).toBeNull();
    });

    it('should set correct cost for authentication messages', () => {
      const result = classifyMessage('welcome', true);
      expect(result.estimated_cost_usd).toBe(0.0043);
    });

    it('should set correct cost for marketing messages', () => {
      const result = classifyMessage('deal_notification', true);
      expect(result.estimated_cost_usd).toBe(0.0066);
    });

    it('should set correct cost for utility messages', () => {
      const result = classifyMessage(null, false);
      expect(result.estimated_cost_usd).toBe(0.0043);
    });

    it('should allow marketing with template outside session', () => {
      const result = classifyMessage('deal_notification', false);
      expect(result.classification).toBe('marketing');
      expect(result.is_within_session_window).toBe(false);
    });

    it('should include session window flag in response', () => {
      const result1 = classifyMessage('welcome', true);
      expect(result1.is_within_session_window).toBe(true);

      const result2 = classifyMessage('welcome', false);
      expect(result2.is_within_session_window).toBe(false);
    });
  });

  describe('validateTemplate()', () => {
    it('should return true for valid welcome template', () => {
      expect(validateTemplate('welcome')).toBe(true);
    });

    it('should return true for valid daily_digest template', () => {
      expect(validateTemplate('daily_digest')).toBe(true);
    });

    it('should return true for valid immigration_alert template', () => {
      expect(validateTemplate('immigration_alert')).toBe(true);
    });

    it('should return true for valid deal_notification template', () => {
      expect(validateTemplate('deal_notification')).toBe(true);
    });

    it('should return true for valid event_reminder template', () => {
      expect(validateTemplate('event_reminder')).toBe(true);
    });

    it('should return false for invalid template type', () => {
      expect(validateTemplate('invalid_type' as TemplateType)).toBe(false);
    });

    it('should validate all template types', () => {
      const validTypes: TemplateType[] = [
        'welcome',
        'daily_digest',
        'immigration_alert',
        'deal_notification',
        'event_reminder',
      ];

      validTypes.forEach((type) => {
        expect(validateTemplate(type)).toBe(true);
      });
    });
  });

  describe('getAllTemplates()', () => {
    it('should return array of all template types', () => {
      const templates = getAllTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(5);
    });

    it('should include welcome template', () => {
      const templates = getAllTemplates();
      expect(templates).toContain('welcome');
    });

    it('should include daily_digest template', () => {
      const templates = getAllTemplates();
      expect(templates).toContain('daily_digest');
    });

    it('should include immigration_alert template', () => {
      const templates = getAllTemplates();
      expect(templates).toContain('immigration_alert');
    });

    it('should include deal_notification template', () => {
      const templates = getAllTemplates();
      expect(templates).toContain('deal_notification');
    });

    it('should include event_reminder template', () => {
      const templates = getAllTemplates();
      expect(templates).toContain('event_reminder');
    });

    it('should return all 5 template types', () => {
      const templates = getAllTemplates();
      const expectedTypes = new Set<TemplateType>([
        'welcome',
        'daily_digest',
        'immigration_alert',
        'deal_notification',
        'event_reminder',
      ]);
      const actualTypes = new Set(templates);
      expect(actualTypes).toEqual(expectedTypes);
    });
  });

  describe('estimateTemplateCost()', () => {
    it('should estimate cost for utility template', () => {
      const cost = estimateTemplateCost('welcome', false);
      expect(cost).toBe(0.0043);
    });

    it('should estimate cost for authentication template', () => {
      const cost = estimateTemplateCost('immigration_alert', true);
      expect(cost).toBe(0.0043);
    });

    it('should estimate cost for marketing template', () => {
      const cost = estimateTemplateCost('deal_notification', true);
      expect(cost).toBe(0.0066);
    });

    it('should estimate cost for daily_digest (marketing)', () => {
      const cost = estimateTemplateCost('daily_digest', true);
      expect(cost).toBe(0.0066);
    });

    it('should estimate cost for event_reminder (marketing)', () => {
      const cost = estimateTemplateCost('event_reminder', true);
      expect(cost).toBe(0.0066);
    });

    it('should return same cost regardless of session window for authentication', () => {
      const cost1 = estimateTemplateCost('welcome', true);
      const cost2 = estimateTemplateCost('welcome', false);
      expect(cost1).toBe(cost2);
      expect(cost1).toBe(0.0043);
    });

    it('should return same cost regardless of session window for utility', () => {
      const cost1 = estimateTemplateCost('immigration_alert', true);
      const cost2 = estimateTemplateCost('immigration_alert', false);
      expect(cost1).toBe(cost2);
    });
  });

  describe('estimateBulkTemplateCost()', () => {
    it('should calculate bulk cost for single recipient', () => {
      const cost = estimateBulkTemplateCost('welcome', 1, true);
      expect(cost).toBe(0.0043);
    });

    it('should calculate bulk cost for 100 recipients', () => {
      const cost = estimateBulkTemplateCost('welcome', 100, true);
      expect(cost).toBe(0.0043 * 100);
      expect(cost).toBe(0.43);
    });

    it('should calculate bulk cost for 1000 recipients with marketing template', () => {
      const cost = estimateBulkTemplateCost('deal_notification', 1000, true);
      expect(cost).toBe(0.0066 * 1000);
      expect(cost).toBe(6.6);
    });

    it('should calculate bulk cost for 50 recipients with authentication template', () => {
      const cost = estimateBulkTemplateCost('immigration_alert', 50, false);
      expect(cost).toBe(0.0043 * 50);
      expect(cost).toBe(0.215);
    });

    it('should calculate bulk cost for marketing template', () => {
      const cost = estimateBulkTemplateCost('event_reminder', 200, true);
      expect(cost).toBe(0.0066 * 200);
      expect(cost).toBeCloseTo(1.32, 5);
    });

    it('should calculate bulk cost accurately with decimals', () => {
      const cost = estimateBulkTemplateCost('daily_digest', 77, true);
      expect(cost).toBeCloseTo(0.5082, 4);
    });

    it('should handle zero recipients', () => {
      const cost = estimateBulkTemplateCost('welcome', 0, true);
      expect(cost).toBe(0);
    });

    it('should scale linearly with recipient count', () => {
      const cost10 = estimateBulkTemplateCost('welcome', 10, true);
      const cost20 = estimateBulkTemplateCost('welcome', 20, true);
      expect(cost20).toBe(cost10 * 2);
    });
  });

  describe('getComplianceInfo()', () => {
    it('should return compliance info for utility classification', () => {
      const info = getComplianceInfo('utility');
      expect(info.requiresTemplate).toBe(false);
      expect(info.sessionWindowRequired).toBe(false);
      expect(info.costPerMessage).toBe(0.0043);
      expect(info.description).toBe('Account/transactional messages');
    });

    it('should return compliance info for marketing classification', () => {
      const info = getComplianceInfo('marketing');
      expect(info.requiresTemplate).toBe(true);
      expect(info.sessionWindowRequired).toBe(true);
      expect(info.costPerMessage).toBe(0.0066);
      expect(info.description).toBe('Promotional/marketing messages');
    });

    it('should return compliance info for authentication classification', () => {
      const info = getComplianceInfo('authentication');
      expect(info.requiresTemplate).toBe(false);
      expect(info.sessionWindowRequired).toBe(false);
      expect(info.costPerMessage).toBe(0.0043);
      expect(info.description).toBe('Authentication/security messages');
    });

    it('should indicate utility does not require template', () => {
      const info = getComplianceInfo('utility');
      expect(info.requiresTemplate).toBeFalsy();
    });

    it('should indicate marketing requires template', () => {
      const info = getComplianceInfo('marketing');
      expect(info.requiresTemplate).toBeTruthy();
    });

    it('should indicate authentication does not require session window', () => {
      const info = getComplianceInfo('authentication');
      expect(info.sessionWindowRequired).toBeFalsy();
    });

    it('should indicate marketing requires session window', () => {
      const info = getComplianceInfo('marketing');
      expect(info.sessionWindowRequired).toBeTruthy();
    });

    it('should return all required fields', () => {
      const info = getComplianceInfo('utility');
      expect(info).toHaveProperty('requiresTemplate');
      expect(info).toHaveProperty('sessionWindowRequired');
      expect(info).toHaveProperty('costPerMessage');
      expect(info).toHaveProperty('description');
    });
  });

  describe('canSendMessage()', () => {
    it('should allow utility message within session window', () => {
      const canSend = canSendMessage('utility', false, true);
      expect(canSend).toBe(true);
    });

    it('should allow utility message outside session window', () => {
      const canSend = canSendMessage('utility', false, false);
      expect(canSend).toBe(true);
    });

    it('should allow utility message without template', () => {
      const canSend = canSendMessage('utility', false, true);
      expect(canSend).toBe(true);
    });

    it('should allow authentication message within session window', () => {
      const canSend = canSendMessage('authentication', false, true);
      expect(canSend).toBe(true);
    });

    it('should allow authentication message outside session window', () => {
      const canSend = canSendMessage('authentication', false, false);
      expect(canSend).toBe(true);
    });

    it('should allow marketing message within session window without template', () => {
      const canSend = canSendMessage('marketing', false, true);
      expect(canSend).toBe(true);
    });

    it('should allow marketing message outside session window with template', () => {
      const canSend = canSendMessage('marketing', true, false);
      expect(canSend).toBe(true);
    });

    it('should not allow marketing message outside session window without template', () => {
      const canSend = canSendMessage('marketing', false, false);
      expect(canSend).toBe(false);
    });

    it('should allow marketing message with template within session window', () => {
      const canSend = canSendMessage('marketing', true, true);
      expect(canSend).toBe(true);
    });

    it('should enforce template requirement for marketing outside session', () => {
      const withTemplate = canSendMessage('marketing', true, false);
      const withoutTemplate = canSendMessage('marketing', false, false);
      expect(withTemplate).toBe(true);
      expect(withoutTemplate).toBe(false);
    });

    it('should not enforce template requirement for utility messages', () => {
      const withTemplate = canSendMessage('utility', true, false);
      const withoutTemplate = canSendMessage('utility', false, false);
      expect(withTemplate).toBe(true);
      expect(withoutTemplate).toBe(true);
    });

    it('should not enforce template requirement for authentication messages', () => {
      const withTemplate = canSendMessage('authentication', true, false);
      const withoutTemplate = canSendMessage('authentication', false, false);
      expect(withTemplate).toBe(true);
      expect(withoutTemplate).toBe(true);
    });

    it('should handle all classification types', () => {
      const classifications: MessageClassification[] = [
        'utility',
        'marketing',
        'authentication',
      ];
      classifications.forEach((classification) => {
        const result = canSendMessage(classification, true, true);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should retrieve, validate, render, and estimate cost for welcome template', () => {
      const template = getTemplate('welcome');
      expect(template).toBeDefined();

      expect(validateTemplate('welcome')).toBe(true);

      const rendered = renderTemplate(template, { user_name: 'Alice', feature_list: 'everything' });
      expect(rendered).toContain('Alice');

      const cost = estimateTemplateCost('welcome', true);
      expect(cost).toBe(0.0043);

      const compliance = getComplianceInfo('authentication');
      expect(compliance.requiresTemplate).toBe(false);
    });

    it('should handle complete deal notification workflow', () => {
      const template = getTemplate('deal_notification');

      const rendered = renderTemplate(template, {
        discount_percent: '35',
        business_name: 'Indian Grocery Store',
        expiry_date: '2026-03-15',
      });
      expect(rendered).toContain('35%');
      expect(rendered).toContain('Indian Grocery Store');

      const classified = classifyMessage('deal_notification', true);
      expect(classified.classification).toBe('marketing');
      expect(classified.estimated_cost_usd).toBe(0.0066);

      expect(canSendMessage('marketing', true, true)).toBe(true);

      const bulkCost = estimateBulkTemplateCost('deal_notification', 500, true);
      expect(bulkCost).toBeCloseTo(3.3, 1);
    });

    it('should handle bulk immigration alert campaign', () => {
      const template = getTemplate('immigration_alert');
      expect(validateTemplate('immigration_alert')).toBe(true);

      const rendered = renderTemplate(template, {
        visa_type: 'EB-3',
        priority_date: '2025-03-01',
        action_needed: 'false',
      });
      expect(rendered).toContain('EB-3');

      const classified = classifyMessage('immigration_alert', false);
      expect(classified.classification).toBe('authentication');

      const bulkCost = estimateBulkTemplateCost('immigration_alert', 1000, false);
      expect(bulkCost).toBe(4.3);
    });

    it('should verify all templates are accessible and valid', () => {
      const allTemplates = getAllTemplates();

      allTemplates.forEach((templateType) => {
        const template = getTemplate(templateType);
        expect(template).toBeDefined();
        expect(template.template_type).toBe(templateType);
        expect(template.template_sid).toBeTruthy();

        expect(validateTemplate(templateType)).toBe(true);

        const classified = classifyMessage(templateType, true);
        expect(classified.template_type).toBe(templateType);
        expect(['utility', 'marketing', 'authentication']).toContain(
          classified.classification
        );
      });
    });

    it('should estimate costs for all template types', () => {
      const allTemplates = getAllTemplates();
      const costs: Record<TemplateType, number> = {} as Record<TemplateType, number>;

      allTemplates.forEach((templateType) => {
        const cost = estimateTemplateCost(templateType, true);
        costs[templateType] = cost;
        expect([0.0043, 0.0066]).toContain(cost);
      });

      expect(Object.keys(costs).length).toBe(5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle template rendering with special characters', () => {
      const template = getTemplate('event_reminder');
      const rendered = renderTemplate(template, {
        event_name: 'Diwali 2026 - "Best Celebration"',
        event_date: '2026-11-08',
        event_time: '6:00 PM - 10:00 PM',
        event_location: 'NYC Central Park & Surroundings',
      });
      expect(rendered).toContain('Diwali 2026');
      expect(rendered).toContain('Best Celebration');
    });

    it('should handle template rendering with numeric strings', () => {
      const template = getTemplate('daily_digest');
      const rendered = renderTemplate(template, {
        date: '2026-03-04',
        news_count: '999',
        deals_count: '1000',
        jobs_count: '5000',
      });
      expect(rendered).toContain('999');
      expect(rendered).toContain('1000');
      expect(rendered).toContain('5000');
    });

    it('should maintain template integrity after rendering', () => {
      const template = getTemplate('welcome');
      const originalTemplate = { ...template };

      renderTemplate(template, { user_name: 'Test' });

      expect(template).toEqual(originalTemplate);
    });

    it('should handle cost estimation with large recipient counts', () => {
      const cost = estimateBulkTemplateCost('welcome', 1000000, true);
      expect(cost).toBe(0.0043 * 1000000);
      expect(cost).toBe(4300);
    });

    it('should classify null template as utility', () => {
      const classified = classifyMessage(null, false);
      expect(classified.classification).toBe('utility');
      expect(classified.template_type).toBeNull();
    });

    it('should validate template idempotently', () => {
      const result1 = validateTemplate('welcome');
      const result2 = validateTemplate('welcome');
      expect(result1).toBe(result2);
    });
  });

  describe('Compliance Verification', () => {
    it('should enforce Meta 2026 compliance for marketing messages', () => {
      const classified = classifyMessage('deal_notification', false);
      expect(classified.classification).toBe('marketing');
      expect(classified.is_within_session_window).toBe(false);

      expect(canSendMessage('marketing', true, false)).toBe(true);
      expect(canSendMessage('marketing', false, false)).toBe(false);
    });

    it('should allow authentication messages without session window restriction', () => {
      const classified = classifyMessage('welcome', false);
      expect(classified.classification).toBe('authentication');

      expect(canSendMessage('authentication', false, false)).toBe(true);
    });

    it('should allow utility messages without template', () => {
      const classified = classifyMessage(null, false);
      expect(classified.classification).toBe('utility');

      expect(canSendMessage('utility', false, false)).toBe(true);
      expect(getComplianceInfo('utility').requiresTemplate).toBe(false);
    });

    it('should charge appropriate costs based on classification', () => {
      const utilityInfo = getComplianceInfo('utility');
      const marketingInfo = getComplianceInfo('marketing');
      const authInfo = getComplianceInfo('authentication');

      expect(utilityInfo.costPerMessage).toBe(0.0043);
      expect(marketingInfo.costPerMessage).toBe(0.0066);
      expect(authInfo.costPerMessage).toBe(0.0043);

      expect(marketingInfo.costPerMessage).toBeGreaterThan(utilityInfo.costPerMessage);
    });
  });
});
