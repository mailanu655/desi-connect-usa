/**
 * Response Builder for WhatsApp Bot
 * 
 * Builds formatted WhatsApp responses from bot intent results.
 * Handles template-based formatting, emoji usage, and character limits.
 */

import type { BotIntent, OutgoingWhatsAppMessage } from '@desi-connect/shared';

// WhatsApp message character limit
const WHATSAPP_CHAR_LIMIT = 4096;

/**
 * Template definitions for each intent type
 */
interface ResponseTemplate {
  greeting?: string;
  format: (data: any) => string;
  footer?: string;
}

const RESPONSE_TEMPLATES: Record<string, ResponseTemplate> = {
  business_listing: {
    greeting: 'Found some great businesses for you!',
    format: (businesses: any[]) => {
      if (!businesses || businesses.length === 0) {
        return 'No businesses found. Try searching with different criteria.';
      }

      const items = businesses.slice(0, 5).map((biz, idx) => {
        return `${idx + 1}. ${biz.name || 'N/A'}\n📍 ${biz.address || 'N/A'}\n📞 ${biz.phone || 'N/A'}\n${biz.rating ? `⭐ ${biz.rating}/5` : ''}`;
      });

      return items.join('\n\n');
    },
    footer: 'Reply with a business number to see more details',
  },
  business_confirmation: {
    greeting: 'Thank you for submitting your business!',
    format: (data: any) => {
      return `Name: ${data.name || 'N/A'}\nCategory: ${data.category || 'N/A'}\nAddress: ${data.address || 'N/A'}\n\nWe will review and list your business within 24 hours. ✅`;
    },
    footer: 'You will receive a confirmation message shortly.',
  },
  job_listing: {
    greeting: 'Great job opportunities available!',
    format: (jobs: any[]) => {
      if (!jobs || jobs.length === 0) {
        return 'No jobs matching your criteria. Check back soon!';
      }

      const items = jobs.slice(0, 5).map((job, idx) => {
        return `${idx + 1}. ${job.title || 'N/A'}\n🏢 ${job.company || 'N/A'}\n📍 ${job.location || 'N/A'}\n💼 ${job.type || 'Full Time'}`;
      });

      return items.join('\n\n');
    },
    footer: 'Reply with a job number to apply',
  },
  immigration_alert: {
    greeting: 'Immigration Alert Settings',
    format: (data: any) => {
      return `You've subscribed to ${data.visa_type || 'visa'} updates!\n\nYou will receive alerts for:\n• Priority Date movements\n• Visa bulletin updates\n• Policy changes\n• Visa category updates\n\nWe send updates every Monday. 📬`;
    },
    footer: 'Reply STOP to unsubscribe anytime.',
  },
  deal_listing: {
    greeting: 'Hot deals near you! 🔥',
    format: (deals: any[]) => {
      if (!deals || deals.length === 0) {
        return 'No active deals right now. Check back soon!';
      }

      const items = deals.slice(0, 5).map((deal, idx) => {
        return `${idx + 1}. ${deal.discount || 'Special Offer'} off\n🏪 ${deal.business || 'N/A'}\n${deal.description || ''}\n⏰ Expires: ${deal.expiry || 'N/A'}`;
      });

      return items.join('\n\n');
    },
    footer: 'Reply with a deal number for more info',
  },
  deal_confirmation: {
    greeting: 'Deal posted successfully! 🎉',
    format: (data: any) => {
      return `Discount: ${data.discount || 'N/A'}%\nBusiness: ${data.business || 'N/A'}\nDescription: ${data.description || 'N/A'}\n\nYour deal is now live and visible to our community!`;
    },
    footer: 'Your deal will expire on the date provided.',
  },
  rating_confirmation: {
    greeting: 'Thank you for your review! 🙏',
    format: (data: any) => {
      return `Rating: ${data.rating || 'N/A'} stars\nConsultancy: ${data.consultancy_name || 'N/A'}\n\nYour review helps other community members make better decisions. Thank you!`;
    },
    footer: 'Your review will be published within 24 hours.',
  },
  event_listing: {
    greeting: 'Community events near you! 🎉',
    format: (events: any[]) => {
      if (!events || events.length === 0) {
        return 'No events scheduled right now. Check back soon!';
      }

      const items = events.slice(0, 5).map((event, idx) => {
        return `${idx + 1}. ${event.name || 'N/A'}\n📍 ${event.location || 'N/A'}\n📅 ${event.date || 'N/A'}\n⏰ ${event.time || 'N/A'}`;
      });

      return items.join('\n\n');
    },
    footer: 'Reply with an event number for more details',
  },
  daily_digest: {
    greeting: 'Your Daily Community Digest 📰',
    format: (data: any) => {
      const sections = [];

      if (data.news && data.news.length > 0) {
        sections.push('📰 Top News:\n' + data.news.slice(0, 3).map((n: any) => `• ${n.title}`).join('\n'));
      }

      if (data.deals && data.deals.length > 0) {
        sections.push('🔥 Hot Deals:\n' + data.deals.slice(0, 3).map((d: any) => `• ${d.discount}% off at ${d.business}`).join('\n'));
      }

      if (data.jobs && data.jobs.length > 0) {
        sections.push('💼 New Jobs:\n' + data.jobs.slice(0, 3).map((j: any) => `• ${j.title} at ${j.company}`).join('\n'));
      }

      return sections.length > 0 ? sections.join('\n\n') : 'No updates for today.';
    },
    footer: 'Reply DAILY to stay subscribed or STOP to unsubscribe.',
  },
  help_menu: {
    greeting: 'Welcome to Desi Connect USA Bot! 👋',
    format: () => {
      return `What can I help you with?\n\n1️⃣ Find businesses\n2️⃣ Search jobs\n3️⃣ Immigration alerts\n4️⃣ Find deals\n5️⃣ Community events\n6️⃣ Daily updates\n\nJust text what you're looking for!`;
    },
  },
  unknown_intent: {
    greeting: "I didn't quite understand that.",
    format: () => {
      return `Try asking me to:\n• Find Indian restaurants\n• Search for jobs\n• Get immigration updates\n• Find deals\n• Show events\n\nOr reply with *help* to see the menu.`;
    },
  },
};

/**
 * Truncate text to WhatsApp character limit, adding ellipsis if needed
 */
function truncateToCharLimit(text: string, limit: number = WHATSAPP_CHAR_LIMIT): string {
  if (text.length <= limit) {
    return text;
  }

  // Truncate and add ellipsis
  return text.substring(0, limit - 3) + '...';
}

/**
 * Build a formatted WhatsApp response from intent and data
 * 
 * @param intent - The bot intent
 * @param data - Data to include in the response
 * @returns OutgoingWhatsAppMessage ready to send
 */
export function buildResponse(intent: BotIntent, data: any): OutgoingWhatsAppMessage {
  const templateKey = getTemplateKey(intent);
  const template = RESPONSE_TEMPLATES[templateKey];

  if (!template) {
    return buildErrorResponse(`Cannot process intent: ${intent}`);
  }

  let body = '';

  // Add greeting if available
  if (template.greeting) {
    body += template.greeting + '\n\n';
  }

  // Format the main content
  try {
    body += template.format(data);
  } catch (error) {
    return buildErrorResponse('Error formatting response');
  }

  // Add footer if available
  if (template.footer) {
    body += '\n\n' + template.footer;
  }

  // Ensure we don't exceed character limit
  body = truncateToCharLimit(body);

  return {
    to: data.to || '',
    body,
  };
}

/**
 * Build an error response message
 * 
 * @param error - Error message to include
 * @returns OutgoingWhatsAppMessage with error message
 */
export function buildErrorResponse(error: string): OutgoingWhatsAppMessage {
  return {
    to: '',
    body: `⚠️ Sorry, something went wrong: ${error}\n\nPlease try again or reply with *help* for assistance.`,
  };
}

/**
 * Build a welcome/greeting response message
 * 
 * @returns OutgoingWhatsAppMessage with welcome message
 */
export function buildWelcomeResponse(): OutgoingWhatsAppMessage {
  return {
    to: '',
    body: `Welcome to Desi Connect USA! 🇮🇳🇺🇸

I'm your personal assistant for everything in the Indian-American community!

You can ask me to:
📍 Find Indian businesses & restaurants
💼 Search for jobs (OPT, H1B, etc.)
📰 Get immigration alerts & updates
🔥 Find the best deals nearby
🎉 Discover community events
📰 Receive daily community updates

What would you like help with today?`,
  };
}

/**
 * Get the template key for a given intent
 */
function getTemplateKey(intent: BotIntent): string {
  const mapping: Record<BotIntent, string> = {
    search_businesses: 'business_listing',
    submit_business: 'business_confirmation',
    job_search: 'job_listing',
    immigration_alert: 'immigration_alert',
    deals_nearby: 'deal_listing',
    submit_deal: 'deal_confirmation',
    consultancy_rating: 'rating_confirmation',
    event_info: 'event_listing',
    daily_digest: 'daily_digest',
    help_onboarding: 'help_menu',
    unknown: 'unknown_intent',
  };

  return mapping[intent] || 'unknown_intent';
}

/**
 * Format a business listing into a readable string
 */
export function formatBusinessListing(business: any): string {
  const lines = [];
  lines.push(`📍 ${business.name || 'Business'}`);
  if (business.category) lines.push(`Category: ${business.category}`);
  if (business.address) lines.push(`Address: ${business.address}`);
  if (business.phone) lines.push(`Phone: ${business.phone}`);
  if (business.hours) lines.push(`Hours: ${business.hours}`);
  if (business.rating) lines.push(`Rating: ⭐ ${business.rating}/5`);
  return lines.join('\n');
}

/**
 * Format a job listing into a readable string
 */
export function formatJobListing(job: any): string {
  const lines = [];
  lines.push(`💼 ${job.title || 'Position'}`);
  if (job.company) lines.push(`Company: ${job.company}`);
  if (job.location) lines.push(`Location: ${job.location}`);
  if (job.type) lines.push(`Type: ${job.type}`);
  if (job.salary) lines.push(`Salary: ${job.salary}`);
  if (job.description) lines.push(`Details: ${job.description.substring(0, 100)}...`);
  return lines.join('\n');
}

/**
 * Calculate estimated message cost based on character count and type
 */
export function estimateMessageCost(body: string, hasMedia: boolean = false): number {
  const baseChars = body.length;
  const baseCost = 0.0043; // Base cost per message
  const mediaCost = hasMedia ? 0.005 : 0;

  // Template messages are cheaper
  const isTemplate = body.includes('{{') && body.includes('}}');
  const templateDiscount = isTemplate ? 0.5 : 1;

  return (baseCost * (baseChars / 1000)) * templateDiscount + mediaCost;
}

export default {
  buildResponse,
  buildErrorResponse,
  buildWelcomeResponse,
  formatBusinessListing,
  formatJobListing,
  estimateMessageCost,
};
