import { OtpService } from '../../../src/auth/otp-service';

describe('OtpService', () => {
  let otpService;
  let mockTwilioClient;

  beforeEach(() => {
    const config = {
      twilioAccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      twilioAuthToken: 'auth-token-123',
      twilioVerifyServiceSid: 'VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    };

    mockTwilioClient = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };

    otpService = new OtpService(config, mockTwilioClient);
  });

  describe('sendOtp', () => {
    it('should return verificationId on successful OTP send', async () => {
      const phoneNumber = '+14155552671';
      const verificationSid = 'VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      mockTwilioClient.sendOtp.mockResolvedValue({
        sid: verificationSid,
        status: 'pending',
      });

      const result = await otpService.sendOtp(phoneNumber);

      expect(result.verificationId).toBe(verificationSid);
      expect(result.success).toBe(true);
    });

    it('should return success:false on Twilio error', async () => {
      mockTwilioClient.sendOtp.mockRejectedValue(
        new Error('Twilio API error')
      );

      const result = await otpService.sendOtp('+14155552671');

      expect(result.success).toBe(false);
      expect(result.verificationId).toBe('');
    });
  });

  describe('verifyOtp', () => {
    it('should return valid:true for correct code', async () => {
      mockTwilioClient.verifyOtp.mockResolvedValue({
        status: 'approved',
        valid: true,
      });

      const result = await otpService.verifyOtp(
        '+14155552671',
        '123456',
        'VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      );

      expect(result.valid).toBe(true);
    });

    it('should return valid:false for wrong code', async () => {
      mockTwilioClient.verifyOtp.mockResolvedValue({
        status: 'failed',
        valid: false,
      });

      const result = await otpService.verifyOtp(
        '+14155552671',
        '000000',
        'VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      );

      expect(result.valid).toBe(false);
    });

    it('should handle Twilio errors gracefully', async () => {
      mockTwilioClient.verifyOtp.mockRejectedValue(
        new Error('Verification not found')
      );

      const result = await otpService.verifyOtp(
        '+14155552671',
        '123456',
        'VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('validatePhoneFormat', () => {
    it('should accept valid E.164 format', () => {
      const validNumbers = [
        '+14155552671',  // USA
        '+447911123456', // UK
        '+919876543210', // India
      ];

      validNumbers.forEach((phone) => {
        expect(otpService.validatePhoneFormat(phone)).toBe(true);
      });
    });

    it('should reject invalid E.164 format', () => {
      const invalidNumbers = [
        '14155552671',         // Missing +
        '+0155552671',         // Invalid country code (leading 0)
        '+1' + '2'.repeat(15), // Too many digits
        'abc+14155552671',     // Contains letters
        '+1-415-555-2671',     // Contains dashes
        '+1 (415) 555-2671',   // Contains spaces
        '',                    // Empty
        '+',                   // Just plus
      ];

      invalidNumbers.forEach((phone) => {
        expect(otpService.validatePhoneFormat(phone)).toBe(false);
      });
    });
  });
});
