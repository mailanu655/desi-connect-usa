/**
 * Flow Handler (Section 7.2 - Multi-Step Conversation Flows)
 *
 * Manages multi-step data collection flows:
 *   1. Business Submission: name → address → category → phone → hours → confirm
 *   2. Deal Submission: business → discount → expiry → terms → confirm
 *   3. Consultancy Rating: consultancy → stars → review text → confirm
 *
 * Uses SessionManager to track state between messages.
 */

import type {
  BotIntent,
  IntentClassification,
  OutgoingWhatsAppMessage,
  SessionStep,
  BusinessCategory,
} from '@desi-connect/shared';

import { SessionManager } from '../session/session-manager';
import type { Repositories } from '@desi-connect/database';

/**
 * Runtime list of valid business categories (mirrors the BusinessCategory type).
 */
const BUSINESS_CATEGORIES: readonly BusinessCategory[] = [
  'restaurant', 'grocery', 'temple', 'salon', 'clothing',
  'jewelry', 'medical', 'legal', 'tax_accounting', 'real_estate',
  'travel', 'education', 'other',
] as const;

export interface FlowHandlerConfig {
  websiteBaseUrl: string;
}

const DEFAULT_CONFIG: FlowHandlerConfig = {
  websiteBaseUrl: 'https://desiconnectusa.com',
};

export class FlowHandler {
  private readonly sessionManager: SessionManager;
  private readonly repos: Repositories;
  private readonly config: FlowHandlerConfig;

  constructor(
    sessionManager: SessionManager,
    repos: Repositories,
    config: Partial<FlowHandlerConfig> = {},
  ) {
    this.sessionManager = sessionManager;
    this.repos = repos;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start a new multi-step flow based on the classified intent.
   */
  async startFlow(
    userPhone: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    switch (classification.intent) {
      case 'submit_business':
        return this.startBusinessFlow(userPhone);
      case 'submit_deal':
        return this.startDealFlow(userPhone);
      case 'consultancy_rating':
        return this.startRatingFlow(userPhone, classification);
      default:
        return {
          to: userPhone,
          body: '🤔 I\'m not sure how to help with that. Type *help* to see options.',
        };
    }
  }

  /**
   * Handle the next step in an active flow.
   */
  async handleFlowStep(
    userPhone: string,
    message: string,
  ): Promise<OutgoingWhatsAppMessage> {
    const session = this.sessionManager.getSession(userPhone);
    if (!session) {
      return {
        to: userPhone,
        body: 'Your session has expired. Please start again!',
      };
    }

    switch (session.current_step) {
      // Business submission flow
      case 'collecting_business_name':
        return this.collectBusinessName(userPhone, message);
      case 'collecting_business_address':
        return this.collectBusinessAddress(userPhone, message);
      case 'collecting_business_category':
        return this.collectBusinessCategory(userPhone, message);
      case 'collecting_business_phone':
        return this.collectBusinessPhone(userPhone, message);
      case 'collecting_business_hours':
        return this.collectBusinessHours(userPhone, message);
      case 'confirming_business_submission':
        return this.confirmBusinessSubmission(userPhone, message);

      // Deal submission flow
      case 'collecting_deal_business':
        return this.collectDealBusiness(userPhone, message);
      case 'collecting_deal_discount':
        return this.collectDealDiscount(userPhone, message);
      case 'collecting_deal_expiry':
        return this.collectDealExpiry(userPhone, message);
      case 'collecting_deal_terms':
        return this.collectDealTerms(userPhone, message);
      case 'confirming_deal_submission':
        return this.confirmDealSubmission(userPhone, message);

      // Rating flow
      case 'collecting_rating_consultancy':
        return this.collectRatingConsultancy(userPhone, message);
      case 'collecting_rating_stars':
        return this.collectRatingStars(userPhone, message);
      case 'collecting_rating_text':
        return this.collectRatingText(userPhone, message);
      case 'confirming_rating_submission':
        return this.confirmRatingSubmission(userPhone, message);

      default:
        this.sessionManager.endSession(userPhone);
        return {
          to: userPhone,
          body: 'Something went wrong. Please try again! Type *help* for options.',
        };
    }
  }

  // ========== Business Submission Flow ==========

  private startBusinessFlow(userPhone: string): OutgoingWhatsAppMessage {
    this.sessionManager.createSession(
      userPhone,
      'submit_business',
      'collecting_business_name',
    );

    return {
      to: userPhone,
      body: '📝 *Add Your Business*\n\nGreat! Let\'s add your business to the directory.\n\nWhat is the *name* of your business?\n\n(Type *cancel* anytime to stop)',
    };
  }

  private collectBusinessName(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_business_address',
      data: { business_name: message },
    });

    return {
      to: userPhone,
      body: `Got it — *${message}*! 📍\n\nWhat is the full *address*? (e.g., "123 Main St, Plano, TX 75023")`,
    };
  }

  private collectBusinessAddress(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_business_category',
      data: { business_address: message },
    });

    const categories = BUSINESS_CATEGORIES.slice(0, 12).join(', ');

    return {
      to: userPhone,
      body: `📍 Address saved!\n\nWhat *category* best fits your business?\n\nOptions: ${categories}\n\n(Type the category name)`,
    };
  }

  private collectBusinessCategory(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    const normalized = message.toLowerCase().trim().replace(/\s+/g, '_') as BusinessCategory;
    const isValid = BUSINESS_CATEGORIES.includes(normalized as any);

    if (!isValid) {
      const categories = BUSINESS_CATEGORIES.slice(0, 12).join(', ');
      return {
        to: userPhone,
        body: `❌ That category isn't recognized. Please choose from:\n\n${categories}`,
      };
    }

    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_business_phone',
      data: { business_category: normalized },
    });

    return {
      to: userPhone,
      body: `✅ Category: *${normalized}*\n\nWhat is the business *phone number*?`,
    };
  }

  private collectBusinessPhone(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_business_hours',
      data: { business_phone: message },
    });

    return {
      to: userPhone,
      body: '📞 Phone saved!\n\nWhat are the *business hours*? (e.g., "Mon-Sat 10AM-9PM, Sun Closed")',
    };
  }

  private collectBusinessHours(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'confirming_business_submission',
      data: { business_hours: message },
    });

    const session = this.sessionManager.getSession(userPhone)!;
    const d = session.data;

    return {
      to: userPhone,
      body: `📋 *Review Your Business Listing:*\n\n🏪 Name: *${d.business_name}*\n📍 Address: ${d.business_address}\n📂 Category: ${d.business_category}\n📞 Phone: ${d.business_phone}\n🕐 Hours: ${d.business_hours}\n\nSubmit this listing? Reply *yes* or *no*`,
    };
  }

  private async confirmBusinessSubmission(
    userPhone: string,
    message: string,
  ): Promise<OutgoingWhatsAppMessage> {
    if (this.isConfirmation(message)) {
      const session = this.sessionManager.getSession(userPhone)!;
      const d = session.data;

      try {
        // Parse address into components
        const addressParts = String(d.business_address).split(',').map((s: string) => s.trim());
        const address = addressParts[0] || String(d.business_address);
        const city = addressParts[1] || '';
        const stateZip = addressParts[2] || '';
        const state = stateZip.split(' ')[0] || '';
        const zip = stateZip.split(' ')[1] || '';

        await this.repos.businesses.create({
          name: String(d.business_name),
          address,
          city,
          state,
          zip_code: zip,
          phone: String(d.business_phone),
          category: d.business_category as BusinessCategory,
          hours: String(d.business_hours),
          submission_source: 'whatsapp',
        });

        this.sessionManager.endSession(userPhone);

        return {
          to: userPhone,
          body: `✅ *Business submitted!*\n\nYour listing for *${d.business_name}* has been submitted for review. It will appear on the website after moderation.\n\n📱 ${this.config.websiteBaseUrl}/businesses`,
        };
      } catch {
        this.sessionManager.endSession(userPhone);
        return {
          to: userPhone,
          body: '⚠️ Sorry, there was an error submitting your business. Please try again later.',
        };
      }
    }

    this.sessionManager.endSession(userPhone);
    return {
      to: userPhone,
      body: '❌ Submission cancelled. Type *help* to see what else I can do!',
    };
  }

  // ========== Deal Submission Flow ==========

  private startDealFlow(userPhone: string): OutgoingWhatsAppMessage {
    this.sessionManager.createSession(
      userPhone,
      'submit_deal',
      'collecting_deal_business',
    );

    return {
      to: userPhone,
      body: '🏷️ *Post a Deal*\n\nWhich *business* is this deal for?\n\n(Type *cancel* anytime to stop)',
    };
  }

  private collectDealBusiness(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_deal_discount',
      data: { deal_business: message },
    });

    return {
      to: userPhone,
      body: `🏪 Business: *${message}*\n\nWhat is the *deal/discount*? (e.g., "20% off all items" or "$5 off orders over $30")`,
    };
  }

  private collectDealDiscount(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_deal_expiry',
      data: { deal_discount: message },
    });

    return {
      to: userPhone,
      body: '💰 Deal saved!\n\nWhen does this deal *expire*? (e.g., "March 31, 2026" or "No expiry")',
    };
  }

  private collectDealExpiry(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_deal_terms',
      data: { deal_expiry: message },
    });

    return {
      to: userPhone,
      body: '📅 Expiry set!\n\nAny *terms & conditions*? (e.g., "Dine-in only" or "None")',
    };
  }

  private collectDealTerms(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    this.sessionManager.updateSession(userPhone, {
      step: 'confirming_deal_submission',
      data: { deal_terms: message },
    });

    const session = this.sessionManager.getSession(userPhone)!;
    const d = session.data;

    return {
      to: userPhone,
      body: `📋 *Review Your Deal:*\n\n🏪 Business: *${d.deal_business}*\n💰 Deal: ${d.deal_discount}\n📅 Expires: ${d.deal_expiry}\n📝 Terms: ${d.deal_terms}\n\nPost this deal? Reply *yes* or *no*`,
    };
  }

  private async confirmDealSubmission(
    userPhone: string,
    message: string,
  ): Promise<OutgoingWhatsAppMessage> {
    if (this.isConfirmation(message)) {
      const session = this.sessionManager.getSession(userPhone)!;
      const d = session.data;

      try {
        const expiryStr = String(d.deal_expiry).toLowerCase();
        const hasExpiry = expiryStr !== 'none' && expiryStr !== 'no expiry';

        await this.repos.deals.create({
          business_id: '',  // Will be resolved by backend or moderation
          business_name: String(d.deal_business),
          title: `${d.deal_discount} at ${d.deal_business}`,
          description: String(d.deal_discount),
          deal_type: 'percentage_off',
          city: '',   // WhatsApp flow doesn't collect location; inherited from business
          state: '',
          expires_at: hasExpiry ? String(d.deal_expiry) : new Date(Date.now() + 30 * 86400000).toISOString(),
          submission_source: 'whatsapp',
        });

        this.sessionManager.endSession(userPhone);

        return {
          to: userPhone,
          body: `✅ *Deal posted!*\n\nYour deal for *${d.deal_business}* has been submitted for review.\n\n📱 ${this.config.websiteBaseUrl}/deals`,
        };
      } catch {
        this.sessionManager.endSession(userPhone);
        return {
          to: userPhone,
          body: '⚠️ Sorry, there was an error posting your deal. Please try again later.',
        };
      }
    }

    this.sessionManager.endSession(userPhone);
    return {
      to: userPhone,
      body: '❌ Deal submission cancelled. Type *help* for more options!',
    };
  }

  // ========== Consultancy Rating Flow ==========

  private startRatingFlow(
    userPhone: string,
    classification: IntentClassification,
  ): OutgoingWhatsAppMessage {
    const existingRating = classification.entities.rating;

    if (existingRating) {
      // User already provided the rating in the initial message
      this.sessionManager.createSession(
        userPhone,
        'consultancy_rating',
        'collecting_rating_consultancy',
      );
      this.sessionManager.updateSession(userPhone, {
        data: { rating_stars: parseInt(existingRating, 10) },
      });
    } else {
      this.sessionManager.createSession(
        userPhone,
        'consultancy_rating',
        'collecting_rating_consultancy',
      );
    }

    return {
      to: userPhone,
      body: '⭐ *Rate a Consultancy*\n\nWhat is the *name* of the consultancy you want to rate?\n\n(Type *cancel* anytime to stop)',
    };
  }

  private collectRatingConsultancy(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    const session = this.sessionManager.getSession(userPhone)!;
    const hasRating = session.data.rating_stars !== undefined;

    this.sessionManager.updateSession(userPhone, {
      step: hasRating ? 'collecting_rating_text' : 'collecting_rating_stars',
      data: { rating_consultancy: message },
    });

    if (hasRating) {
      return {
        to: userPhone,
        body: `🏢 Consultancy: *${message}*\n⭐ Rating: ${session.data.rating_stars} stars\n\nWould you like to add a *review comment*? (or type "skip")`,
      };
    }

    return {
      to: userPhone,
      body: `🏢 Consultancy: *${message}*\n\nHow many *stars* (1-5)?`,
    };
  }

  private collectRatingStars(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    const stars = parseInt(message, 10);
    if (isNaN(stars) || stars < 1 || stars > 5) {
      return {
        to: userPhone,
        body: '❌ Please enter a number between 1 and 5.',
      };
    }

    this.sessionManager.updateSession(userPhone, {
      step: 'collecting_rating_text',
      data: { rating_stars: stars },
    });

    return {
      to: userPhone,
      body: `${'⭐'.repeat(stars)} Got it!\n\nWould you like to add a *review comment*? (or type "skip")`,
    };
  }

  private collectRatingText(
    userPhone: string,
    message: string,
  ): OutgoingWhatsAppMessage {
    const reviewText = message.toLowerCase() === 'skip' ? '' : message;

    this.sessionManager.updateSession(userPhone, {
      step: 'confirming_rating_submission',
      data: { rating_text: reviewText },
    });

    const session = this.sessionManager.getSession(userPhone)!;
    const d = session.data;
    const starsDisplay = '⭐'.repeat(d.rating_stars as number);

    return {
      to: userPhone,
      body: `📋 *Review Your Rating:*\n\n🏢 Consultancy: *${d.rating_consultancy}*\n${starsDisplay} (${d.rating_stars}/5)\n💬 Review: ${d.rating_text || '(none)'}\n\nSubmit this rating? Reply *yes* or *no*`,
    };
  }

  private async confirmRatingSubmission(
    userPhone: string,
    message: string,
  ): Promise<OutgoingWhatsAppMessage> {
    if (this.isConfirmation(message)) {
      const session = this.sessionManager.getSession(userPhone)!;
      const d = session.data;

      try {
        await this.repos.reviews.create({
          reviewable_type: 'consultancy',
          reviewable_id: '',  // Will be resolved by backend or moderation
          reviewable_name: String(d.rating_consultancy),
          reviewer_id: userPhone,
          reviewer_name: userPhone,  // WhatsApp only has phone; name resolved later
          rating: d.rating_stars as number,
          review_text: String(d.rating_text || ''),
          submission_source: 'whatsapp',
        });

        this.sessionManager.endSession(userPhone);

        return {
          to: userPhone,
          body: `✅ *Rating submitted!*\n\nYour ${d.rating_stars}-star review for *${d.rating_consultancy}* has been recorded. Thank you for helping the community!\n\n📱 ${this.config.websiteBaseUrl}/consultancies`,
        };
      } catch {
        this.sessionManager.endSession(userPhone);
        return {
          to: userPhone,
          body: '⚠️ Sorry, there was an error submitting your rating. Please try again later.',
        };
      }
    }

    this.sessionManager.endSession(userPhone);
    return {
      to: userPhone,
      body: '❌ Rating cancelled. Type *help* for more options!',
    };
  }

  // ========== Helpers ==========

  private isConfirmation(message: string): boolean {
    return /^(yes|y|confirm|ok|sure|yep|yeah|submit|go ahead)$/i.test(message.trim());
  }
}
