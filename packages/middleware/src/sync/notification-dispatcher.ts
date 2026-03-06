/**
 * Notification Dispatcher (Section 8 - Sync Pipeline)
 *
 * Sends notifications to users based on sync events.
 * Matches events against rules, determines target audience, and dispatches via WhatsApp.
 */

import type { TableName, WebhookEventType } from './webhook-handler';

/**
 * Notification rule that determines when/how to notify
 */
export interface NotificationRule {
  table: TableName;
  event: WebhookEventType;
  condition?: (data: Record<string, unknown>) => boolean;
  templateFn: (data: Record<string, unknown>) => string;
  targetAudience: 'city_based' | 'all_users' | 'specific_user';
}

/**
 * Result of notification dispatch operation
 */
export interface NotificationResult {
  success: boolean;
  notifications_sent: number;
  notifications_failed: number;
  errors?: string[];
}

/**
 * Logger interface
 */
export interface Logger {
  info: (msg: string, ...args: any[]) => void;
  warn: (msg: string, ...args: any[]) => void;
  error: (msg: string, ...args: any[]) => void;
  debug: (msg: string, ...args: any[]) => void;
}

/**
 * User repository interface
 */
export interface UserRepository {
  findByCity: (city: string) => Promise<any[]>;
  findById: (id: string) => Promise<any>;
}

/**
 * WhatsApp client interface
 */
export interface WhatsAppClient {
  sendMessage: (to: string, body: string) => Promise<any>;
}

/**
 * Dependencies for NotificationDispatcher
 */
export interface NotificationDispatcherDeps {
  userRepository: UserRepository;
  whatsappClient: WhatsAppClient;
  logger?: Logger;
}

/**
 * Dispatches notifications to users based on sync events
 */
export class NotificationDispatcher {
  private readonly userRepository: UserRepository;
  private readonly whatsappClient: WhatsAppClient;
  private readonly logger: Logger;
  private rules: NotificationRule[];

  constructor(deps: NotificationDispatcherDeps, rules?: NotificationRule[]) {
    this.userRepository = deps.userRepository;
    this.whatsappClient = deps.whatsappClient;
    this.logger = deps.logger || {
      info: (msg: string) => console.log('[NotificationDispatcher]', msg),
      warn: (msg: string) => console.warn('[NotificationDispatcher]', msg),
      error: (msg: string) => console.error('[NotificationDispatcher]', msg),
      debug: (msg: string) => console.debug('[NotificationDispatcher]', msg),
    };

    this.rules = rules || this.getDefaultRules();
  }

  /**
   * Dispatch notifications for a sync event
   * - Match event against notification rules
   * - Determine target audience
   * - Send via WhatsApp for users with preferred_channel 'whatsapp' or 'both'
   *
   * @param event - Event type (created, updated, deleted)
   * @param table - Table name
   * @param data - Record data
   * @returns NotificationResult with sent/failed counts
   */
  async dispatch(
    event: WebhookEventType,
    table: TableName,
    data: Record<string, unknown>,
  ): Promise<NotificationResult> {
    this.logger.debug(`Dispatching notifications for ${event} on ${table}`);

    const result: NotificationResult = {
      success: true,
      notifications_sent: 0,
      notifications_failed: 0,
      errors: [],
    };

    try {
      // Find matching rules
      const matchingRules = this.rules.filter(
        (rule) => rule.table === table && rule.event === event,
      );

      if (matchingRules.length === 0) {
        this.logger.debug(`No notification rules matched for ${event} on ${table}`);
        return result;
      }

      // Process each matching rule
      for (const rule of matchingRules) {
        try {
          // Check condition if present
          if (rule.condition && !rule.condition(data)) {
            this.logger.debug(`Condition failed for rule: ${table}/${event}`);
            continue;
          }

          // Generate message from template
          const message = rule.templateFn(data);

          // Determine target audience
          let targetUsers: any[] = [];

          if (rule.targetAudience === 'city_based') {
            const city = (data.city as string) || (data.location as string);
            if (city) {
              targetUsers = await this.userRepository.findByCity(city);
              this.logger.debug(`Found ${targetUsers.length} users in city: ${city}`);
            }
          } else if (rule.targetAudience === 'all_users') {
            // In real implementation, would paginate through all users
            // For now, log intent to dispatch to all
            this.logger.debug(`Dispatching to all users for ${table}/${event}`);
            // targetUsers would be fetched from userRepository.listAll()
          } else if (rule.targetAudience === 'specific_user') {
            const userId = data.user_id as string;
            if (userId) {
              const user = await this.userRepository.findById(userId);
              if (user) {
                targetUsers = [user];
              }
            }
          }

          // Send messages to users with WhatsApp preference
          for (const user of targetUsers) {
            try {
              // Only send if user has WhatsApp preference
              if (
                user.preferred_channel === 'whatsapp' ||
                user.preferred_channel === 'both'
              ) {
                if (!user.phone_number) {
                  this.logger.warn(`User ${user.user_id} has no phone number`);
                  continue;
                }

                await this.whatsappClient.sendMessage(user.phone_number, message);
                result.notifications_sent++;
                this.logger.debug(`Sent notification to ${user.phone_number}`);
              }
            } catch (err: any) {
              result.notifications_failed++;
              const errorMsg = err?.message || 'Unknown error';
              result.errors?.push(
                `Failed to send message to ${user.phone_number}: ${errorMsg}`,
              );
              this.logger.warn(
                `Failed to send notification to user ${user.user_id}: ${errorMsg}`,
              );
            }
          }
        } catch (err: any) {
          const errorMsg = err?.message || 'Unknown error';
          result.errors?.push(errorMsg);
          this.logger.error(`Error processing notification rule for ${table}/${event}: ${errorMsg}`);
          result.success = false;
        }
      }

      this.logger.info(`Notifications dispatched for ${table}/${event}`, {
        sent: result.notifications_sent,
        failed: result.notifications_failed,
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      result.errors?.push(errorMsg);
      result.success = false;
      this.logger.error(`Error dispatching notifications: ${errorMsg}`);
    }

    return result;
  }

  /**
   * Get default notification rules
   * - New job posted → notify users in same city who have WhatsApp
   * - New event created → notify users in same city
   * - New deal → notify users in same city
   * - Immigration news → notify all subscribed users
   */
  getDefaultRules(): NotificationRule[] {
    return [
      {
        table: 'jobs',
        event: 'record.created',
        templateFn: (data) => {
          const title = data.title || 'New Job';
          const company = data.company_name || 'Company';
          const city = data.city || 'Your area';
          const link = 'https://desiconnectusa.com/jobs';
          return `💼 *New Job Posted*\n\n*${title}* at ${company}\n📍 ${city}\n\n🔗 View details: ${link}`;
        },
        targetAudience: 'city_based',
      },

      {
        table: 'deals',
        event: 'record.created',
        templateFn: (data) => {
          const title = data.title || 'New Deal';
          const discount = data.discount_percentage || data.discount || 'Special offer';
          const link = 'https://desiconnectusa.com/deals';
          return `🏷️ *New Deal*\n\n*${title}*\n💰 ${discount} off\n\n🔗 Check it out: ${link}`;
        },
        targetAudience: 'city_based',
      },

      {
        table: 'events',
        event: 'record.created',
        templateFn: (data) => {
          const title = data.title || 'New Event';
          const date = data.starts_at ? new Date(data.starts_at as string).toLocaleDateString() : 'Soon';
          const city = data.city || 'Your area';
          const link = 'https://desiconnectusa.com/events';
          return `📅 *New Event*\n\n*${title}*\n📍 ${city}\n📅 ${date}\n\n🔗 Learn more: ${link}`;
        },
        targetAudience: 'city_based',
      },

      {
        table: 'news',
        event: 'record.created',
        condition: (data) => {
          // Only notify if tagged with immigration
          const tags = (data.tags as string[]) || [];
          return tags.includes('immigration') || tags.includes('visa');
        },
        templateFn: (data) => {
          const title = data.title || 'News Update';
          const summary = data.summary || data.description || '';
          const link = 'https://desiconnectusa.com/news';
          return `🇺🇸 *Immigration News*\n\n*${title}*\n\n${String(summary).substring(0, 150)}...\n\n🔗 Read full story: ${link}`;
        },
        targetAudience: 'all_users',
      },

      {
        table: 'businesses',
        event: 'record.created',
        templateFn: (data) => {
          const name = data.name || 'New Business';
          const category = data.category || 'Service';
          const city = data.city || 'Your area';
          const link = 'https://desiconnectusa.com/businesses';
          return `🏪 *New Business Listed*\n\n*${name}* (${category})\n📍 ${city}\n\n🔗 Visit profile: ${link}`;
        },
        targetAudience: 'city_based',
      },
    ];
  }
}
