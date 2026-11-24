import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { redactEmails } from '@/shared/logging/redact';
import { Injectable, Logger } from '@nestjs/common';

const LINK = /https?:\/\/[^\s"'<>]+/g;

/** The links in an email body, which is all the console mailer needs to show to be useful. */
const linksIn = (html: string): string[] =>
  (html.match(LINK) ?? []).map(redactEmails);

// Development / no-transport fallback. It logs the subject and the links, never the recipient or
// the body: those carry the user's e-mail address and name (story #177).
@Injectable()
export class ConsoleMailerAdapter implements EmailService {
  private readonly logger = new Logger(ConsoleMailerAdapter.name);

  async sendEmail(_to: string, subject: string, html: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        '[ConsoleMailer] No external email transport configured in production (Resend / SMTP). Logging email links to console for link recovery.',
      );
    }

    this.logger.log(`
      ====== Email Sent ======
      Subject: ${subject}
      Links:
      ${linksIn(html).join('\n      ')}
      ========================
    `);
  }
}
