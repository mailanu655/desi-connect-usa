/**
 * Email Service (Section 5.1 - Authentication)
 *
 * Manages email sending for magic links and identity linking confirmations.
 * Uses injected HTTP client interface for provider flexibility.
 * Supports Emailit or any HTTP-based email provider.
 */

/**
 * Configuration for email service
 */
export interface EmailServiceConfig {
  apiKey: string;
  fromEmail: string;
  appUrl: string;
}

/**
 * Generic HTTP client interface for email provider API calls
 * Allows integration with any email provider (Emailit, SendGrid, etc.)
 */
export interface HttpClient {
  post<T>(
    url: string,
    data: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<{ status: number; data: T }>;
}

/**
 * Email Service for sending authentication and notification emails
 */
export class EmailService {
  private readonly config: EmailServiceConfig;
  private readonly httpClient: HttpClient;

  constructor(config: EmailServiceConfig, httpClient: HttpClient) {
    this.config = config;
    this.httpClient = httpClient;
  }

  /**
   * Send magic link email for passwordless authentication
   *
   * @param email - Recipient email address
   * @param token - Magic link token
   * @returns Success status
   */
  async sendMagicLink(email: string, token: string): Promise<{ success: boolean }> {
    try {
      const magicLinkUrl = `${this.config.appUrl}/auth/magic-link/${token}`;
      const htmlBody = this.getMagicLinkHtml(email, magicLinkUrl);
      const textBody = this.getMagicLinkText(email, magicLinkUrl);

      const payload = {
        to: email,
        from: this.config.fromEmail,
        subject: 'Your Desi Connect USA Magic Link',
        html: htmlBody,
        text: textBody,
      };

      const response = await this.httpClient.post('/', payload, {
        Authorization: `Bearer ${this.config.apiKey}`,
      });

      return {
        success: response.status >= 200 && response.status < 300,
      };
    } catch (error: any) {
      console.error('Error sending magic link email:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Send welcome email to newly registered user
   *
   * @param email - Recipient email address
   * @param name - User's display name
   * @returns Success status
   */
  async sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean }> {
    try {
      const htmlBody = this.getWelcomeHtml(name);
      const textBody = this.getWelcomeText(name);

      const payload = {
        to: email,
        from: this.config.fromEmail,
        subject: 'Welcome to Desi Connect USA!',
        html: htmlBody,
        text: textBody,
      };

      const response = await this.httpClient.post('/', payload, {
        Authorization: `Bearer ${this.config.apiKey}`,
      });

      return {
        success: response.status >= 200 && response.status < 300,
      };
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Send identity linking confirmation email
   *
   * @param email - Recipient email address
   * @param phoneNumber - Phone number that was linked
   * @returns Success status
   */
  async sendIdentityLinkConfirmation(
    email: string,
    phoneNumber: string,
  ): Promise<{ success: boolean }> {
    try {
      const htmlBody = this.getIdentityLinkHtml(email, phoneNumber);
      const textBody = this.getIdentityLinkText(email, phoneNumber);

      const payload = {
        to: email,
        from: this.config.fromEmail,
        subject: 'Account Identity Linked - Desi Connect USA',
        html: htmlBody,
        text: textBody,
      };

      const response = await this.httpClient.post('/', payload, {
        Authorization: `Bearer ${this.config.apiKey}`,
      });

      return {
        success: response.status >= 200 && response.status < 300,
      };
    } catch (error: any) {
      console.error('Error sending identity link confirmation:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Generate HTML for magic link email
   */
  private getMagicLinkHtml(email: string, magicLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Sign In to Desi Connect USA</h1>
            <p>Hello ${this.escapeHtml(email)},</p>
            <p>Click the button below to sign in to your account:</p>
            <a href="${this.escapeHtml(magicLinkUrl)}" class="button">Sign In</a>
            <p>This link expires in 15 minutes.</p>
            <p>If you didn't request this link, you can safely ignore this email.</p>
            <div class="footer">
              <p>Desi Connect USA - Connecting the Indian diaspora in America</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text version for magic link email
   */
  private getMagicLinkText(email: string, magicLinkUrl: string): string {
    return `
Sign In to Desi Connect USA

Hello ${email},

Click the link below to sign in to your account:
${magicLinkUrl}

This link expires in 15 minutes.

If you didn't request this link, you can safely ignore this email.

Desi Connect USA - Connecting the Indian diaspora in America
    `;
  }

  /**
   * Generate HTML for welcome email
   */
  private getWelcomeHtml(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Desi Connect USA!</h1>
            <p>Hello ${this.escapeHtml(name)},</p>
            <p>Thank you for joining our community. We're excited to have you here!</p>
            <p>You can now:</p>
            <ul>
              <li>Search for Indian businesses and services in your area</li>
              <li>Find job opportunities in the diaspora community</li>
              <li>Discover deals and events</li>
              <li>Connect with immigration consultants</li>
            </ul>
            <a href="${this.config.appUrl}" class="button">Explore Desi Connect USA</a>
            <div class="footer">
              <p>Desi Connect USA - Connecting the Indian diaspora in America</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text version for welcome email
   */
  private getWelcomeText(name: string): string {
    return `
Welcome to Desi Connect USA!

Hello ${name},

Thank you for joining our community. We're excited to have you here!

You can now:
- Search for Indian businesses and services in your area
- Find job opportunities in the diaspora community
- Discover deals and events
- Connect with immigration consultants

Visit ${this.config.appUrl} to get started.

Desi Connect USA - Connecting the Indian diaspora in America
    `;
  }

  /**
   * Generate HTML for identity linking confirmation
   */
  private getIdentityLinkHtml(email: string, phoneNumber: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Account Identity Linked</h1>
            <p>Hello ${this.escapeHtml(email)},</p>
            <p>Your Desi Connect USA account has been successfully linked with phone number ${this.escapeHtml(phoneNumber)}.</p>
            <p>You can now use both your email and phone number to access your account.</p>
            <a href="${this.config.appUrl}" class="button">View Your Account</a>
            <p>If you didn't authorize this action, please contact our support team immediately.</p>
            <div class="footer">
              <p>Desi Connect USA - Connecting the Indian diaspora in America</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate text version for identity linking confirmation
   */
  private getIdentityLinkText(email: string, phoneNumber: string): string {
    return `
Account Identity Linked

Hello ${email},

Your Desi Connect USA account has been successfully linked with phone number ${phoneNumber}.

You can now use both your email and phone number to access your account.

Visit ${this.config.appUrl} to view your account.

If you didn't authorize this action, please contact our support team immediately.

Desi Connect USA - Connecting the Indian diaspora in America
    `;
  }

  /**
   * Escape HTML special characters for safe output
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}
