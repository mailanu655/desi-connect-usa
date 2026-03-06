/**
 * MessageRouter Tests
 *
 * Tests the main message routing logic:
 *   - parseTwilioWebhook: Parse incoming Twilio webhook payloads
 *   - handleMessage: Route messages to appropriate handlers based on intent/state
 *   - Cancel command detection and priority handling
 *   - Flow routing vs intent classification routing
 *
 * All dependencies are mocked using jest.fn().
 */

import { MessageRouter } from '@desi-connect/middleware';
import type {
  IncomingWhatsAppMessage,
  OutgoingWhatsAppMessage,
  IntentClassification,
  BotIntent,
} from '@desi-connect/shared';

// ── Helpers ─────────────────────────────────────────────────

/**
 * Helper to create an IncomingWhatsAppMessage for testing
 */
function createIncomingMessage(
  overrides?: Partial<IncomingWhatsAppMessage>,
): IncomingWhatsAppMessage {
  return {
    message_sid: 'SM1234567890abcdef1234567890abcdef',
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    from: '+12015550123',
    to: '+1234567890',
    body: 'test message',
    num_media: 0,
    media_urls: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create an IntentClassification for testing
 */
function makeClassification(
  intent: BotIntent,
  entities: Record<string, string> = {},
  confidence: number = 0.9,
): IntentClassification {
  return {
    intent,
    confidence,
    entities,
    raw_message: `test ${intent}`,
  };
}

/**
 * Helper to create mock dependencies
 */
function createMockDeps() {
  return {
    intentEngine: {
      classify: jest.fn(),
    },
    sessionManager: {
      createSession: jest.fn(),
      updateSession: jest.fn(),
      endSession: jest.fn(),
      getSession: jest.fn(),
      isInFlow: jest.fn(),
      clearAll: jest.fn(),
    },
    responseBuilder: {
      buildResponse: jest.fn(),
    },
    flowHandler: {
      startFlow: jest.fn(),
      handleFlowStep: jest.fn(),
    },
  };
}

// ── Tests ─────────────────────────────────────────────────

describe('MessageRouter', () => {
  let router: MessageRouter;
  let mockDeps: ReturnType<typeof createMockDeps>;

  beforeEach(() => {
    mockDeps = createMockDeps();
    router = new MessageRouter(mockDeps as any);
  });

  // ═══════════════════════════════════════════════════════════
  // parseTwilioWebhook TESTS
  // ═══════════════════════════════════════════════════════════

  describe('parseTwilioWebhook', () => {
    it('should parse a standard Twilio webhook body with all fields', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Hello, this is a test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.message_sid).toBe('SM1234567890abcdef1234567890abcdef');
      expect(result.account_sid).toBe('ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      expect(result.from).toBe('+12015550123');
      expect(result.to).toBe('+1234567890');
      expect(result.body).toBe('Hello, this is a test message');
      expect(result.num_media).toBe(0);
      expect(result.media_urls).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle missing MessageSid by defaulting to empty string', () => {
      const body = {
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.message_sid).toBe('');
    });

    it('should handle missing AccountSid by defaulting to empty string', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.account_sid).toBe('');
    });

    it('should handle missing From by defaulting to empty string', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        To: '+1234567890',
        Body: 'Test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.from).toBe('');
    });

    it('should handle missing To by defaulting to empty string', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        Body: 'Test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.to).toBe('');
    });

    it('should handle missing Body by defaulting to empty string', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.body).toBe('');
    });

    it('should handle missing NumMedia by defaulting to 0', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.num_media).toBe(0);
    });

    it('should parse NumMedia as 0 when provided as string "0"', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.num_media).toBe(0);
      expect(result.media_urls).toEqual([]);
    });

    it('should parse media URLs when NumMedia=1', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message with image',
        NumMedia: '1',
        MediaUrl0: 'https://example.com/image.jpg',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.num_media).toBe(1);
      expect(result.media_urls).toEqual(['https://example.com/image.jpg']);
    });

    it('should parse multiple media URLs when NumMedia=2', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message with multiple images',
        NumMedia: '2',
        MediaUrl0: 'https://example.com/image1.jpg',
        MediaUrl1: 'https://example.com/image2.png',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.num_media).toBe(2);
      expect(result.media_urls).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image2.png',
      ]);
    });

    it('should parse media URLs when NumMedia=3', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message with three media',
        NumMedia: '3',
        MediaUrl0: 'https://example.com/file1.jpg',
        MediaUrl1: 'https://example.com/file2.mp4',
        MediaUrl2: 'https://example.com/file3.pdf',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.num_media).toBe(3);
      expect(result.media_urls).toEqual([
        'https://example.com/file1.jpg',
        'https://example.com/file2.mp4',
        'https://example.com/file3.pdf',
      ]);
    });

    it('should skip missing media URLs in the sequence', () => {
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message',
        NumMedia: '3',
        MediaUrl0: 'https://example.com/image.jpg',
        // MediaUrl1 is missing
        MediaUrl2: 'https://example.com/image3.jpg',
      };

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.num_media).toBe(3);
      // Only present URLs are included
      expect(result.media_urls).toEqual([
        'https://example.com/image.jpg',
        'https://example.com/image3.jpg',
      ]);
    });

    it('should generate a valid ISO timestamp', () => {
      const before = new Date().toISOString();
      const body = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        From: '+12015550123',
        To: '+1234567890',
        Body: 'Test message',
        NumMedia: '0',
      };

      const result = MessageRouter.parseTwilioWebhook(body);
      const after = new Date().toISOString();

      // Timestamp should be valid ISO string
      expect(() => new Date(result.timestamp)).not.toThrow();

      // Timestamp should be between before and after (ISO string comparison)
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('should handle all missing fields gracefully', () => {
      const body = {};

      const result = MessageRouter.parseTwilioWebhook(body);

      expect(result.message_sid).toBe('');
      expect(result.account_sid).toBe('');
      expect(result.from).toBe('');
      expect(result.to).toBe('');
      expect(result.body).toBe('');
      expect(result.num_media).toBe(0);
      expect(result.media_urls).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // handleMessage — Cancel Commands TESTS
  // ═══════════════════════════════════════════════════════════

  describe('handleMessage — cancel commands', () => {
    it('should handle "cancel" command (lowercase)', async () => {
      const incoming = createIncomingMessage({ body: 'cancel' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
      expect(result[0].to).toBe('+12015550123');
      expect(result[0].body).toContain('Cancelled');
    });

    it('should handle "CANCEL" command (uppercase)', async () => {
      const incoming = createIncomingMessage({ body: 'CANCEL' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('Cancelled');
    });

    it('should handle "Cancel" command (mixed case)', async () => {
      const incoming = createIncomingMessage({ body: 'Cancel' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should handle "stop" command', async () => {
      const incoming = createIncomingMessage({ body: 'stop' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('Cancelled');
    });

    it('should handle "STOP" command (uppercase)', async () => {
      const incoming = createIncomingMessage({ body: 'STOP' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should handle "quit" command', async () => {
      const incoming = createIncomingMessage({ body: 'quit' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should handle "exit" command', async () => {
      const incoming = createIncomingMessage({ body: 'exit' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should handle "nevermind" command', async () => {
      const incoming = createIncomingMessage({ body: 'nevermind' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should handle "never mind" command (with space)', async () => {
      const incoming = createIncomingMessage({ body: 'never mind' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should handle "never  mind" command (multiple spaces)', async () => {
      const incoming = createIncomingMessage({ body: 'never  mind' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should not trigger cancel for "cancel my order"', async () => {
      const incoming = createIncomingMessage({ body: 'cancel my order' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('search_businesses'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are the results...',
      });

      const result = await router.handleMessage(incoming);

      // Should not call endSession
      expect(mockDeps.sessionManager.endSession).not.toHaveBeenCalled();
      // Should have classified the message
      expect(mockDeps.intentEngine.classify).toHaveBeenCalled();
    });

    it('should not trigger cancel for "cancellation policy"', async () => {
      const incoming = createIncomingMessage({ body: 'cancellation policy' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('help_onboarding'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here is our policy...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).not.toHaveBeenCalled();
      expect(mockDeps.intentEngine.classify).toHaveBeenCalled();
    });

    it('should trim whitespace before checking cancel command', async () => {
      const incoming = createIncomingMessage({ body: '  cancel  ' });
      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(result).toHaveLength(1);
    });

    it('should return cancel confirmation message', async () => {
      const incoming = createIncomingMessage({ body: 'cancel' });
      const result = await router.handleMessage(incoming);

      expect(result[0].body).toContain('Cancelled');
      expect(result[0].body).toContain('help');
    });
  });


  // ═══════════════════════════════════════════════════════════
  // handleMessage — Active Flow Routing TESTS
  // ═══════════════════════════════════════════════════════════

  describe('handleMessage — active flow routing', () => {
    it('should route to flowHandler.handleFlowStep when isInFlow returns true', async () => {
      const incoming = createIncomingMessage({ body: 'some response' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: '+12015550123',
        body: 'Next question?',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.isInFlow).toHaveBeenCalledWith('+12015550123');
      expect(mockDeps.flowHandler.handleFlowStep).toHaveBeenCalledWith(
        '+12015550123',
        'some response',
      );
      expect(result).toHaveLength(1);
      expect(result[0].body).toBe('Next question?');
    });

    it('should not call intentEngine.classify when in flow', async () => {
      const incoming = createIncomingMessage({ body: 'user response' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: '+12015550123',
        body: 'Thanks for that',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.intentEngine.classify).not.toHaveBeenCalled();
    });

    it('should not call responseBuilder.buildResponse when in flow', async () => {
      const incoming = createIncomingMessage({ body: 'user response' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: '+12015550123',
        body: 'Thanks for that',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).not.toHaveBeenCalled();
    });

    it('should return flowHandler response directly', async () => {
      const incoming = createIncomingMessage({ body: 'my business name' });
      const flowResponse: OutgoingWhatsAppMessage = {
        to: '+12015550123',
        body: 'What is the address?',
      };
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue(flowResponse);

      const result = await router.handleMessage(incoming);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(flowResponse);
    });

    it('should pass trimmed message text to flowHandler', async () => {
      const incoming = createIncomingMessage({ body: '  user input  ' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: '+12015550123',
        body: 'Next step',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.flowHandler.handleFlowStep).toHaveBeenCalledWith(
        '+12015550123',
        'user input',
      );
    });

    it('should work with multiple flow steps in sequence', async () => {
      const phone = '+12015550123';

      // First step in flow
      const incoming1 = createIncomingMessage({
        from: phone,
        body: 'restaurant name',
      });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: phone,
        body: 'What is the address?',
      });

      let result = await router.handleMessage(incoming1);
      expect(result[0].body).toBe('What is the address?');

      // Second step in flow
      const incoming2 = createIncomingMessage({
        from: phone,
        body: '123 Main St',
      });
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: phone,
        body: 'What is the category?',
      });

      result = await router.handleMessage(incoming2);
      expect(result[0].body).toBe('What is the category?');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // handleMessage — Intent Classification → Flow Intents TESTS
  // ═══════════════════════════════════════════════════════════

  describe('handleMessage — intent classification → flow intents', () => {
    it('should route submit_business intent to flowHandler.startFlow', async () => {
      const incoming = createIncomingMessage({ body: 'Add my restaurant' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('submit_business');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.flowHandler.startFlow.mockResolvedValue({
        to: '+12015550123',
        body: 'Great! What is your business name?',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.intentEngine.classify).toHaveBeenCalledWith('Add my restaurant');
      expect(mockDeps.flowHandler.startFlow).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('business name');
    });

    it('should route submit_deal intent to flowHandler.startFlow', async () => {
      const incoming = createIncomingMessage({ body: 'Post a deal' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('submit_deal');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.flowHandler.startFlow.mockResolvedValue({
        to: '+12015550123',
        body: 'What deal would you like to post?',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.flowHandler.startFlow).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
      expect(result[0].body).toContain('deal');
    });

    it('should route consultancy_rating intent to flowHandler.startFlow', async () => {
      const incoming = createIncomingMessage({ body: 'Rate a consultancy' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('consultancy_rating');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.flowHandler.startFlow.mockResolvedValue({
        to: '+12015550123',
        body: 'Which consultancy would you like to rate?',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.flowHandler.startFlow).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should not call responseBuilder.buildResponse for flow intents', async () => {
      const incoming = createIncomingMessage({ body: 'Add my restaurant' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('submit_business'),
      );
      mockDeps.flowHandler.startFlow.mockResolvedValue({
        to: '+12015550123',
        body: 'Start flow',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).not.toHaveBeenCalled();
    });

    it('should not call flowHandler for non-flow intents', async () => {
      const incoming = createIncomingMessage({ body: 'Find restaurants' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('search_businesses'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are restaurants...',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.flowHandler.startFlow).not.toHaveBeenCalled();
    });

    it('should return flowHandler.startFlow response for flow intents', async () => {
      const incoming = createIncomingMessage({ body: 'List my business' });
      const flowResponse: OutgoingWhatsAppMessage = {
        to: '+12015550123',
        body: 'Welcome to business submission!',
      };
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('submit_business'),
      );
      mockDeps.flowHandler.startFlow.mockResolvedValue(flowResponse);

      const result = await router.handleMessage(incoming);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(flowResponse);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // handleMessage — Intent Classification → Single-Turn Intents TESTS
  // ═══════════════════════════════════════════════════════════

  describe('handleMessage — intent classification → single-turn intents', () => {
    it('should route search_businesses intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'Find Indian restaurants' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('search_businesses');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are the restaurants...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('restaurants');
    });

    it('should route job_search intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'Find tech jobs' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('job_search');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are available jobs...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
      expect(result[0].body).toContain('jobs');
    });

    it('should route immigration_alert intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'Immigration updates' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('immigration_alert');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are the latest alerts...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should route deals_nearby intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'Show me deals' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('deals_nearby');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are nearby deals...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should route event_info intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'What events are happening?' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('event_info');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are upcoming events...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should route daily_digest intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'Daily digest' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('daily_digest');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Your daily digest...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should route help_onboarding intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'help' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('help_onboarding');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here is what I can do...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should route unknown intent to responseBuilder', async () => {
      const incoming = createIncomingMessage({ body: 'xyzabc' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('unknown');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Sorry, I did not understand that.',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
    });

    it('should not call flowHandler.startFlow for single-turn intents', async () => {
      const incoming = createIncomingMessage({ body: 'Find restaurants' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('search_businesses'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are results...',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.flowHandler.startFlow).not.toHaveBeenCalled();
    });

    it('should return responseBuilder response for single-turn intents', async () => {
      const incoming = createIncomingMessage({ body: 'Find restaurants' });
      const builderResponse: OutgoingWhatsAppMessage = {
        to: '+12015550123',
        body: 'Here are Indian restaurants in Dallas...',
      };
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('search_businesses'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue(builderResponse);

      const result = await router.handleMessage(incoming);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(builderResponse);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // handleMessage — Routing Priority TESTS
  // ═══════════════════════════════════════════════════════════

  describe('handleMessage — routing priority', () => {
    it('should prioritize cancel command over active flow', async () => {
      const incoming = createIncomingMessage({ body: 'cancel' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);

      await router.handleMessage(incoming);

      // Cancel should end the session, not continue the flow
      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(mockDeps.flowHandler.handleFlowStep).not.toHaveBeenCalled();
    });

    it('should prioritize cancel command over intent classification', async () => {
      const incoming = createIncomingMessage({ body: 'stop' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);

      await router.handleMessage(incoming);

      // Cancel should end session, not classify
      expect(mockDeps.sessionManager.endSession).toHaveBeenCalledWith('+12015550123');
      expect(mockDeps.intentEngine.classify).not.toHaveBeenCalled();
    });

    it('should prioritize active flow over intent classification', async () => {
      const incoming = createIncomingMessage({ body: 'user input' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: '+12015550123',
        body: 'Continue flow',
      });

      await router.handleMessage(incoming);

      // Flow should be prioritized over classification
      expect(mockDeps.flowHandler.handleFlowStep).toHaveBeenCalled();
      expect(mockDeps.intentEngine.classify).not.toHaveBeenCalled();
    });

    it('should check cancel before checking isInFlow', async () => {
      const incoming = createIncomingMessage({ body: 'quit' });
      // Even if we're in flow, cancel should be detected first
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);

      await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.endSession).toHaveBeenCalled();
      // isInFlow might not even be called or it doesn't matter
      // The important thing is cancel is handled first
    });

    it('should check isInFlow before classifying intent', async () => {
      const incoming = createIncomingMessage({ body: 'regular message' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(true);
      mockDeps.flowHandler.handleFlowStep.mockResolvedValue({
        to: '+12015550123',
        body: 'Flow response',
      });

      await router.handleMessage(incoming);

      // Flow should be checked and used before classifying
      expect(mockDeps.flowHandler.handleFlowStep).toHaveBeenCalled();
      expect(mockDeps.intentEngine.classify).not.toHaveBeenCalled();
    });

    it('should flow through the complete routing hierarchy: cancel > isInFlow > intent', async () => {
      // Test case where none of the higher priority conditions are met
      const incoming = createIncomingMessage({ body: 'search for restaurants' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('search_businesses');
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Results',
      });

      await router.handleMessage(incoming);

      // All three checks should have been attempted
      expect(mockDeps.sessionManager.isInFlow).toHaveBeenCalled();
      expect(mockDeps.intentEngine.classify).toHaveBeenCalled();
      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Additional Edge Cases and Integration Tests
  // ═══════════════════════════════════════════════════════════

  describe('handleMessage — edge cases and integration', () => {
    it('should handle empty message body', async () => {
      const incoming = createIncomingMessage({ body: '' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(makeClassification('unknown'));
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Please send a message',
      });

      const result = await router.handleMessage(incoming);

      expect(result).toHaveLength(1);
    });

    it('should pass correct user phone to all dependencies', async () => {
      const userPhone = '+19876543210';
      const incoming = createIncomingMessage({
        from: userPhone,
        body: 'test message',
      });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('help_onboarding'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: userPhone,
        body: 'Response',
      });

      await router.handleMessage(incoming);

      expect(mockDeps.sessionManager.isInFlow).toHaveBeenCalledWith(userPhone);
      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        userPhone,
        expect.objectContaining({ intent: 'help_onboarding' }),
      );
    });

    it('should classify with trimmed message text', async () => {
      const incoming = createIncomingMessage({ body: '   find restaurants   ' });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      mockDeps.intentEngine.classify.mockResolvedValue(
        makeClassification('search_businesses'),
      );
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Results',
      });

      await router.handleMessage(incoming);

      // Should classify with trimmed text
      expect(mockDeps.intentEngine.classify).toHaveBeenCalledWith('find restaurants');
    });

    it('should always return an array of messages', async () => {
      const incoming = createIncomingMessage({ body: 'cancel' });
      const result = await router.handleMessage(incoming);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle classification with entities', async () => {
      const incoming = createIncomingMessage({
        body: 'Find Indian restaurants in Dallas',
      });
      mockDeps.sessionManager.isInFlow.mockReturnValue(false);
      const classification = makeClassification('search_businesses', {
        category: 'restaurants',
        location: 'Dallas',
        cuisine: 'Indian',
      });
      mockDeps.intentEngine.classify.mockResolvedValue(classification);
      mockDeps.responseBuilder.buildResponse.mockResolvedValue({
        to: '+12015550123',
        body: 'Here are Indian restaurants in Dallas...',
      });

      const result = await router.handleMessage(incoming);

      expect(mockDeps.responseBuilder.buildResponse).toHaveBeenCalledWith(
        '+12015550123',
        classification,
      );
      expect(result).toHaveLength(1);
    });
  });
});
