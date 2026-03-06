import { TwilioWhatsAppClient, createTwilioClientFromEnv } from '../../../src/channels/twilio-whatsapp-client';

// ── Mock Fetch ──────────────────────────────────────────────

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function makeOkResponse(sid = 'SM1234567890abcdef') {
  return {
    ok: true,
    status: 201,
    json: async () => ({ sid }),
  };
}

function makeErrorResponse(status: number, body = 'Error') {
  return {
    ok: false,
    status,
    text: async () => body,
  };
}

// ── Helpers ─────────────────────────────────────────────────

const VALID_CONFIG = {
  accountSid: 'ACtest123',
  authToken: 'token_secret',
  fromNumber: '+14155238886',
};

function createClient(overrides: Record<string, unknown> = {}) {
  return new TwilioWhatsAppClient({
    ...VALID_CONFIG,
    maxRetries: 0,          // no retries by default in tests
    retryBaseDelayMs: 1,    // fast retries when enabled
    ...overrides,
  });
}

// ── Tests ───────────────────────────────────────────────────

describe('TwilioWhatsAppClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── Constructor ──────────────────────────────────────────

  describe('constructor', () => {
    it('should throw when accountSid is missing', () => {
      expect(
        () => new TwilioWhatsAppClient({ ...VALID_CONFIG, accountSid: '' }),
      ).toThrow('accountSid, authToken, and fromNumber are required');
    });

    it('should throw when authToken is missing', () => {
      expect(
        () => new TwilioWhatsAppClient({ ...VALID_CONFIG, authToken: '' }),
      ).toThrow('accountSid, authToken, and fromNumber are required');
    });

    it('should throw when fromNumber is missing', () => {
      expect(
        () => new TwilioWhatsAppClient({ ...VALID_CONFIG, fromNumber: '' }),
      ).toThrow('accountSid, authToken, and fromNumber are required');
    });

    it('should auto-prefix fromNumber with whatsapp:', () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());
      const client = createClient({ fromNumber: '+14155238886' });
      client.sendMessage('+14155551234', 'Hello');

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('From=whatsapp%3A%2B14155238886');
    });

    it('should not double-prefix whatsapp:', () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());
      const client = createClient({ fromNumber: 'whatsapp:+14155238886' });
      client.sendMessage('+14155551234', 'Hello');

      const body = mockFetch.mock.calls[0][1].body as string;
      // Should appear exactly once
      const matches = body.match(/whatsapp/g);
      // From + To = 2 occurrences of "whatsapp"
      expect(matches!.length).toBe(2);
    });
  });

  // ── sendMessage ──────────────────────────────────────────

  describe('sendMessage', () => {
    it('should send a text message and return success', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse('SMabc123'));

      const client = createClient();
      const result = await client.sendMessage('+14155551234', 'Hello!');

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SMabc123');
      expect(result.statusCode).toBe(201);
    });

    it('should POST to the correct Twilio Messages endpoint', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendMessage('+14155551234', 'Test');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe(
        'https://api.twilio.com/2010-04-01/Accounts/ACtest123/Messages.json',
      );
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    it('should include Basic auth header', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendMessage('+14155551234', 'Test');

      const auth = mockFetch.mock.calls[0][1].headers.Authorization;
      const expected = `Basic ${Buffer.from('ACtest123:token_secret').toString('base64')}`;
      expect(auth).toBe(expected);
    });

    it('should auto-prefix To number with whatsapp:', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendMessage('+14155551234', 'Test');

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('To=whatsapp%3A%2B14155551234');
    });

    it('should not double-prefix To number', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendMessage('whatsapp:+14155551234', 'Test');

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('To=whatsapp%3A%2B14155551234');
      // No double whatsapp:whatsapp:
      expect(body).not.toContain('whatsapp%3Awhatsapp');
    });

    it('should include StatusCallback when configured', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient({ statusCallbackUrl: 'https://example.com/status' });
      await client.sendMessage('+14155551234', 'Test');

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('StatusCallback=');
      expect(body).toContain(encodeURIComponent('https://example.com/status'));
    });

    it('should return error on non-retryable HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(400, 'Bad Request'));

      const client = createClient();
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
      expect(result.error).toContain('Bad Request');
      expect(result.statusCode).toBe(400);
    });

    it('should return error on network failure (no retries)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = createClient();
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  // ── sendMediaMessage ─────────────────────────────────────

  describe('sendMediaMessage', () => {
    it('should include MediaUrl parameters', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendMediaMessage('+14155551234', 'See photo', [
        { url: 'https://example.com/photo.jpg' },
        { url: 'https://example.com/doc.pdf' },
      ]);

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('MediaUrl0=');
      expect(body).toContain('MediaUrl1=');
      expect(body).toContain(encodeURIComponent('https://example.com/photo.jpg'));
      expect(body).toContain(encodeURIComponent('https://example.com/doc.pdf'));
    });

    it('should include Body text with media', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendMediaMessage('+14155551234', 'Caption', [
        { url: 'https://example.com/img.jpg' },
      ]);

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('Body=Caption');
    });
  });

  // ── sendTemplateMessage ──────────────────────────────────

  describe('sendTemplateMessage', () => {
    it('should include ContentSid parameter', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendTemplateMessage('+14155551234', 'HX1234abcd');

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('ContentSid=HX1234abcd');
    });

    it('should include ContentVariables when provided', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendTemplateMessage('+14155551234', 'HX1234abcd', {
        '1': 'John',
        '2': 'Tomorrow',
      });

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain('ContentVariables=');
      // Should be JSON-encoded
      const params = new URLSearchParams(body);
      const vars = JSON.parse(params.get('ContentVariables')!);
      expect(vars).toEqual({ '1': 'John', '2': 'Tomorrow' });
    });

    it('should not include ContentVariables when not provided', async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse());

      const client = createClient();
      await client.sendTemplateMessage('+14155551234', 'HX1234abcd');

      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).not.toContain('ContentVariables');
    });
  });

  // ── Retry logic ──────────────────────────────────────────

  describe('retry logic', () => {
    it('should retry on 429 and succeed', async () => {
      mockFetch
        .mockResolvedValueOnce(makeErrorResponse(429, 'Rate limited'))
        .mockResolvedValueOnce(makeOkResponse('SMretry1'));

      const client = createClient({ maxRetries: 2 });
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(true);
      expect(result.messageSid).toBe('SMretry1');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 500 and succeed', async () => {
      mockFetch
        .mockResolvedValueOnce(makeErrorResponse(500, 'Internal Server Error'))
        .mockResolvedValueOnce(makeOkResponse('SMretry2'));

      const client = createClient({ maxRetries: 2 });
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network error and succeed', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce(makeOkResponse());

      const client = createClient({ maxRetries: 2 });
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should exhaust retries and return error', async () => {
      mockFetch
        .mockResolvedValueOnce(makeErrorResponse(500, 'Error'))
        .mockResolvedValueOnce(makeErrorResponse(500, 'Error'))
        .mockResolvedValueOnce(makeErrorResponse(500, 'Error'));

      const client = createClient({ maxRetries: 2 });
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should NOT retry on 400 errors', async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(400, 'Bad Request'));

      const client = createClient({ maxRetries: 3 });
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on 401 errors', async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(401, 'Unauthorized'));

      const client = createClient({ maxRetries: 3 });
      const result = await client.sendMessage('+14155551234', 'Test');

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── healthCheck ──────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return true when Twilio API responds OK', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const client = createClient();
      expect(await client.healthCheck()).toBe(true);
    });

    it('should call the Account endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const client = createClient();
      await client.healthCheck();

      expect(mockFetch.mock.calls[0][0]).toBe(
        'https://api.twilio.com/2010-04-01/Accounts/ACtest123.json',
      );
    });

    it('should return false on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      const client = createClient();
      expect(await client.healthCheck()).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const client = createClient();
      expect(await client.healthCheck()).toBe(false);
    });
  });

  // ── createTwilioClientFromEnv ────────────────────────────

  describe('createTwilioClientFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return undefined when env vars are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_WHATSAPP_FROM;

      expect(createTwilioClientFromEnv()).toBeUndefined();
    });

    it('should return a client when all required env vars are set', () => {
      process.env.TWILIO_ACCOUNT_SID = 'ACfromenv';
      process.env.TWILIO_AUTH_TOKEN = 'token_env';
      process.env.TWILIO_WHATSAPP_FROM = '+14155550000';

      const client = createTwilioClientFromEnv();
      expect(client).toBeInstanceOf(TwilioWhatsAppClient);
    });

    it('should return undefined when only some vars are set', () => {
      process.env.TWILIO_ACCOUNT_SID = 'ACfromenv';
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_WHATSAPP_FROM;

      expect(createTwilioClientFromEnv()).toBeUndefined();
    });

    it('should pass optional env vars to the client', () => {
      process.env.TWILIO_ACCOUNT_SID = 'ACfromenv';
      process.env.TWILIO_AUTH_TOKEN = 'token_env';
      process.env.TWILIO_WHATSAPP_FROM = '+14155550000';
      process.env.TWILIO_STATUS_CALLBACK_URL = 'https://example.com/cb';
      process.env.TWILIO_TIMEOUT_MS = '5000';
      process.env.TWILIO_MAX_RETRIES = '5';

      const client = createTwilioClientFromEnv();
      expect(client).toBeInstanceOf(TwilioWhatsAppClient);
    });
  });
});
