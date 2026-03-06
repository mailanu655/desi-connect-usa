import { AuthService } from '../../../src/auth/auth-service';

describe('AuthService', () => {
  let authService;
  let mockUserRepository;
  let mockTokenService;
  let mockOtpService;
  let mockEmailService;

  beforeEach(() => {
    mockUserRepository = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      generateMagicLinkToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      verifyMagicLinkToken: jest.fn(),
      createSession: jest.fn(),
    };

    mockOtpService = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      validatePhoneFormat: jest.fn(),
    };

    mockEmailService = {
      sendMagicLink: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendIdentityLinkConfirmation: jest.fn(),
    };

    const deps = {
      userRepository: mockUserRepository,
      tokenService: mockTokenService,
      otpService: mockOtpService,
      emailService: mockEmailService,
    };

    authService = new AuthService(deps);
  });

  describe('authenticateWithGoogle', () => {
    const mockUser = {
      user_id: 'user-123',
      phone_number: null,
      email: 'test@example.com',
      display_name: 'Test User',
      identity_linked: false,
      preferred_channel: 'web',
      city: null,
      created_via: 'website',
      auth_provider: 'google',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      session_id: 'session-123',
      user_id: 'user-123',
      access_token: 'access-token-123',
      expires_at: '2024-01-02T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should create new user when email not found', async () => {
      const googlePayload = {
        google_id: 'google-id-123',
        email: 'new@example.com',
        name: 'New User',
      };

      mockUserRepository.list.mockResolvedValue({ data: [], total: 0 });
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.createSession.mockReturnValue(mockSession);

      const result = await authService.authenticateWithGoogle(googlePayload);

      expect(result.success).toBe(true);
      expect(result.is_new_user).toBe(true);
    });

    it('should return session with tokens', async () => {
      const googlePayload = {
        google_id: 'google-id-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserRepository.list.mockResolvedValue({ data: [mockUser], total: 1 });
      mockTokenService.createSession.mockReturnValue(mockSession);

      const result = await authService.authenticateWithGoogle(googlePayload);

      expect(result.session).toBeDefined();
      expect(result.session.access_token).toBe(mockSession.access_token);
    });

    it('should set created_via to website', async () => {
      const googlePayload = {
        google_id: 'google-id-123',
        email: 'new@example.com',
        name: 'New User',
      };

      mockUserRepository.list.mockResolvedValue({ data: [], total: 0 });
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.createSession.mockReturnValue(mockSession);

      await authService.authenticateWithGoogle(googlePayload);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          created_via: 'website',
        })
      );
    });
  });

  describe('sendMagicLink', () => {
    it('should generate token and send email', async () => {
      const email = 'test@example.com';
      const token = 'magic-token-123';

      mockTokenService.generateMagicLinkToken.mockReturnValue(token);
      mockEmailService.sendMagicLink.mockResolvedValue({ success: true });

      await authService.sendMagicLink(email);

      expect(mockTokenService.generateMagicLinkToken).toHaveBeenCalledWith(email);
      expect(mockEmailService.sendMagicLink).toHaveBeenCalledWith(email, token);
    });

    it('should return success message', async () => {
      mockTokenService.generateMagicLinkToken.mockReturnValue('token');
      mockEmailService.sendMagicLink.mockResolvedValue({ success: true });

      const result = await authService.sendMagicLink('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBeTruthy();
    });
  });

  describe('verifyMagicLink', () => {
    const mockUser = {
      user_id: 'user-123',
      phone_number: null,
      email: 'test@example.com',
      display_name: 'Test User',
      identity_linked: false,
      preferred_channel: 'web',
      city: null,
      created_via: 'website',
      auth_provider: 'email_magic_link',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      session_id: 'session-123',
      user_id: 'user-123',
      access_token: 'access-token-123',
      expires_at: '2024-01-02T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should create new user when email not found', async () => {
      const email = 'new@example.com';
      const token = 'magic-token-123';

      mockTokenService.verifyMagicLinkToken.mockReturnValue({ email });
      mockUserRepository.list.mockResolvedValue({ data: [], total: 0 });
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true });
      mockTokenService.createSession.mockReturnValue(mockSession);

      const result = await authService.verifyMagicLink(email, token);

      expect(result.success).toBe(true);
      expect(result.is_new_user).toBe(true);
    });

    it('should return existing user session', async () => {
      const email = 'existing@example.com';
      const token = 'magic-token-123';

      mockTokenService.verifyMagicLinkToken.mockReturnValue({ email });
      mockUserRepository.list.mockResolvedValue({ data: [mockUser], total: 1 });
      mockTokenService.createSession.mockReturnValue(mockSession);

      const result = await authService.verifyMagicLink(email, token);

      expect(result.success).toBe(true);
      expect(result.is_new_user).toBe(false);
    });

    it('should reject invalid token', async () => {
      mockTokenService.verifyMagicLinkToken.mockReturnValue(null);

      const result = await authService.verifyMagicLink('test@example.com', 'invalid-token');

      expect(result.success).toBe(false);
    });
  });

  describe('sendPhoneOtp', () => {
    it('should return verificationId', async () => {
      const phoneNumber = '+14155552671';
      const verificationId = 'VE123';

      mockOtpService.validatePhoneFormat.mockReturnValue(true);
      mockOtpService.sendOtp.mockResolvedValue({
        verificationId,
        success: true,
      });

      const result = await authService.sendPhoneOtp(phoneNumber);

      expect(result.verificationId).toBe(verificationId);
      expect(result.success).toBe(true);
    });
  });

  describe('verifyPhoneOtp', () => {
    const mockUser = {
      user_id: 'user-456',
      phone_number: '+14155552671',
      email: null,
      display_name: '+14155552671',
      identity_linked: false,
      preferred_channel: 'whatsapp',
      city: null,
      created_via: 'whatsapp',
      auth_provider: 'phone_otp',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      session_id: 'session-456',
      user_id: 'user-456',
      access_token: 'access-token-456',
      expires_at: '2024-01-02T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should create new user with phone', async () => {
      const phoneNumber = '+14155552671';

      mockOtpService.verifyOtp.mockResolvedValue({ valid: true });
      mockUserRepository.list.mockResolvedValue({ data: [], total: 0 });
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.createSession.mockReturnValue(mockSession);

      const result = await authService.verifyPhoneOtp(phoneNumber, '123456', 'VE123');

      expect(result.success).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      mockOtpService.verifyOtp.mockResolvedValue({ valid: false });

      const result = await authService.verifyPhoneOtp('+14155552671', '000000', 'VE123');

      expect(result.success).toBe(false);
    });
  });

  describe('completeIdentityLink', () => {
    const mockWebsiteUser = {
      user_id: 'user-web-123',
      phone_number: null,
      email: 'website@example.com',
      display_name: 'Website User',
      identity_linked: false,
      preferred_channel: 'web',
      city: null,
      created_via: 'website',
      auth_provider: 'email_magic_link',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should set identity_linked to true', async () => {
      const phoneNumber = '+14155552671';

      mockUserRepository.getById.mockResolvedValue(mockWebsiteUser);
      mockOtpService.verifyOtp.mockResolvedValue({ valid: true });
      mockUserRepository.list.mockResolvedValue({ data: [], total: 0 });
      mockUserRepository.update.mockResolvedValue({
        ...mockWebsiteUser,
        phone_number: phoneNumber,
        identity_linked: true,
      });
      mockEmailService.sendIdentityLinkConfirmation.mockResolvedValue({ success: true });

      const result = await authService.completeIdentityLink(
        mockWebsiteUser.user_id,
        phoneNumber,
        '123456',
        'VE123'
      );

      expect(result.success).toBe(true);
    });

    it('should fail with invalid OTP', async () => {
      mockUserRepository.getById.mockResolvedValue(mockWebsiteUser);
      mockOtpService.verifyOtp.mockResolvedValue({ valid: false });

      const result = await authService.completeIdentityLink(
        mockWebsiteUser.user_id,
        '+14155552671',
        '000000',
        'VE123'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('refreshSession', () => {
    const mockUser = {
      user_id: 'user-123',
      phone_number: null,
      email: 'test@example.com',
      display_name: 'Test User',
      identity_linked: false,
      preferred_channel: 'web',
      city: null,
      created_via: 'website',
      auth_provider: 'google',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockNewSession = {
      session_id: 'session-new-123',
      user_id: 'user-123',
      access_token: 'new-access-token-123',
      expires_at: '2024-01-02T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should return new session for valid refresh token', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue({ userId: mockUser.user_id });
      mockUserRepository.getById.mockResolvedValue(mockUser);
      mockTokenService.createSession.mockReturnValue(mockNewSession);

      const result = await authService.refreshSession('valid-refresh-token');

      expect(result.success).toBe(true);
      expect(result.session.access_token).toBe(mockNewSession.access_token);
    });

    it('should fail for invalid token', async () => {
      mockTokenService.verifyRefreshToken.mockReturnValue(null);

      const result = await authService.refreshSession('invalid-token');

      expect(result.success).toBe(false);
    });
  });

  describe('getSession', () => {
    const mockUser = {
      user_id: 'user-123',
      phone_number: null,
      email: 'test@example.com',
      display_name: 'Test User',
      identity_linked: false,
      preferred_channel: 'web',
      city: null,
      created_via: 'website',
      auth_provider: 'google',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should return session by id', async () => {
      mockTokenService.verifyAccessToken.mockReturnValue({ userId: mockUser.user_id });
      mockUserRepository.getById.mockResolvedValue(mockUser);

      const result = await authService.getSession('valid-access-token');

      expect(result).not.toBeNull();
      expect(result.user_id).toBe(mockUser.user_id);
    });

    it('should return null for invalid token', async () => {
      mockTokenService.verifyAccessToken.mockReturnValue(null);

      const result = await authService.getSession('invalid-token');

      expect(result).toBeNull();
    });
  });
});
