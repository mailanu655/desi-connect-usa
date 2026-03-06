/**
 * Tests for NotificationDispatcher
 *
 * Tests cover:
 * - Notification sending via WhatsApp
 * - Target audience determination (city-based, all users, specific user)
 * - Message template rendering
 * - Rule matching
 * - User filtering by WhatsApp preference
 * - Error handling
 */

import {
  NotificationDispatcher,
  NotificationRule,
  UserRepository,
  WhatsAppClient,
  Logger,
} from '../../src/sync/notification-dispatcher';

describe('NotificationDispatcher', () => {
  let dispatcher: NotificationDispatcher;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let whatsappClientMock: jest.Mocked<WhatsAppClient>;
  let loggerMock: jest.Mocked<Logger>;

  const mockUsers = [
    {
      user_id: 'user1',
      phone_number: '+14155552671',
      preferred_channel: 'whatsapp',
      city: 'San Francisco',
    },
    {
      user_id: 'user2',
      phone_number: '+14155552672',
      preferred_channel: 'both',
      city: 'San Francisco',
    },
    {
      user_id: 'user3',
      phone_number: '+14155552673',
      preferred_channel: 'email',
      city: 'San Francisco',
    },
  ];

  beforeEach(() => {
    userRepositoryMock = {
      findByCity: jest.fn().mockResolvedValue(mockUsers),
      findById: jest.fn().mockResolvedValue(mockUsers[0]),
    };

    whatsappClientMock = {
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    dispatcher = new NotificationDispatcher(
      {
        userRepository: userRepositoryMock,
        whatsappClient: whatsappClientMock,
        logger: loggerMock,
      },
      undefined,
    );
  });

  describe('dispatch', () => {
    it('should dispatch WhatsApp notification for new job', async () => {
      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(result.notifications_sent).toBeGreaterThan(0);
      expect(whatsappClientMock.sendMessage).toHaveBeenCalled();
    });

    it('should dispatch notification for new event', async () => {
      const result = await dispatcher.dispatch('record.created', 'events', {
        title: 'Community Meetup',
        city: 'San Francisco',
        starts_at: new Date().toISOString(),
      });

      expect(result.notifications_sent).toBeGreaterThan(0);
      expect(whatsappClientMock.sendMessage).toHaveBeenCalled();
    });

    it('should dispatch notification for new deal', async () => {
      const result = await dispatcher.dispatch('record.created', 'deals', {
        title: 'Restaurant Discount',
        discount_percentage: 20,
        city: 'San Francisco',
      });

      expect(result.notifications_sent).toBeGreaterThan(0);
      expect(whatsappClientMock.sendMessage).toHaveBeenCalled();
    });

    it('should target users in matching city', async () => {
      await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(userRepositoryMock.findByCity).toHaveBeenCalledWith('San Francisco');
    });

    it('should skip users without WhatsApp preference', async () => {
      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      // Should only send to users with 'whatsapp' or 'both' preference
      // Not to user3 who has 'email' preference
      expect(result.notifications_sent).toBe(2); // user1 and user2
    });

    it('should use correct message template', async () => {
      await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      const callArgs = whatsappClientMock.sendMessage.mock.calls[0];
      const message = callArgs[1];

      // Should contain job details
      expect(message).toContain('Software Engineer');
      expect(message).toContain('Tech Corp');
      expect(message).toMatch(/New Job|💼/);
    });

    it('should handle no matching rules gracefully', async () => {
      const customDispatcher = new NotificationDispatcher(
        {
          userRepository: userRepositoryMock,
          whatsappClient: whatsappClientMock,
          logger: loggerMock,
        },
        [], // Empty rules
      );

      const result = await customDispatcher.dispatch('record.created', 'jobs', {
        title: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.notifications_sent).toBe(0);
      expect(whatsappClientMock.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle empty user list gracefully', async () => {
      userRepositoryMock.findByCity.mockResolvedValueOnce([]);

      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(result.success).toBe(true);
      expect(result.notifications_sent).toBe(0);
    });

    it('should count sent vs failed notifications', async () => {
      whatsappClientMock.sendMessage
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Send failed'))
        .mockResolvedValueOnce({ success: true });

      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(result.notifications_sent).toBeGreaterThan(0);
      expect(result.notifications_failed).toBeGreaterThan(0);
      expect(result.notifications_sent + result.notifications_failed).toBeGreaterThan(1);
    });

    it('should handle WhatsApp send errors gracefully', async () => {
      const error = new Error('WhatsApp API error');
      whatsappClientMock.sendMessage.mockRejectedValue(error);

      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(result.notifications_failed).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e: string) => e.includes('WhatsApp'))).toBe(true);
    });

    it('should return success true when no failures', async () => {
      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(result.success).toBe(true);
    });

    it('should handle mixed success and failure', async () => {
      whatsappClientMock.sendMessage
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true });

      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      expect(result.notifications_sent).toBeGreaterThan(0);
      expect(result.notifications_failed).toBeGreaterThan(0);
    });
  });

  describe('default rules', () => {
    it('should have job notification rule', async () => {
      const rules = dispatcher.getDefaultRules();
      const jobRule = rules.find((r: any) => r.table === 'jobs');

      expect(jobRule).toBeDefined();
      expect(jobRule?.event).toBe('record.created');
      expect(jobRule?.targetAudience).toBe('city_based');
    });

    it('should have event notification rule', async () => {
      const rules = dispatcher.getDefaultRules();
      const eventRule = rules.find((r: any) => r.table === 'events');

      expect(eventRule).toBeDefined();
      expect(eventRule?.event).toBe('record.created');
      expect(eventRule?.targetAudience).toBe('city_based');
    });

    it('should have deal notification rule', async () => {
      const rules = dispatcher.getDefaultRules();
      const dealRule = rules.find((r: any) => r.table === 'deals');

      expect(dealRule).toBeDefined();
      expect(dealRule?.event).toBe('record.created');
      expect(dealRule?.targetAudience).toBe('city_based');
    });

    it('should have immigration news rule with condition', async () => {
      const rules = dispatcher.getDefaultRules();
      const newsRule = rules.find((r: any) => r.table === 'news');

      expect(newsRule).toBeDefined();
      expect(newsRule?.condition).toBeDefined();
    });

    it('should have business notification rule', async () => {
      const rules = dispatcher.getDefaultRules();
      const businessRule = rules.find((r: any) => r.table === 'businesses');

      expect(businessRule).toBeDefined();
      expect(businessRule?.targetAudience).toBe('city_based');
    });
  });

  describe('rule conditions', () => {
    it('should match immigration news with immigration tag', async () => {
      const rules = dispatcher.getDefaultRules();
      const newsRule = rules.find((r: any) => r.table === 'news');

      const data = {
        title: 'Visa Rules Changed',
        tags: ['immigration', 'policy'],
        summary: 'New visa rules announced',
      };

      if (newsRule?.condition) {
        expect(newsRule.condition(data)).toBe(true);
      }
    });

    it('should match immigration news with visa tag', async () => {
      const rules = dispatcher.getDefaultRules();
      const newsRule = rules.find((r: any) => r.table === 'news');

      const data = {
        title: 'Visa Rules Changed',
        tags: ['visa', 'policy'],
        summary: 'New visa rules announced',
      };

      if (newsRule?.condition) {
        expect(newsRule.condition(data)).toBe(true);
      }
    });

    it('should not match non-immigration news', async () => {
      const result = await dispatcher.dispatch('record.created', 'news', {
        title: 'General News',
        tags: ['general', 'local'],
        summary: 'Some general news',
      });

      expect(whatsappClientMock.sendMessage).not.toHaveBeenCalled();
      expect(result.notifications_sent).toBe(0);
    });
  });

  describe('message templates', () => {
    it('should format job message with emojis', async () => {
      await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        company_name: 'Tech Corp',
        city: 'San Francisco',
      });

      const message = whatsappClientMock.sendMessage.mock.calls[0][1];
      expect(message).toMatch(/💼|🔗/);
    });

    it('should format deal message with discount info', async () => {
      await dispatcher.dispatch('record.created', 'deals', {
        title: 'Restaurant Offer',
        discount_percentage: 25,
        city: 'San Francisco',
      });

      const message = whatsappClientMock.sendMessage.mock.calls[0][1];
      expect(message).toContain('25');
      expect(message).toMatch(/🏷️|💰/);
    });

    it('should format event message with date', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await dispatcher.dispatch('record.created', 'events', {
        title: 'Community Meetup',
        starts_at: futureDate.toISOString(),
        city: 'San Francisco',
      });

      const message = whatsappClientMock.sendMessage.mock.calls[0][1];
      expect(message).toMatch(/📅|📍/);
    });

    it('should handle missing data in templates', async () => {
      // Missing company_name
      await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Software Engineer',
        city: 'San Francisco',
      });

      const message = whatsappClientMock.sendMessage.mock.calls[0][1];
      expect(message).toContain('Software Engineer');
      expect(message).toContain('Company');
    });
  });

  describe('target audience types', () => {
    it('should support city_based audience', async () => {
      const cityBasedRule: NotificationRule = {
        table: 'jobs',
        event: 'record.created',
        templateFn: (data: any) => 'Test message',
        targetAudience: 'city_based',
      };

      const customDispatcher = new NotificationDispatcher(
        {
          userRepository: userRepositoryMock,
          whatsappClient: whatsappClientMock,
          logger: loggerMock,
        },
        [cityBasedRule],
      );

      await customDispatcher.dispatch('record.created', 'jobs', {
        city: 'San Francisco',
      });

      expect(userRepositoryMock.findByCity).toHaveBeenCalledWith('San Francisco');
    });

    it('should support all_users audience', async () => {
      const allUsersRule: NotificationRule = {
        table: 'news',
        event: 'record.created',
        templateFn: (data: any) => 'Test message',
        targetAudience: 'all_users',
      };

      const customDispatcher = new NotificationDispatcher(
        {
          userRepository: userRepositoryMock,
          whatsappClient: whatsappClientMock,
          logger: loggerMock,
        },
        [allUsersRule],
      );

      await customDispatcher.dispatch('record.created', 'news', {});

      expect(loggerMock.debug).toHaveBeenCalledWith(
        expect.stringContaining('all users'),
      );
    });

    it('should support specific_user audience', async () => {
      const specificUserRule: NotificationRule = {
        table: 'businesses',
        event: 'record.created',
        templateFn: (data: any) => 'Test message',
        targetAudience: 'specific_user',
      };

      const customDispatcher = new NotificationDispatcher(
        {
          userRepository: userRepositoryMock,
          whatsappClient: whatsappClientMock,
          logger: loggerMock,
        },
        [specificUserRule],
      );

      await customDispatcher.dispatch('record.created', 'businesses', {
        user_id: 'user1',
      });

      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user1');
    });
  });

  describe('Error scenarios', () => {
    it('should handle repository errors gracefully', async () => {
      userRepositoryMock.findByCity.mockRejectedValue(new Error('DB error'));

      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Test',
        city: 'San Francisco',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should skip users without phone numbers', async () => {
      const usersWithoutPhone = [
        { user_id: 'user1', phone_number: null, preferred_channel: 'whatsapp' },
        { user_id: 'user2', phone_number: '+14155552672', preferred_channel: 'whatsapp' },
      ];

      userRepositoryMock.findByCity.mockResolvedValueOnce(usersWithoutPhone as any);

      const result = await dispatcher.dispatch('record.created', 'jobs', {
        title: 'Test',
        city: 'San Francisco',
      });

      expect(result.notifications_sent).toBe(1);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('no phone number'),
      );
    });
  });
});
