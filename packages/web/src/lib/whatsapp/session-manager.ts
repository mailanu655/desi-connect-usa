/**
 * Session Manager for WhatsApp Bot
 * 
 * Manages multi-step conversation sessions with TTL-based expiration.
 * Handles session creation, updates, step advancement, and validation.
 */

import type { ConversationSession, SessionStep, BotIntent } from '@desi-connect/shared';
import { randomUUID } from 'crypto';

// Default TTL: 30 minutes in milliseconds
const DEFAULT_SESSION_TTL = 30 * 60 * 1000;

/**
 * In-memory session store
 * In production, this should use a persistent store (Redis, Database, etc.)
 */
class SessionStore {
  private sessions: Map<string, ConversationSession> = new Map();
  private expiryTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get a session by phone number
   */
  get(phone: string): ConversationSession | null {
    return this.sessions.get(this.normalizePhone(phone)) || null;
  }

  /**
   * Set a session
   */
  set(phone: string, session: ConversationSession): void {
    const normalizedPhone = this.normalizePhone(phone);
    this.sessions.set(normalizedPhone, session);
  }

  /**
   * Delete a session
   */
  delete(phone: string): void {
    const normalizedPhone = this.normalizePhone(phone);
    this.sessions.delete(normalizedPhone);

    // Clear the expiry timer
    const timer = this.expiryTimers.get(normalizedPhone);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(normalizedPhone);
    }
  }

  /**
   * Check if a session exists
   */
  has(phone: string): boolean {
    return this.sessions.has(this.normalizePhone(phone));
  }

  /**
   * Set an expiry timer for a session
   */
  setExpiry(phone: string, ttl: number): void {
    const normalizedPhone = this.normalizePhone(phone);

    // Clear existing timer if any
    const existingTimer = this.expiryTimers.get(normalizedPhone);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.delete(normalizedPhone);
    }, ttl);

    this.expiryTimers.set(normalizedPhone, timer);
  }

  /**
   * Normalize phone number to a consistent format
   */
  private normalizePhone(phone: string): string {
    // Remove special characters and whatsapp: prefix
    return phone.replace(/^whatsapp:/, '').replace(/[^0-9+]/g, '');
  }

  /**
   * Get all sessions (for debugging/monitoring)
   */
  getAll(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
    this.expiryTimers.forEach((timer) => clearTimeout(timer));
    this.expiryTimers.clear();
  }
}

// Global session store
const sessionStore = new SessionStore();

/**
 * Validate session step transitions
 */
const VALID_STEP_TRANSITIONS: Record<SessionStep, SessionStep[]> = {
  idle: [
    'collecting_business_name',
    'collecting_deal_business',
    'collecting_rating_consultancy',
  ],
  collecting_business_name: ['collecting_business_address'],
  collecting_business_address: ['collecting_business_category'],
  collecting_business_category: ['collecting_business_phone'],
  collecting_business_phone: ['collecting_business_hours'],
  collecting_business_hours: ['confirming_business_submission'],
  confirming_business_submission: ['idle'],
  collecting_deal_business: ['collecting_deal_discount'],
  collecting_deal_discount: ['collecting_deal_expiry'],
  collecting_deal_expiry: ['collecting_deal_terms'],
  collecting_deal_terms: ['confirming_deal_submission'],
  confirming_deal_submission: ['idle'],
  collecting_rating_consultancy: ['collecting_rating_stars'],
  collecting_rating_stars: ['collecting_rating_text'],
  collecting_rating_text: ['confirming_rating_submission'],
  confirming_rating_submission: ['idle'],
};

/**
 * Create a new conversation session
 * 
 * @param phone - User's phone number
 * @param userId - Optional user ID for authenticated users
 * @param ttl - Session TTL in milliseconds (default: 30 minutes)
 * @returns ConversationSession
 */
export function createSession(
  phone: string,
  userId: string | null = null,
  ttl: number = DEFAULT_SESSION_TTL,
): ConversationSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);

  const session: ConversationSession = {
    session_id: randomUUID(),
    user_phone: phone,
    user_id: userId,
    current_step: 'idle',
    intent: null,
    data: {},
    last_activity: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  sessionStore.set(phone, session);
  sessionStore.setExpiry(phone, ttl);

  return session;
}

/**
 * Get an existing session by phone number
 * 
 * @param phone - User's phone number
 * @returns ConversationSession or null if not found or expired
 */
export function getSession(phone: string): ConversationSession | null {
  const session = sessionStore.get(phone);

  if (!session) {
    return null;
  }

  // Check if session has expired
  const expiresAt = new Date(session.expires_at);
  if (new Date() > expiresAt) {
    sessionStore.delete(phone);
    return null;
  }

  return session;
}

/**
 * Update a session with partial data
 * 
 * @param phone - User's phone number
 * @param updates - Partial session updates
 * @returns Updated ConversationSession
 */
export function updateSession(
  phone: string,
  updates: Partial<ConversationSession>,
): ConversationSession {
  let session = getSession(phone);

  if (!session) {
    throw new Error(`Session not found for phone: ${phone}`);
  }

  // Update the session
  session = {
    ...session,
    ...updates,
    last_activity: new Date().toISOString(),
  };

  sessionStore.set(phone, session);

  return session;
}

/**
 * Advance the session to the next step
 *
 * @param phone - User's phone number
 * @param stepData - Data collected in current step
 * @returns Updated ConversationSession
 */
export function advanceStep(
  phone: string,
  stepData: Record<string, unknown>,
): ConversationSession {
  const session = getSession(phone);

  if (!session) {
    throw new Error(`Session not found for phone: ${phone}`);
  }

  // Merge step data into session data
  const updatedData = {
    ...session.data,
    ...stepData,
  };

  // Get valid next steps
  const currentStep = session.current_step;
  const validNextSteps = VALID_STEP_TRANSITIONS[currentStep];

  if (!validNextSteps || validNextSteps.length === 0) {
    throw new Error(`Cannot advance from step: ${currentStep}`);
  }

  // Determine next step based on intent when at idle
  let nextStep: SessionStep;

  if (currentStep === 'idle' && session.intent) {
    // Map intent to the appropriate starting step
    const intentToStep: Record<BotIntent, SessionStep> = {
      register_business: 'collecting_business_name',
      register_deal: 'collecting_deal_business',
      rate_consultancy: 'collecting_rating_consultancy',
    };

    nextStep = intentToStep[session.intent] || validNextSteps[0];
  } else {
    // For non-idle steps, use the first valid next step
    nextStep = validNextSteps[0];
  }

  return updateSession(phone, {
    current_step: nextStep,
    data: updatedData,
  });
}

/**
 * Set the intent for the current session
 * 
 * @param phone - User's phone number
 * @param intent - The bot intent
 * @returns Updated ConversationSession
 */
export function setSessionIntent(phone: string, intent: BotIntent): ConversationSession {
  return updateSession(phone, { intent });
}

/**
 * Reset session to idle state
 * 
 * @param phone - User's phone number
 * @returns Updated ConversationSession
 */
export function resetSession(phone: string): ConversationSession {
  return updateSession(phone, {
    current_step: 'idle',
    intent: null,
    data: {},
  });
}

/**
 * Expire and delete a session
 * 
 * @param phone - User's phone number
 */
export function expireSession(phone: string): void {
  sessionStore.delete(phone);
}

/**
 * Check if a session is in a collecting step (awaiting user input)
 * 
 * @param phone - User's phone number
 * @returns true if session is waiting for input
 */
export function isCollectingStep(phone: string): boolean {
  const session = getSession(phone);

  if (!session) {
    return false;
  }

  return session.current_step.startsWith('collecting_') || session.current_step.startsWith('confirming_');
}

/**
 * Get the prompt for the current collecting step
 * 
 * @param step - The session step
 * @returns Prompt message for the user
 */
export function getStepPrompt(step: SessionStep): string {
  const prompts: Record<SessionStep, string> = {
    idle: 'What can I help you with?',
    collecting_business_name: "What's the name of your business?",
    collecting_business_address: "What's the address of your business?",
    collecting_business_category: "What category does your business fall under?",
    collecting_business_phone: "What's the phone number for your business?",
    collecting_business_hours: "What are your business hours?",
    confirming_business_submission: 'Please confirm your business details are correct. Reply YES to submit.',
    collecting_deal_business: 'Which business is this deal for?',
    collecting_deal_discount: 'What discount are you offering? (e.g., 20%)',
    collecting_deal_expiry: 'When does this deal expire?',
    collecting_deal_terms: 'Any terms or conditions for this deal?',
    confirming_deal_submission: 'Please confirm your deal details. Reply YES to post.',
    collecting_rating_consultancy: 'Which consultancy would you like to rate?',
    collecting_rating_stars: 'How many stars would you give? (1-5)',
    collecting_rating_text: 'Please share your feedback about this consultancy.',
    confirming_rating_submission: 'Please confirm your review. Reply YES to submit.',
  };

  return prompts[step] || 'What would you like to do?';
}

/**
 * Get session statistics (for debugging/monitoring)
 */
export function getSessionStats(): {
  totalSessions: number;
  activeSessions: ConversationSession[];
} {
  return {
    totalSessions: sessionStore.getAll().length,
    activeSessions: sessionStore.getAll(),
  };
}

/**
 * Clear all sessions (for testing or server reset)
 */
export function clearAllSessions(): void {
  sessionStore.clear();
}

export default {
  createSession,
  getSession,
  updateSession,
  advanceStep,
  setSessionIntent,
  resetSession,
  expireSession,
  isCollectingStep,
  getStepPrompt,
  getSessionStats,
  clearAllSessions,
};
