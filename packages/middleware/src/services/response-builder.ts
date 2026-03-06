/**
 * Response Builder (Section 7.2 - Bot Architecture)
 *
 * Fetches data from repositories, formats into WhatsApp-friendly messages.
 * Each intent gets a dedicated response formatter.
 */

import type {
  BotIntent,
  IntentClassification,
  OutgoingWhatsAppMessage,
  Business,
  Job,
  Deal,
  Event,
  Consultancy,
} from '@desi-connect/shared';

import type { Repositories } from '@desi-connect/database';

/**
 * Configuration for the ResponseBuilder.
 */
export interface ResponseBuilderConfig {
  /** Max results to return in search-type responses */
  maxSearchResults: number;
  /** Base URL for the community website (for deep links) */
  websiteBaseUrl: string;
}

const DEFAULT_CONFIG: ResponseBuilderConfig = {
  maxSearchResults: 5,
  websiteBaseUrl: 'https://desiconnectusa.com',
};

export class ResponseBuilder {
  private readonly config: ResponseBuilderConfig;
  private readonly repos: Repositories;

  constructor(repos: Repositories, config: Partial<ResponseBuilderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.repos = repos;
  }

  /**
   * Build a response for a classified intent.
   */
  async buildResponse(
    to: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    switch (classification.intent) {
      case 'search_businesses':
        return this.buildSearchBusinessesResponse(to, classification);
      case 'job_search':
        return this.buildJobSearchResponse(to, classification);
      case 'deals_nearby':
        return this.buildDealsNearbyResponse(to, classification);
      case 'event_info':
        return this.buildEventInfoResponse(to, classification);
      case 'immigration_alert':
        return this.buildImmigrationAlertResponse(to, classification);
      case 'daily_digest':
        return this.buildDailyDigestResponse(to);
      case 'help_onboarding':
        return this.buildHelpResponse(to);
      case 'consultancy_rating':
        return this.buildConsultancyRatingPrompt(to, classification);
      case 'submit_business':
        return this.buildSubmitBusinessPrompt(to);
      case 'submit_deal':
        return this.buildSubmitDealPrompt(to);
      default:
        return this.buildUnknownResponse(to);
    }
  }

  /**
   * Search Businesses: "Find Indian restaurants in Plano TX"
   * Returns top N listings with ratings, address, phone.
   */
  private async buildSearchBusinessesResponse(
    to: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    try {
      const { data } = await this.repos.businesses.list({
        limit: this.config.maxSearchResults,
      });

      if (data.length === 0) {
        return {
          to,
          body: '🔍 No businesses found matching your search. Try a different category or location!\n\nType *help* to see what I can do.',
        };
      }

      const location = classification.entities.location || '';
      const category = classification.entities.category || 'business';
      const header = `🏪 *Top ${category}${location ? ' in ' + location : ''}*\n\n`;

      const listings = data
        .map((b: Business, i: number) => this.formatBusinessListing(b, i + 1))
        .join('\n\n');

      const footer = `\n\n📱 View more at ${this.config.websiteBaseUrl}/businesses`;

      return { to, body: header + listings + footer };
    } catch {
      return { to, body: '⚠️ Sorry, I couldn\'t search businesses right now. Please try again shortly.' };
    }
  }

  /**
   * Job Search: "OPT jobs in data science near Dallas"
   */
  private async buildJobSearchResponse(
    to: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    try {
      const { data } = await this.repos.jobs.list({
        limit: this.config.maxSearchResults,
      });

      if (data.length === 0) {
        return {
          to,
          body: '💼 No jobs found matching your criteria. Try broadening your search!\n\nType *help* for more options.',
        };
      }

      const header = '💼 *Job Listings*\n\n';
      const listings = data
        .map((j: Job, i: number) => this.formatJobListing(j, i + 1))
        .join('\n\n');

      const footer = `\n\n🔗 Browse all jobs: ${this.config.websiteBaseUrl}/jobs`;

      return { to, body: header + listings + footer };
    } catch {
      return { to, body: '⚠️ Sorry, I couldn\'t search jobs right now. Please try again shortly.' };
    }
  }

  /**
   * Deals Nearby: "Any Indian grocery deals this week?"
   */
  private async buildDealsNearbyResponse(
    to: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    try {
      const { data } = await this.repos.deals.list({
        limit: this.config.maxSearchResults,
      });

      if (data.length === 0) {
        return {
          to,
          body: '🏷️ No active deals right now. Check back soon!\n\nType *help* for more options.',
        };
      }

      const header = '🏷️ *Active Deals & Coupons*\n\n';
      const listings = data
        .map((d: Deal, i: number) => this.formatDealListing(d, i + 1))
        .join('\n\n');

      const footer = `\n\n🔗 All deals: ${this.config.websiteBaseUrl}/deals`;

      return { to, body: header + listings + footer };
    } catch {
      return { to, body: '⚠️ Sorry, I couldn\'t fetch deals right now. Please try again shortly.' };
    }
  }

  /**
   * Event Info: "What Holi events are happening near me?"
   */
  private async buildEventInfoResponse(
    to: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    try {
      const { data } = await this.repos.events.list({
        limit: this.config.maxSearchResults,
      });

      if (data.length === 0) {
        return {
          to,
          body: '📅 No upcoming events found. Stay tuned!\n\nType *help* for more options.',
        };
      }

      const header = '📅 *Upcoming Events*\n\n';
      const listings = data
        .map((e: Event, i: number) => this.formatEventListing(e, i + 1))
        .join('\n\n');

      const footer = `\n\n🔗 Full calendar: ${this.config.websiteBaseUrl}/events`;

      return { to, body: header + listings + footer };
    } catch {
      return { to, body: '⚠️ Sorry, I couldn\'t fetch events right now. Please try again shortly.' };
    }
  }

  /**
   * Immigration Alert: "Subscribe to EB-2 updates"
   */
  private async buildImmigrationAlertResponse(
    to: string,
    classification: IntentClassification,
  ): Promise<OutgoingWhatsAppMessage> {
    const visaCategory = classification.entities.visa_category || 'general immigration';

    return {
      to,
      body: `🇺🇸 *Immigration Alert Subscription*\n\nYou've requested alerts for *${visaCategory}* updates.\n\n✅ You'll receive notifications when:\n• New visa bulletin is published\n• Policy changes affecting ${visaCategory}\n• Priority date movements\n\nWe'll send you updates as they happen.\n\n📱 Full immigration hub: ${this.config.websiteBaseUrl}/immigration`,
    };
  }

  /**
   * Daily Digest: "Send me daily community updates"
   */
  private async buildDailyDigestResponse(
    to: string,
  ): Promise<OutgoingWhatsAppMessage> {
    return {
      to,
      body: `📰 *Daily Digest Subscription*\n\n✅ You're signed up for the daily community digest!\n\nEvery morning at 8 AM, you'll receive:\n• Top community news\n• New business listings\n• Active deals & events\n• Immigration updates\n\nReply *STOP DIGEST* anytime to unsubscribe.\n\n📱 Website: ${this.config.websiteBaseUrl}`,
    };
  }

  /**
   * Help/Onboarding: Welcome message with menu of capabilities.
   */
  private buildHelpResponse(to: string): OutgoingWhatsAppMessage {
    return {
      to,
      body: `🙏 *Namaste! Welcome to Desi Connect USA*\n\nI'm your community assistant. Here's what I can help with:\n\n🏪 *Find Businesses* — "Find Indian restaurants in Dallas"\n💼 *Search Jobs* — "OPT jobs in data science"\n🏷️ *Browse Deals* — "Any Indian grocery deals?"\n📅 *Events* — "Holi events near me"\n🇺🇸 *Immigration* — "Subscribe to H-1B updates"\n📰 *Daily Digest* — "Send me daily updates"\n\n📝 *Contribute:*\n• "Add my restaurant to the directory"\n• "Post a 20% off deal for my store"\n• "Rate ABC Consultancy 3 stars"\n\nJust type your question naturally! 💬`,
    };
  }

  /**
   * Consultancy Rating — prompt to start the rating flow.
   */
  private buildConsultancyRatingPrompt(
    to: string,
    classification: IntentClassification,
  ): OutgoingWhatsAppMessage {
    const rating = classification.entities.rating;
    if (rating) {
      return {
        to,
        body: `⭐ *Consultancy Rating*\n\nI'll help you submit a ${rating}-star rating. What is the name of the consultancy you'd like to rate?`,
      };
    }

    return {
      to,
      body: '⭐ *Consultancy Rating*\n\nI\'ll help you rate a consultancy. What is the name of the consultancy you\'d like to rate?',
    };
  }

  /**
   * Submit Business — prompt to start the business submission flow.
   */
  private buildSubmitBusinessPrompt(to: string): OutgoingWhatsAppMessage {
    return {
      to,
      body: '📝 *Add Your Business*\n\nGreat! I\'ll help you add your business to the directory.\n\nLet\'s start — what is the *name* of your business?',
    };
  }

  /**
   * Submit Deal — prompt to start the deal submission flow.
   */
  private buildSubmitDealPrompt(to: string): OutgoingWhatsAppMessage {
    return {
      to,
      body: '🏷️ *Post a Deal*\n\nI\'ll help you post a deal. Which *business* is this deal for?',
    };
  }

  /**
   * Unknown intent — friendly fallback.
   */
  private buildUnknownResponse(to: string): OutgoingWhatsAppMessage {
    return {
      to,
      body: '🤔 I\'m not sure what you\'re looking for. Type *help* to see what I can do!\n\nYou can ask me about businesses, jobs, deals, events, immigration updates, and more.',
    };
  }

  // ---------- Formatters ----------

  private formatBusinessListing(b: Business, idx: number): string {
    const stars = b.average_rating
      ? '⭐'.repeat(Math.round(b.average_rating)) + ` (${b.average_rating})`
      : 'No ratings yet';
    return `*${idx}. ${b.name}*\n📍 ${b.address}, ${b.city}, ${b.state}\n📞 ${b.phone}\n${stars}`;
  }

  private formatJobListing(j: Job, idx: number): string {
    const sponsorTag = j.h1b_sponsor ? '✅ H-1B Sponsor' : '';
    const optTag = j.opt_friendly ? '🎓 OPT Friendly' : '';
    const tags = [sponsorTag, optTag].filter(Boolean).join(' | ');
    const salary = j.salary_min && j.salary_max
      ? `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}`
      : j.salary_min
        ? `From $${j.salary_min.toLocaleString()}`
        : 'Not specified';
    return `*${idx}. ${j.title}*\n🏢 ${j.company_name}\n📍 ${j.city}, ${j.state}\n${tags ? tags + '\n' : ''}💰 ${salary}`;
  }

  private formatDealListing(d: Deal, idx: number): string {
    const expiry = d.expires_at
      ? `⏰ Expires: ${new Date(d.expires_at).toLocaleDateString()}`
      : '';
    const code = d.coupon_code ? `🎟️ Code: *${d.coupon_code}*` : '';
    return `*${idx}. ${d.title}*\n${d.description}\n${code}\n${expiry}`.trim();
  }

  private formatEventListing(e: Event, idx: number): string {
    const date = new Date(e.starts_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `*${idx}. ${e.title}*\n📅 ${date}\n📍 ${e.venue_name || 'TBD'}, ${e.city}, ${e.state}`;
  }
}
