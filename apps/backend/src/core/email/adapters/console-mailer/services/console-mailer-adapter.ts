import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConsoleMailerAdapter implements EmailService {
  private readonly logger = new Logger(ConsoleMailerAdapter.name);

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';
    const maskedTo = to.replace(/^([^@]{1,2})[^@]*(@.*)$/, '$1***$2');

    if (isProd) {
      // In production / shared environments, never log raw PII, tokens, or HTML bodies.
      this.logger.log(
        `[EmailService] Simulated email to ${maskedTo} (Subject: "${subject}") [body redacted for privacy]`,
      );
      return;
    }

    // In local development, preserve full HTML so developers can click/copy
    // magic links and verification tokens from their terminal output.
    this.logger.debug(`
      ====== Email Sent (Local Dev Simulation) ======
      To: ${maskedTo}
      Subject: ${subject}
      html:
      ${html}
      ===============================================
    `);
  }
}
