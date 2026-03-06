/**
 * OTP Service (Section 5.1 - Authentication)
 *
 * Manages phone verification via Twilio Verify API.
 * Supports both WhatsApp and SMS phone authentication flows.
 * Uses injected Twilio client interface for testability.
 */

/**
 * Configuration for Twilio Verify service
 */
export interface OtpServiceConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioVerifyServiceSid: string;
}

/**
 * Twilio Verify API interface - to be injected for testability
 * Allows mocking and testing without actual Twilio dependency
 */
export interface TwilioVerifyClient {
  /**
   * Send OTP to a phone number
   * @param phoneNumber - E.164 format phone number (e.g., +14155552671)
   * @returns verification SID to track this verification attempt
   */
  sendOtp(phoneNumber: string): Promise<{ sid: string; status: string }>;

  /**
   * Verify an OTP code sent to a phone number
   * @param phoneNumber - E.164 format phone number
   * @param code - 6-digit OTP code
   * @param sid - Verification SID from sendOtp call
   * @returns success status
   */
  verifyOtp(phoneNumber: string, code: string, sid: string): Promise<{ valid: boolean; status: string }>;
}

/**
 * OTP Service using Twilio Verify for phone verification
 */
export class OtpService {
  private readonly config: OtpServiceConfig;
  private readonly twilioClient: TwilioVerifyClient;

  constructor(config: OtpServiceConfig, twilioClient: TwilioVerifyClient) {
    this.config = config;
    this.twilioClient = twilioClient;
  }

  /**
   * Send OTP to a phone number via Twilio Verify
   * The phone number should be in E.164 format (e.g., +1234567890)
   *
   * @param phoneNumber - Phone number in E.164 format
   * @returns Object with verification ID and success status
   */
  async sendOtp(phoneNumber: string): Promise<{ verificationId: string; success: boolean }> {
    try {
      const result = await this.twilioClient.sendOtp(phoneNumber);

      return {
        verificationId: result.sid,
        success: result.status === 'pending',
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        verificationId: '',
        success: false,
      };
    }
  }

  /**
   * Verify an OTP code sent to a phone number
   * Uses the verification SID returned from sendOtp
   *
   * @param phoneNumber - Phone number in E.164 format
   * @param code - 6-digit OTP code
   * @param verificationId - Verification SID from sendOtp call
   * @returns Object with validity status
   */
  async verifyOtp(
    phoneNumber: string,
    code: string,
    verificationId: string,
  ): Promise<{ valid: boolean }> {
    try {
      const result = await this.twilioClient.verifyOtp(phoneNumber, code, verificationId);

      return {
        valid: result.status === 'approved',
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        valid: false,
      };
    }
  }

  /**
   * Validate phone number format (E.164)
   * Used to ensure phone numbers are properly formatted before OTP send
   *
   * @param phoneNumber - Phone number to validate
   * @returns true if phone number is valid E.164 format
   */
  validatePhoneFormat(phoneNumber: string): boolean {
    // E.164 format: +[1-9]{1}[0-9]{1,14}
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}
