import { EmailService } from '../../../src/auth/email-service';

describe('EmailService', () => {
  let emailService;
  let mockHttpClient;

  beforeEach(() => {
    const config = {
      apiKey: 'test-api-key-123',
      fromEmail: 'noreply@desiconnectusa.com',
      appUrl: 'https://app.desiconnectusa.com',
    };

    mockHttpClient = {
      post: jest.fn(),
    };

    emailService = new EmailService(config, mockHttpClient);
  });

  describe('sendMagicLink', () => {
    it('should call httpClient with correct URL', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      await emailService.sendMagicLink('test@example.com', 'magic-token-123');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should construct magic link URL correctly', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      const token = 'test-magic-token-xyz';
      await emailService.sendMagicLink('test@example.com', token);

      const callArgs = mockHttpClient.post.mock.calls[0];
      const payload = callArgs[1];

      expect(payload.html).toContain(`/auth/magic-link/${token}`);
      expect(payload.text).toContain(`/auth/magic-link/${token}`);
    });

    it('should return success:true on successful send', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      const result = await emailService.sendMagicLink('test@example.com', 'token');

      expect(result.success).toBe(true);
    });

    it('should return success:false on error', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      const result = await emailService.sendMagicLink('test@example.com', 'token');

      expect(result.success).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should call httpClient.post', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      await emailService.sendWelcomeEmail('test@example.com', 'John Doe');

      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should set recipient email', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      const email = 'user@example.com';
      await emailService.sendWelcomeEmail(email, 'Jane Doe');

      const callArgs = mockHttpClient.post.mock.calls[0];
      const payload = callArgs[1];

      expect(payload.to).toBe(email);
    });

    it('should return success:true on 2xx status', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      const result = await emailService.sendWelcomeEmail('test@example.com', 'John');

      expect(result.success).toBe(true);
    });
  });

  describe('sendIdentityLinkConfirmation', () => {
    it('should call httpClient.post', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      await emailService.sendIdentityLinkConfirmation('test@example.com', '+14155552671');

      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should include phone number in email', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      const phoneNumber = '+919876543210';
      await emailService.sendIdentityLinkConfirmation('test@example.com', phoneNumber);

      const callArgs = mockHttpClient.post.mock.calls[0];
      const payload = callArgs[1];

      expect(payload.html).toContain(phoneNumber);
      expect(payload.text).toContain(phoneNumber);
    });

    it('should return success:true on 2xx status', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {} });

      const result = await emailService.sendIdentityLinkConfirmation('test@example.com', '+14155552671');

      expect(result.success).toBe(true);
    });
  });
});
