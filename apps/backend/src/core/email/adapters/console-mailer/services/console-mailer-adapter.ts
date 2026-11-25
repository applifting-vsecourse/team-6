import { EmailService } from '@/core/email/interfaces/email-service.interface';
import { Injectable, Logger } from '@nestjs/common';

// Fallback when no mail transport is configured (no RESEND_API_KEY and no SMTP_*). The e-mail is
// dropped: nothing about it is logged, not the recipient, the subject, the body or its links
// (story #177). The log only says that mail is not being sent, so a missing transport is noticed.
@Injectable()
export class ConsoleMailerAdapter implements EmailService {
  private readonly logger = new Logger(ConsoleMailerAdapter.name);

  sendEmail(): Promise<void> {
    this.logger.warn(
      'No mail transport configured (set RESEND_API_KEY or SMTP_HOST/USERNAME/PASSWORD): an e-mail was not sent.',
    );
    return Promise.resolve();
  }
}
