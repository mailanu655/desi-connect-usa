import { TokenService } from '../../../src/auth/token-service';

describe('TokenService', () => {
  let tokenService;
  let mockJwtProvider;

  beforeEach(() => {
    mockJwtProvider = {
      sign: jest.fn((payload, options) => {
        return `token_${JSON.stringify(payload).slice(0, 20)}_${options.expiresIn}`;
      }),
      verify: jest.fn(),
    };

    const config = {
      jwtSecret: 'test-secret-key',
      accessTokenExpiry: '1h',
      refreshTokenExpiry: '7d',
      magicLinkExpiry: '15m',
    };

    tokenService = new TokenService(config, mockJwtProvider);
  });

  describe('generateAccessToken', () => {
    it('should return a token string', () => {
      const userId = 'user-123';
      const token = tokenService.generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should call jwtProvider.sign with correct payload', () => {
      const userId = 'user-456';
      tokenService.generateAccessToken(userId);

      expect(mockJwtProvider.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'access',
        }),
        { expiresIn: '1h' }
      );
    });

    it('should use configured access token expiry', () => {
      tokenService.generateAccessToken('user-789');

      expect(mockJwtProvider.sign).toHaveBeenCalledWith(
        expect.any(Object),
        { expiresIn: '1h' }
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a token string', () => {
      const userId = 'user-123';
      const token = tokenService.generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should call jwtProvider.sign with correct payload', () => {
      const userId = 'user-456';
      tokenService.generateRefreshToken(userId);

      expect(mockJwtProvider.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'refresh',
        }),
        { expiresIn: '7d' }
      );
    });
  });

  describe('generateMagicLinkToken', () => {
    it('should return a token string', () => {
      const email = 'test@example.com';
      const token = tokenService.generateMagicLinkToken(email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should call jwtProvider.sign with correct payload', () => {
      const email = 'user@example.com';
      tokenService.generateMagicLinkToken(email);

      expect(mockJwtProvider.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          type: 'magic_link',
        }),
        { expiresIn: '15m' }
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should return userId for valid token', () => {
      const userId = 'user-123';
      mockJwtProvider.verify.mockReturnValue({
        userId,
        type: 'access',
        iat: 1234567890,
        exp: 1234571490,
      });

      const result = tokenService.verifyAccessToken('valid-token');

      expect(result).not.toBeNull();
      expect(result.userId).toBe(userId);
    });

    it('should return null for invalid token', () => {
      mockJwtProvider.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = tokenService.verifyAccessToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null if token type is not "access"', () => {
      mockJwtProvider.verify.mockReturnValue({
        userId: 'user-123',
        type: 'refresh',
        iat: 1234567890,
      });

      const result = tokenService.verifyAccessToken('wrong-type-token');

      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return userId for valid token', () => {
      const userId = 'user-456';
      mockJwtProvider.verify.mockReturnValue({
        userId,
        type: 'refresh',
        iat: 1234567890,
      });

      const result = tokenService.verifyRefreshToken('valid-refresh-token');

      expect(result).not.toBeNull();
      expect(result.userId).toBe(userId);
    });

    it('should return null for invalid token', () => {
      mockJwtProvider.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = tokenService.verifyRefreshToken('invalid-refresh-token');

      expect(result).toBeNull();
    });
  });

  describe('verifyMagicLinkToken', () => {
    it('should return email for valid token', () => {
      const email = 'test@example.com';
      mockJwtProvider.verify.mockReturnValue({
        email,
        type: 'magic_link',
        iat: 1234567890,
      });

      const result = tokenService.verifyMagicLinkToken('valid-magic-link-token');

      expect(result).not.toBeNull();
      expect(result.email).toBe(email);
    });

    it('should return null for invalid token', () => {
      mockJwtProvider.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = tokenService.verifyMagicLinkToken('invalid-magic-link-token');

      expect(result).toBeNull();
    });
  });

  describe('createSession', () => {
    it('should return session with all required fields', () => {
      mockJwtProvider.sign.mockReturnValue('mock-token');

      const session = tokenService.createSession('user-123');

      expect(session).toBeDefined();
      expect(session.session_id).toBeDefined();
      expect(session.user_id).toBe('user-123');
      expect(session.access_token).toBeDefined();
      expect(session.refresh_token).toBeDefined();
      expect(session.expires_at).toBeDefined();
      expect(session.created_at).toBeDefined();
    });

    it('should use provided userId', () => {
      mockJwtProvider.sign.mockReturnValue('mock-token');

      const session = tokenService.createSession('specific-user-id');

      expect(session.user_id).toBe('specific-user-id');
    });

    it('should have expires_at in the future', () => {
      mockJwtProvider.sign.mockReturnValue('mock-token');

      const session = tokenService.createSession('user-123');
      const expiresAt = new Date(session.expires_at);
      const now = new Date();

      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
