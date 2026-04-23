import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');

    if (!host) {
      // Development: auto-create Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.logger.log(`Dev mail: using Ethereal account ${testAccount.user}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendInvite(payload: {
    to: string;
    inviterName: string;
    message?: string;
    acceptUrl?: string;
  }): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'https://kanban-app-full-stack.vercel.app');
    const fromName = this.config.get<string>('SMTP_FROM_NAME', 'Kanban Flow');
    const fromAddr = this.config.get<string>('SMTP_FROM', 'no-reply@kanbanflow.app');

    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: payload.to,
      subject: `${payload.inviterName} invited you to Kanban Flow`,
      html: this.buildInviteHtml({ ...payload, appUrl }),
      text: this.buildInviteText({ ...payload, appUrl }),
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      this.logger.log(`Invite preview URL → ${preview}`);
    } else {
      this.logger.log(`Invite sent to ${payload.to} (messageId: ${info.messageId})`);
    }
  }

  private buildInviteHtml(p: { to: string; inviterName: string; message?: string; appUrl: string; acceptUrl?: string }) {
    const msgBlock = p.message
      ? `<div style="margin:24px 0;padding:16px 20px;background:#1a1f2e;border-left:3px solid #6366f1;border-radius:4px;color:#a5b4fc;font-size:14px;line-height:1.6;">${p.message}</div>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;max-width:560px;">
        <!-- Header -->
        <tr><td style="background:#6366f1;padding:32px 40px;text-align:center;">
          <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">&#9783; Kanban Flow</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;color:#e2e8f0;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;">You're invited!</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
            <strong style="color:#e2e8f0;">${p.inviterName}</strong> has invited you to collaborate on Kanban Flow.
          </p>
          ${msgBlock}
          <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6;">
            Kanban Flow helps teams organize work visually — drag and drop tasks, track progress, and ship faster together.
          </p>
          <div style="text-align:center;">
            <a href="${p.acceptUrl || `${p.appUrl}/register?email=${encodeURIComponent(p.to)}`}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">
              Accept Invitation
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">
            This invitation was sent to <a href="mailto:${p.to}" style="color:#6366f1;">${p.to}</a>.
            If you weren't expecting this, you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildInviteText(p: { to: string; inviterName: string; message?: string; appUrl: string; acceptUrl?: string }) {
    const msg = p.message ? `\n"${p.message}"\n` : '';
    const inviteUrl = p.acceptUrl || `${p.appUrl}/register?email=${encodeURIComponent(p.to)}`;
    return `You're invited to Kanban Flow!\n\n${p.inviterName} has invited you to collaborate.\n${msg}\nAccept your invitation: ${inviteUrl}\n\nIf you weren't expecting this, ignore this email.`;
  }
}
