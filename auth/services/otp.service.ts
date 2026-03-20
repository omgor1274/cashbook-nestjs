import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface OtpRecord {
    otp: string;
    expiresAt: Date;
}

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);
    private readonly otpStore: Map<string, OtpRecord> = new Map();
    private readonly transporter: nodemailer.Transporter | null;
    private readonly fromEmail: string | null;

    constructor(private readonly configService: ConfigService) {
        const user = this.getFirstConfigValue([
            'OTP_EMAIL_USER',
            'EMAIL_SERVICE',
            'EMAIL_USER',
            'MAIL_USER',
            'SMTP_USER',
            'EMAIL',
        ]);
        const pass = this.getFirstConfigValue([
            'OTP_EMAIL_APP_PASSWORD',
            'OTP_EMAIL_PASSWORD',
            'EMAIL_APP_PASSWORD',
            'EMAIL_PASSWORD',
            'MAIL_PASSWORD',
            'SMTP_PASS',
            'APP_PASSWORD',
            'PASSWORD',
        ]);
        const service = this.getFirstConfigValue(['OTP_EMAIL_SERVICE']) ?? 'gmail';

        this.fromEmail =
            this.getFirstConfigValue(['OTP_EMAIL_FROM', 'MAIL_FROM']) ?? user ?? null;

        if (!user || !pass) {
            this.transporter = null;
            this.logger.warn(
                'OTP email service is not configured. Set OTP_EMAIL_USER and OTP_EMAIL_APP_PASSWORD in environment variables.',
            );
            return;
        }

        this.transporter = nodemailer.createTransport({
            service,
            auth: { user, pass },
        });
    }

    private sanitizeConfigValue(value: string): string | undefined {
        const cleaned = value.trim().replace(/^['"]|['"]$/g, '');
        return cleaned.length > 0 ? cleaned : undefined;
    }

    private getFirstConfigValue(keys: string[]): string | undefined {
        for (const key of keys) {
            const value = this.configService.get<string>(key);
            if (value) {
                const sanitized = this.sanitizeConfigValue(value);
                if (sanitized) {
                    return sanitized;
                }
            }
        }
        return undefined;
    }

    /**
     * Generate a random 6-digit OTP
     */
    generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Store OTP for an email with 10-minute expiration
     */
    storeOtp(email: string, otp: string): void {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes
        this.otpStore.set(email, { otp, expiresAt });

        // Auto-delete after expiration to prevent memory leaks
        setTimeout(() => {
            const record = this.otpStore.get(email);
            if (record && record.otp === otp) {
                this.otpStore.delete(email);
            }
        }, 10 * 60 * 1000); // 10 minutes
    }

    async sendOtpEmail(email: string, otp: string): Promise<void> {
        if (!this.transporter || !this.fromEmail) {
            throw new InternalServerErrorException('OTP email service is not configured');
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
                html: `<p>Your OTP for password reset is <strong>${otp}</strong>.</p><p>This OTP expires in 10 minutes.</p>`,
            });
            this.logger.log(`OTP email sent to ${email}. Message ID: ${info.messageId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown email error';
            this.logger.error(`Failed to send OTP email to ${email}: ${message}`);
            throw new InternalServerErrorException(
                'Failed to send OTP email. Please try again.',
            );
        }
    }

    /**
     * Verify OTP for an email
     */
    verifyOtp(email: string, otp: string): boolean {
        const record = this.otpStore.get(email);

        if (!record) {
            return false;
        }

        if (new Date() > record.expiresAt) {
            this.otpStore.delete(email);
            return false;
        }

        if (record.otp !== otp) {
            return false;
        }

        return true;
    }

    /**
     * Delete OTP after successful verification
     */
    deleteOtp(email: string): void {
        this.otpStore.delete(email);
    }

    /**
     * Get OTP for an email (for testing purposes - remove in production)
     */
    getOtp(email: string): string | null {
        return this.otpStore.get(email)?.otp ?? null;
    }
}
