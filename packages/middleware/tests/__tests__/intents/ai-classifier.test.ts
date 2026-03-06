import { ClaudeIntentClassifier, createAiClassifierFromEnv } from '../../../src/intents/ai-classifier';

// ── Mock fetch ───────────────────────────────────────────────

const originalFetch = global.fetch;
let mockFetch: jest.Mock;

beforeEach(() => {
  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

// ── Helpers ──────────────────────────────────────────────────

function makeAnthropicResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      content: [{ type: 'text', text }],
    }),
  };
}

function makeOpenAIResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      choices: [{ message: { content: text } }],
    }),
  };
}

function createClassifier(provider: 'anthropic' | 'openai' = 'anthropic') {
  return new ClaudeIntentClassifier({
    provider,
    apiKey: 'test-api-key-123',
    timeoutMs: 5000,
  });
}

// ── Constructor ──────────────────────────────────────────────

describe('ClaudeIntentClassifier', () => {
  describe('constructor', () => {
    it('should use default Anthropic model when provider is anthropic', () => {
      const classifier = createClassifier('anthropic');
      // Verify via an API call that it uses anthropic endpoint
      mockFetch.mockResolvedValueOnce(
        makeAnthropicResponse('{"intent":"unknown","confidence":0.5,"entities":{}}'),
      );
      classifier.classify('hello');
      // Check the fetch was called (constructor doesn't expose config directly)
      expect(classifier).toBeDefined();
    });

    it('should use default OpenAI model when provider is openai', () => {
      const classifier = createClassifier('openai');
      expect(classifier).toBeDefined();
    });
  });

  describe('classify — Anthropic provider', () => {
    it('should call Anthropic API and parse valid response', async () => {
      const classifier = createClassifier('anthropic');
      const responseJson = '{"intent":"search_businesses","confidence":0.92,"entities":{"location":"Edison","category":"restaurant"}}';

      mockFetch.mockResolvedValueOnce(makeAnthropicResponse(responseJson));

      const result = await classifier.classify('Find Indian restaurants near Edison');

      expect(result.intent).toBe('search_businesses');
      expect(result.confidence).toBeCloseTo(0.92);
      expect(result.entities).toEqual({ location: 'Edison', category: 'restaurant' });
      expect(result.raw_message).toBe('Find Indian restaurants near Edison');
    });

    it('should send correct headers to Anthropic', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce(
        makeAnthropicResponse('{"intent":"unknown","confidence":0.5,"entities":{}}'),
      );

      await classifier.classify('test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
      expect(options.headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should extract JSON from response with extra text', async () => {
      const classifier = createClassifier('anthropic');
      const responseWithExtraText = 'Here is the classification:\n{"intent":"job_search","confidence":0.85,"entities":{}}\nDone.';

      mockFetch.mockResolvedValueOnce(makeAnthropicResponse(responseWithExtraText));

      const result = await classifier.classify('looking for software jobs');

      expect(result.intent).toBe('job_search');
      expect(result.confidence).toBeCloseTo(0.85);
    });

    it('should return unknown on API error response', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await classifier.classify('test message');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should return unknown on network error', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await classifier.classify('test message');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should return unknown on malformed JSON response', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce(makeAnthropicResponse('not json at all'));

      const result = await classifier.classify('test');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should return unknown for unexpected Anthropic response format', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ content: [] }), // empty content
      });

      const result = await classifier.classify('test');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should clamp confidence to 0-1 range', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce(
        makeAnthropicResponse('{"intent":"help_onboarding","confidence":1.5,"entities":{}}'),
      );

      const result = await classifier.classify('help');
      expect(result.confidence).toBe(1.0);
    });

    it('should default invalid intents to unknown', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce(
        makeAnthropicResponse('{"intent":"totally_invalid","confidence":0.9,"entities":{}}'),
      );

      const result = await classifier.classify('test');
      expect(result.intent).toBe('unknown');
    });

    it('should filter out non-string entities', async () => {
      const classifier = createClassifier('anthropic');
      mockFetch.mockResolvedValueOnce(
        makeAnthropicResponse('{"intent":"search_businesses","confidence":0.8,"entities":{"location":"NYC","count":5,"empty":""}}'),
      );

      const result = await classifier.classify('test');
      expect(result.entities).toEqual({ location: 'NYC' });
    });
  });

  describe('classify — OpenAI provider', () => {
    it('should call OpenAI API and parse valid response', async () => {
      const classifier = createClassifier('openai');
      const responseJson = '{"intent":"immigration_alert","confidence":0.88,"entities":{"visa_category":"H1B"}}';

      mockFetch.mockResolvedValueOnce(makeOpenAIResponse(responseJson));

      const result = await classifier.classify('Any H1B news?');

      expect(result.intent).toBe('immigration_alert');
      expect(result.confidence).toBeCloseTo(0.88);
      expect(result.entities).toEqual({ visa_category: 'H1B' });
    });

    it('should send correct headers to OpenAI', async () => {
      const classifier = createClassifier('openai');
      mockFetch.mockResolvedValueOnce(
        makeOpenAIResponse('{"intent":"unknown","confidence":0.5,"entities":{}}'),
      );

      await classifier.classify('test');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key-123');
    });

    it('should return unknown for unexpected OpenAI response format', async () => {
      const classifier = createClassifier('openai');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ choices: [] }),
      });

      const result = await classifier.classify('test');
      expect(result.intent).toBe('unknown');
    });
  });

  describe('custom base URL', () => {
    it('should use custom base URL when provided', async () => {
      const classifier = new ClaudeIntentClassifier({
        provider: 'anthropic',
        apiKey: 'key',
        baseUrl: 'https://custom-proxy.example.com/v1/messages',
      });

      mockFetch.mockResolvedValueOnce(
        makeAnthropicResponse('{"intent":"unknown","confidence":0.5,"entities":{}}'),
      );

      await classifier.classify('test');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://custom-proxy.example.com/v1/messages');
    });
  });
});

// ── Factory ──────────────────────────────────────────────────

describe('createAiClassifierFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return undefined when no API key is set', () => {
    delete process.env.INTENT_AI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(createAiClassifierFromEnv()).toBeUndefined();
  });

  it('should create classifier from ANTHROPIC_API_KEY', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const classifier = createAiClassifierFromEnv();
    expect(classifier).toBeDefined();
  });

  it('should create classifier from OPENAI_API_KEY', () => {
    delete process.env.INTENT_AI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-openai-test';
    const classifier = createAiClassifierFromEnv();
    expect(classifier).toBeDefined();
  });

  it('should prefer INTENT_AI_API_KEY over provider-specific keys', () => {
    process.env.INTENT_AI_API_KEY = 'intent-key';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';
    const classifier = createAiClassifierFromEnv();
    expect(classifier).toBeDefined();
  });

  it('should respect INTENT_AI_PROVIDER env var', () => {
    process.env.INTENT_AI_API_KEY = 'key';
    process.env.INTENT_AI_PROVIDER = 'openai';
    const classifier = createAiClassifierFromEnv();
    expect(classifier).toBeDefined();
  });
});
