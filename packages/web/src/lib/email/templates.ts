/**
 * Email Templates for Desi Connect USA
 *
 * Provides HTML + plaintext email generators for:
 * - Welcome emails (new subscriber onboarding)
 * - Weekly digest emails (curated community content)
 * - Immigration alert emails (time-sensitive updates)
 *
 * All templates follow consistent branding and include
 * an unsubscribe link for CAN-SPAM compliance.
 */

import type { DigestType } from '@/lib/api-client';

// ── Shared Types ─────────────────────────────────────────────────────

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailData {
  name?: string;
  digestTypes: DigestType[];
  frequency: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
}

export interface DigestItem {
  title: string;
  summary: string;
  url: string;
  category: DigestType;
}

export interface WeeklyDigestData {
  name?: string;
  date: string;
  items: DigestItem[];
  preferencesUrl: string;
  unsubscribeUrl: string;
}

export interface ImmigrationAlertData {
  name?: string;
  alertTitle: string;
  category: string;
  summary: string;
  details: string;
  sourceUrl?: string;
  actionRequired?: string;
  deadline?: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
}

// ── Constants ────────────────────────────────────────────────────────

const BRAND_NAME = 'Desi Connect USA';
const BRAND_TAGLINE = 'Connecting the Indian diaspora in America';
const BRAND_COLOR = '#E65100'; // saffron/orange
const BRAND_COLOR_DARK = '#BF360C';
const SUCCESS_COLOR = '#2E7D32';
const ALERT_COLOR = '#C62828';
const TEXT_COLOR = '#333333';
const MUTED_COLOR = '#666666';
const LIGHT_BG = '#FFF8E1'; // warm cream
const BORDER_COLOR = '#FFE0B2';

const DIGEST_TYPE_LABELS: Record<DigestType, string> = {
  community: '🏘️ Community',
  immigration: '🇺🇸 Immigration',
  deals: '💰 Deals & Offers',
  jobs: '💼 Jobs',
  events: '🎉 Events',
};

const DIGEST_TYPE_COLORS: Record<DigestType, string> = {
  community: '#1565C0',
  immigration: '#2E7D32',
  deals: '#E65100',
  jobs: '#6A1B9A',
  events: '#AD1457',
};

// ── Utilities ────────────────────────────────────────────────────────

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function greeting(name?: string): string {
  return name ? `Namaste ${escapeHtml(name.trim())}` : 'Namaste';
}

function greetingPlain(name?: string): string {
  return name ? `Namaste ${name.trim()}` : 'Namaste';
}

// ── Shared Layout ────────────────────────────────────────────────────

function wrapHtml(body: string, preferencesUrl: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">${BRAND_NAME}</h1>
              <p style="margin:4px 0 0;color:#FFE0B2;font-size:13px;">${BRAND_TAGLINE}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0 0 8px;font-size:12px;color:${MUTED_COLOR};text-align:center;">
                <a href="${escapeHtml(preferencesUrl)}" style="color:${BRAND_COLOR};text-decoration:underline;">Manage Preferences</a>
                &nbsp;|&nbsp;
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED_COLOR};text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0;font-size:11px;color:#999999;text-align:center;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Welcome Email ────────────────────────────────────────────────────

export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const { name, digestTypes, frequency, preferencesUrl, unsubscribeUrl } = data;

  const typesList = digestTypes
    .map((t) => DIGEST_TYPE_LABELS[t] || t)
    .join(', ');

  const typesHtml = digestTypes
    .map(
      (t) =>
        `<span style="display:inline-block;padding:4px 12px;margin:2px 4px;border-radius:16px;background-color:${DIGEST_TYPE_COLORS[t] || BRAND_COLOR};color:#ffffff;font-size:13px;">${escapeHtml(DIGEST_TYPE_LABELS[t] || t)}</span>`,
    )
    .join(' ');

  const body = `
    <h2 style="margin:0 0 16px;color:${TEXT_COLOR};font-size:22px;">🙏 ${greeting(name)}!</h2>
    <p style="margin:0 0 16px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
      Welcome to the <strong>${BRAND_NAME}</strong> community! You're now connected to the largest
      network of Indian diaspora resources in the United States.
    </p>
    <div style="background-color:${LIGHT_BG};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:20px;margin:0 0 20px;">
      <h3 style="margin:0 0 12px;color:${BRAND_COLOR};font-size:16px;">Your Subscription Details</h3>
      <p style="margin:0 0 8px;color:${TEXT_COLOR};font-size:14px;">
        <strong>Topics:</strong> ${typesHtml || '<em>Default (Community)</em>'}
      </p>
      <p style="margin:0;color:${TEXT_COLOR};font-size:14px;">
        <strong>Frequency:</strong> ${escapeHtml(frequency.charAt(0).toUpperCase() + frequency.slice(1))}
      </p>
    </div>
    <h3 style="margin:0 0 12px;color:${TEXT_COLOR};font-size:16px;">What to Expect</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
      <tr>
        <td style="padding:8px 12px;vertical-align:top;width:28px;font-size:18px;">📰</td>
        <td style="padding:8px 0;color:${TEXT_COLOR};font-size:14px;line-height:1.5;">
          <strong>Curated Digests</strong> — Hand-picked community news, deals, and resources
        </td>
      </tr>
      <tr>
        <td style="padding:8px 12px;vertical-align:top;width:28px;font-size:18px;">🇺🇸</td>
        <td style="padding:8px 0;color:${TEXT_COLOR};font-size:14px;line-height:1.5;">
          <strong>Immigration Alerts</strong> — Timely updates on visa, green card, and policy changes
        </td>
      </tr>
      <tr>
        <td style="padding:8px 12px;vertical-align:top;width:28px;font-size:18px;">💼</td>
        <td style="padding:8px 0;color:${TEXT_COLOR};font-size:14px;line-height:1.5;">
          <strong>Job Listings</strong> — Opportunities from employers who value diversity
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;color:${TEXT_COLOR};font-size:14px;line-height:1.5;">
      You can update your preferences anytime to customize the content you receive.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:6px;background-color:${SUCCESS_COLOR};">
          <a href="${escapeHtml(preferencesUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">
            Customize Your Preferences
          </a>
        </td>
      </tr>
    </table>`;

  const text = `${greetingPlain(name)}!

Welcome to the ${BRAND_NAME} community! You're now connected to the largest network of Indian diaspora resources in the United States.

YOUR SUBSCRIPTION DETAILS
Topics: ${typesList || 'Default (Community)'}
Frequency: ${frequency.charAt(0).toUpperCase() + frequency.slice(1)}

WHAT TO EXPECT
- Curated Digests — Hand-picked community news, deals, and resources
- Immigration Alerts — Timely updates on visa, green card, and policy changes
- Job Listings — Opportunities from employers who value diversity

You can update your preferences anytime: ${preferencesUrl}

To unsubscribe: ${unsubscribeUrl}

© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`;

  return {
    subject: `🙏 Welcome to ${BRAND_NAME}!`,
    html: wrapHtml(body, preferencesUrl, unsubscribeUrl),
    text,
  };
}

// ── Weekly Digest Email ──────────────────────────────────────────────

export function generateWeeklyDigestEmail(data: WeeklyDigestData): EmailTemplate {
  const { name, date, items, preferencesUrl, unsubscribeUrl } = data;

  const groupedItems: Partial<Record<DigestType, DigestItem[]>> = {};
  for (const item of items) {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category]!.push(item);
  }

  let sectionsHtml = '';
  let sectionsText = '';

  const categories = Object.keys(groupedItems) as DigestType[];
  for (const category of categories) {
    const categoryItems = groupedItems[category]!;
    const label = DIGEST_TYPE_LABELS[category] || category;
    const color = DIGEST_TYPE_COLORS[category] || BRAND_COLOR;

    sectionsHtml += `
      <h3 style="margin:24px 0 12px;color:${color};font-size:16px;border-bottom:2px solid ${color};padding-bottom:6px;">
        ${escapeHtml(label)}
      </h3>`;

    sectionsText += `\n--- ${label} ---\n`;

    for (const item of categoryItems) {
      sectionsHtml += `
      <div style="margin:0 0 16px;padding:12px 16px;background-color:#fafafa;border-radius:6px;border-left:3px solid ${color};">
        <a href="${escapeHtml(item.url)}" style="color:${TEXT_COLOR};font-size:15px;font-weight:bold;text-decoration:none;">
          ${escapeHtml(item.title)}
        </a>
        <p style="margin:6px 0 0;color:${MUTED_COLOR};font-size:13px;line-height:1.5;">
          ${escapeHtml(item.summary)}
        </p>
      </div>`;

      sectionsText += `\n${item.title}\n${item.summary}\nRead more: ${item.url}\n`;
    }
  }

  const itemCount = items.length;
  const body = `
    <h2 style="margin:0 0 8px;color:${TEXT_COLOR};font-size:22px;">📰 Your Weekly Digest</h2>
    <p style="margin:0 0 4px;color:${MUTED_COLOR};font-size:13px;">${escapeHtml(date)}</p>
    <p style="margin:0 0 20px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
      ${greeting(name)}! Here's your curated roundup with <strong>${itemCount} ${itemCount === 1 ? 'update' : 'updates'}</strong> this week.
    </p>
    ${sectionsHtml}
    <div style="margin:24px 0 0;padding:16px;background-color:${LIGHT_BG};border-radius:6px;text-align:center;">
      <p style="margin:0 0 12px;color:${TEXT_COLOR};font-size:14px;">
        Want different content? Update your digest preferences.
      </p>
      <a href="${escapeHtml(preferencesUrl)}" style="display:inline-block;padding:10px 24px;background-color:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:6px;">
        Update Preferences
      </a>
    </div>`;

  const text = `YOUR WEEKLY DIGEST — ${date}

${greetingPlain(name)}! Here's your curated roundup with ${itemCount} ${itemCount === 1 ? 'update' : 'updates'} this week.
${sectionsText}

Update your preferences: ${preferencesUrl}
Unsubscribe: ${unsubscribeUrl}

© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`;

  return {
    subject: `📰 Your ${BRAND_NAME} Weekly Digest — ${date}`,
    html: wrapHtml(body, preferencesUrl, unsubscribeUrl),
    text,
  };
}

// ── Immigration Alert Email ──────────────────────────────────────────

export function generateImmigrationAlertEmail(data: ImmigrationAlertData): EmailTemplate {
  const {
    name,
    alertTitle,
    category,
    summary,
    details,
    sourceUrl,
    actionRequired,
    deadline,
    preferencesUrl,
    unsubscribeUrl,
  } = data;

  let urgencyHtml = '';
  let urgencyText = '';

  if (actionRequired || deadline) {
    urgencyHtml = `
      <div style="margin:0 0 20px;padding:16px;background-color:#FFEBEE;border:1px solid #FFCDD2;border-radius:6px;">
        <h3 style="margin:0 0 8px;color:${ALERT_COLOR};font-size:15px;">⚡ Action Required</h3>`;

    urgencyText += '\n⚡ ACTION REQUIRED\n';

    if (actionRequired) {
      urgencyHtml += `
        <p style="margin:0 0 4px;color:${TEXT_COLOR};font-size:14px;line-height:1.5;">
          ${escapeHtml(actionRequired)}
        </p>`;
      urgencyText += `${actionRequired}\n`;
    }

    if (deadline) {
      urgencyHtml += `
        <p style="margin:8px 0 0;color:${ALERT_COLOR};font-size:14px;font-weight:bold;">
          📅 Deadline: ${escapeHtml(deadline)}
        </p>`;
      urgencyText += `Deadline: ${deadline}\n`;
    }

    urgencyHtml += '</div>';
  }

  const sourceHtml = sourceUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
        <tr>
          <td style="border-radius:6px;background-color:${BRAND_COLOR};">
            <a href="${escapeHtml(sourceUrl)}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">
              Read Full Details →
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const sourceText = sourceUrl ? `\nRead full details: ${sourceUrl}` : '';

  const body = `
    <div style="margin:0 0 20px;padding:12px 16px;background-color:#E8F5E9;border-radius:6px;text-align:center;">
      <span style="display:inline-block;padding:4px 14px;background-color:${SUCCESS_COLOR};color:#ffffff;font-size:12px;font-weight:bold;border-radius:12px;text-transform:uppercase;">
        🇺🇸 Immigration Alert
      </span>
      <span style="display:inline-block;padding:4px 14px;margin-left:8px;background-color:#1565C0;color:#ffffff;font-size:12px;border-radius:12px;">
        ${escapeHtml(category)}
      </span>
    </div>
    <h2 style="margin:0 0 12px;color:${TEXT_COLOR};font-size:20px;">${escapeHtml(alertTitle)}</h2>
    <p style="margin:0 0 16px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
      ${greeting(name)}, here's an important immigration update you should know about:
    </p>
    <p style="margin:0 0 16px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;font-weight:bold;">
      ${escapeHtml(summary)}
    </p>
    ${urgencyHtml}
    <div style="margin:0 0 16px;color:${TEXT_COLOR};font-size:14px;line-height:1.7;">
      ${escapeHtml(details).replace(/\n/g, '<br />')}
    </div>
    ${sourceHtml}
    <div style="margin:24px 0 0;padding:12px;background-color:#fafafa;border-radius:6px;border-left:3px solid ${BRAND_COLOR};">
      <p style="margin:0;color:${MUTED_COLOR};font-size:12px;line-height:1.5;">
        <strong>Disclaimer:</strong> This alert is for informational purposes only and does not
        constitute legal advice. Please consult a qualified immigration attorney for specific guidance.
      </p>
    </div>`;

  const text = `🇺🇸 IMMIGRATION ALERT — ${category}

${alertTitle}

${greetingPlain(name)}, here's an important immigration update you should know about:

${summary}
${urgencyText}
${details}
${sourceText}

DISCLAIMER: This alert is for informational purposes only and does not constitute legal advice. Please consult a qualified immigration attorney for specific guidance.

Manage preferences: ${preferencesUrl}
Unsubscribe: ${unsubscribeUrl}

© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`;

  return {
    subject: `🇺🇸 Immigration Alert: ${alertTitle}`,
    html: wrapHtml(body, preferencesUrl, unsubscribeUrl),
    text,
  };
}
