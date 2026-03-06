/**
 * Social Media Content Calendar utilities
 * Generates content schedules, templates, and sharing utilities
 */

import type {
  SocialPlatform,
  ContentFormat,
  ContentCategory,
  ContentCalendarEntry,
  ContentCalendar,
  ContentTemplate,
  ShareableContent,
  SocialMediaPost,
} from '@desi-connect/shared';

// ─── Content Templates ──────────────────────────────────────────

const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    template_id: 'tmpl_community_spotlight',
    name: 'Community Spotlight',
    category: 'community_spotlight',
    platforms: ['instagram', 'facebook', 'linkedin'],
    format: 'carousel',
    caption_template:
      '✨ Community Spotlight: Meet {name} from {city}! {story} #DesiConnectUSA #IndianAmerican #CommunitySpotlight',
    hashtag_suggestions: [
      '#DesiConnectUSA',
      '#IndianAmerican',
      '#CommunitySpotlight',
      '#DesiPride',
      '#IndianDiaspora',
    ],
    best_posting_times: ['09:00', '12:00', '18:00'],
    tips: [
      'Feature diverse community members',
      'Include a quote from the featured person',
      'Tag the person and their business if applicable',
    ],
  },
  {
    template_id: 'tmpl_business_feature',
    name: 'Business Feature Friday',
    category: 'business_feature',
    platforms: ['instagram', 'facebook', 'twitter'],
    format: 'image',
    caption_template:
      '🏪 Business Feature Friday: {business_name} in {city}, {state}! {description} 📍 {address}\n\n#SupportDesi #DesiConnect #IndianBusiness',
    hashtag_suggestions: [
      '#SupportDesi',
      '#DesiConnect',
      '#IndianBusiness',
      '#ShopLocal',
      '#DesiOwned',
    ],
    best_posting_times: ['10:00', '14:00', '19:00'],
    tips: [
      'Post on Fridays for #FeatureFriday',
      'Include high-quality photos',
      'Mention special offers or deals',
    ],
  },
  {
    template_id: 'tmpl_event_promo',
    name: 'Event Promotion',
    category: 'event_promotion',
    platforms: ['instagram', 'facebook', 'twitter', 'whatsapp'],
    format: 'image',
    caption_template:
      '📅 Upcoming Event: {event_title}\n📍 {location}\n🗓 {date}\n\n{description}\n\nRSVP now! Link in bio 👆\n\n#DesiEvents #IndianEvents #{city}Events',
    hashtag_suggestions: [
      '#DesiEvents',
      '#IndianEvents',
      '#CulturalEvents',
      '#DesiConnect',
    ],
    best_posting_times: ['08:00', '12:00', '17:00'],
    tips: [
      'Post 1-2 weeks before the event',
      'Create countdown stories',
      'Share event details in WhatsApp groups',
    ],
  },
  {
    template_id: 'tmpl_deal_alert',
    name: 'Deal Alert',
    category: 'deal_alert',
    platforms: ['instagram', 'facebook', 'whatsapp', 'twitter'],
    format: 'story',
    caption_template:
      '🔥 DEAL ALERT! {business_name} in {city} is offering {discount}! {description}\n\nUse code: {coupon_code}\n⏰ Expires: {expiry_date}\n\n#DesiDeals #SaveMoney #DesiConnect',
    hashtag_suggestions: ['#DesiDeals', '#SaveMoney', '#Discount', '#DesiConnect'],
    best_posting_times: ['11:00', '15:00', '20:00'],
    tips: [
      'Use urgency in the messaging',
      'Include the coupon code prominently',
      'Share as stories for time-sensitive deals',
    ],
  },
  {
    template_id: 'tmpl_cultural_content',
    name: 'Cultural Content',
    category: 'cultural_content',
    platforms: ['instagram', 'facebook', 'youtube'],
    format: 'video',
    caption_template:
      '🎭 {title}\n\n{description}\n\nWhat are your favorite {topic} traditions? Share below! 👇\n\n#IndianCulture #DesiConnect #Heritage',
    hashtag_suggestions: [
      '#IndianCulture',
      '#Heritage',
      '#DesiTraditions',
      '#IndianFestivals',
    ],
    best_posting_times: ['09:00', '13:00', '19:00'],
    tips: [
      'Time cultural posts with festivals',
      'Include educational content',
      'Encourage user engagement with questions',
    ],
  },
  {
    template_id: 'tmpl_food_feature',
    name: 'Food Feature',
    category: 'food_feature',
    platforms: ['instagram', 'facebook', 'youtube'],
    format: 'reel',
    caption_template:
      '🍛 {dish_name} at {restaurant_name} in {city}!\n\n{description}\n\nWould you try this? 😋\n\n#DesiFoodie #IndianFood #Foodie #{city}Food',
    hashtag_suggestions: [
      '#DesiFoodie',
      '#IndianFood',
      '#Foodie',
      '#FoodReview',
      '#DesiConnect',
    ],
    best_posting_times: ['11:30', '17:30', '20:00'],
    tips: [
      'Post during lunch/dinner hours',
      'Use mouthwatering photos/videos',
      'Tag the restaurant',
    ],
  },
  {
    template_id: 'tmpl_immigration_tips',
    name: 'Immigration Tips',
    category: 'immigration_tips',
    platforms: ['instagram', 'linkedin', 'twitter'],
    format: 'carousel',
    caption_template:
      '📋 Immigration Tip: {title}\n\n{tips}\n\nSave this for later! 🔖\n\n⚠️ This is general information, not legal advice.\n\n#ImmigrationTips #H1B #GreenCard #DesiConnect',
    hashtag_suggestions: [
      '#ImmigrationTips',
      '#H1B',
      '#GreenCard',
      '#VisaHelp',
      '#DesiConnect',
    ],
    best_posting_times: ['08:00', '12:00', '16:00'],
    tips: [
      'Always include disclaimer about legal advice',
      'Use carousel format for step-by-step guides',
      'Link to verified consultancies',
    ],
  },
  {
    template_id: 'tmpl_job_highlight',
    name: 'Job Highlight',
    category: 'job_highlight',
    platforms: ['linkedin', 'twitter', 'facebook'],
    format: 'text',
    caption_template:
      '💼 Now Hiring: {job_title} at {company}\n📍 {location}\n{h1b_info}\n\nApply now: {apply_url}\n\n#DesiJobs #H1BSponsorship #IndianProfessionals #DesiConnect',
    hashtag_suggestions: [
      '#DesiJobs',
      '#H1BSponsorship',
      '#JobAlert',
      '#IndianProfessionals',
    ],
    best_posting_times: ['08:00', '10:00', '14:00'],
    tips: [
      'Highlight H1B sponsorship availability',
      'Post on weekday mornings',
      'Include salary range if available',
    ],
  },
];

// ─── Day Themes ──────────────────────────────────────────

const DAY_THEMES: Record<string, { theme: string; category: ContentCategory }> = {
  Monday: { theme: 'Motivation Monday', category: 'success_story' },
  Tuesday: { theme: 'Tips Tuesday', category: 'immigration_tips' },
  Wednesday: { theme: 'Wellness Wednesday', category: 'cultural_content' },
  Thursday: { theme: 'Throwback Thursday', category: 'community_spotlight' },
  Friday: { theme: 'Feature Friday', category: 'business_feature' },
  Saturday: { theme: 'Savor Saturday', category: 'food_feature' },
  Sunday: { theme: 'Sunday Spotlight', category: 'event_promotion' },
};

// ─── Utility Functions ──────────────────────────────────────

export function getContentTemplates(): ContentTemplate[] {
  return CONTENT_TEMPLATES;
}

export function getTemplateById(templateId: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find((t) => t.template_id === templateId);
}

export function getTemplatesByCategory(category: ContentCategory): ContentTemplate[] {
  return CONTENT_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByPlatform(platform: SocialPlatform): ContentTemplate[] {
  return CONTENT_TEMPLATES.filter((t) => t.platforms.includes(platform));
}

export function getDayTheme(dayOfWeek: string): { theme: string; category: ContentCategory } | undefined {
  return DAY_THEMES[dayOfWeek];
}

/**
 * Generate a content calendar for a given month/year
 */
export function generateContentCalendar(
  month: number,
  year: number,
  existingPosts: SocialMediaPost[] = []
): ContentCalendar {
  const entries: ContentCalendarEntry[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const platformsUsed = new Set<SocialPlatform>();
  let totalPosts = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = formatDateStr(date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const theme = DAY_THEMES[dayOfWeek];

    const dayPosts = existingPosts.filter((p) => p.scheduled_date === dateStr);
    dayPosts.forEach((p) => p.platforms.forEach((pl) => platformsUsed.add(pl)));
    totalPosts += dayPosts.length;

    entries.push({
      date: dateStr,
      day_of_week: dayOfWeek,
      posts: dayPosts,
      theme: theme?.theme,
    });
  }

  return {
    month,
    year,
    entries,
    total_posts: totalPosts,
    platforms_covered: Array.from(platformsUsed),
  };
}

/**
 * Fill a caption template with data
 */
export function fillCaptionTemplate(
  template: string,
  data: Record<string, string>
): string {
  let filled = template;
  Object.entries(data).forEach(([key, value]) => {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return filled;
}

/**
 * Generate suggested hashtags for a post
 */
export function generateHashtags(
  category: ContentCategory,
  city?: string,
  additionalTags: string[] = []
): string[] {
  const baseHashtags = ['#DesiConnectUSA', '#IndianDiaspora'];
  const template = CONTENT_TEMPLATES.find((t) => t.category === category);
  const categoryTags = template?.hashtag_suggestions || [];

  const cityTag = city ? [`#${city.replace(/\s+/g, '')}`, `#${city.replace(/\s+/g, '')}Desi`] : [];

  const allTags = [...new Set([...baseHashtags, ...categoryTags, ...cityTag, ...additionalTags])];
  return allTags.slice(0, 15); // Instagram allows max 30, but 10-15 is optimal
}

/**
 * Get optimal posting times for a platform
 */
export function getOptimalPostingTimes(platform: SocialPlatform): string[] {
  const platformTimes: Record<SocialPlatform, string[]> = {
    instagram: ['09:00', '12:00', '17:00', '19:00'],
    facebook: ['09:00', '13:00', '16:00', '19:00'],
    twitter: ['08:00', '12:00', '17:00', '21:00'],
    linkedin: ['07:30', '10:00', '12:00', '17:30'],
    whatsapp: ['08:00', '12:00', '18:00'],
    youtube: ['14:00', '17:00', '20:00'],
  };
  return platformTimes[platform] || ['09:00', '12:00', '18:00'];
}

/**
 * Build a social share URL for different platforms
 */
export function buildShareUrl(
  platform: SocialPlatform,
  content: ShareableContent
): string {
  const encodedUrl = encodeURIComponent(content.share_url);
  const encodedTitle = encodeURIComponent(content.title);
  const encodedDesc = encodeURIComponent(content.suggested_caption);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedDesc}&url=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${content.suggested_caption} ${content.share_url}`)}`;
    default:
      return content.share_url;
  }
}

/**
 * Calculate engagement rate for a post
 */
export function calculateEngagementRate(post: SocialMediaPost): number {
  if (!post.engagement || post.engagement.reach === 0) return 0;
  const { likes, comments, shares, saves } = post.engagement;
  const totalEngagement = likes + comments + shares + saves;
  return Number(((totalEngagement / post.engagement.reach) * 100).toFixed(2));
}

/**
 * Get content suggestions for a specific date
 */
export function getContentSuggestions(date: Date): {
  theme: string;
  category: ContentCategory;
  templates: ContentTemplate[];
  suggestedTimes: string[];
} {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayTheme = DAY_THEMES[dayOfWeek] || { theme: 'General Content', category: 'community_spotlight' as ContentCategory };

  const templates = getTemplatesByCategory(dayTheme.category);

  return {
    theme: dayTheme.theme,
    category: dayTheme.category,
    templates,
    suggestedTimes: ['09:00', '12:00', '18:00'],
  };
}

/**
 * Validate a social media post before scheduling
 */
export function validatePost(post: Partial<SocialMediaPost>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!post.caption || post.caption.trim().length === 0) {
    errors.push('Caption is required');
  }

  if (!post.platforms || post.platforms.length === 0) {
    errors.push('At least one platform must be selected');
  }

  if (!post.scheduled_date) {
    errors.push('Scheduled date is required');
  }

  // Platform-specific validations
  if (post.platforms?.includes('twitter') && post.caption && post.caption.length > 280) {
    errors.push('Twitter/X posts must be 280 characters or less');
  }

  if (post.platforms?.includes('instagram') && (!post.media_urls || post.media_urls.length === 0)) {
    warnings.push('Instagram posts perform better with images or videos');
  }

  if (post.hashtags && post.hashtags.length > 30) {
    warnings.push('Instagram allows a maximum of 30 hashtags');
  }

  if (post.caption && post.caption.length > 2200 && post.platforms?.includes('instagram')) {
    errors.push('Instagram captions must be 2,200 characters or less');
  }

  if (post.scheduled_date) {
    const scheduledDate = new Date(post.scheduled_date);
    if (scheduledDate < new Date()) {
      warnings.push('Scheduled date is in the past');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Helper ──────────────────────────────────────────

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}
