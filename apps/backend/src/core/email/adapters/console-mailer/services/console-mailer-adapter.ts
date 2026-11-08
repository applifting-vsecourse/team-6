import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConsoleMailerAdapter implements EmailService {
  private readonly logger = new Logger(ConsoleMailerAdapter.name);

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        '[ConsoleMailer] No external email transport configured in production (Resend / SMTP). Logging email body to console for link recovery.',
      );
    }

    this.logger.log(`
      ====== Email Sent ======
      To: ${to}
      Subject: ${subject}
      html:
      ${html}
      ========================
    `);
  }
}
