import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateLoginDto } from './dto/create.login.dto';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { UserRole } from '../user/user.enum';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpService } from './services/otp.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private static readonly DUMMY_HASH =
        '$2b$10$7EqJtq98hPqEX7fNZaFWoOHiXQf6S5yX8fGJ31h5XBrZEcD3xKPa2';
    private static readonly REGISTERABLE_ROLES = new Set<UserRole>([
        UserRole.SUPERVISOR,
        UserRole.SUB_ADMIN,
        UserRole.WORKER,
        UserRole.VENDOR,
    ]);

    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private otpService: OtpService) { }

    private normalizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }

    async validateUser(createuserDto: CreateLoginDto) {
        const normalizedEmail = this.normalizeEmail(createuserDto.email);
        const user = await this.userService.findByEmail(normalizedEmail);
        if (!user) {
            await bcrypt.compare(createuserDto.password, AuthService.DUMMY_HASH);
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordMatching = await bcrypt.compare(
            createuserDto.password,
            user.password
        );

        if (!isPasswordMatching) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role,
        };

        const { password, ...userWithoutPassword } = user.toObject();
        return {
            user: userWithoutPassword,
            access_token: this.jwtService.sign(payload),
        };
    }



    async register(createUserDto: CreateUserDto) {
        if (!createUserDto) {
            throw new BadRequestException('User data is required for registration');
        }

        if (!AuthService.REGISTERABLE_ROLES.has(createUserDto.role)) {
            throw new BadRequestException(
                'Only supervisor, sub admin, worker and vendor roles can be registered',
            );
        }

        createUserDto.email = this.normalizeEmail(createUserDto.email);
        const existingUser = await this.userService.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        createUserDto.password = hashedPassword;
        const user = await this.userService.createUser(createUserDto);

        return {
            user,
            message: 'User registered successfully',
            access_token: this.jwtService.sign({
                sub: user._id,
                email: user.email,
                role: user.role,
            }),
        };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const normalizedEmail = this.normalizeEmail(forgotPasswordDto.email);
        const user = await this.userService.findByEmail(normalizedEmail);
        if (user) {
            const otp = this.otpService.generateOtp();
            this.otpService.storeOtp(normalizedEmail, otp);
            try {
                await this.otpService.sendOtpEmail(normalizedEmail, otp);
            } catch (error) {
                this.otpService.deleteOtp(normalizedEmail);
                throw error;
            }
        }

        return {
            message: 'If an account with that email exists, an OTP has been sent',
        };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { otp, newPassword } = resetPasswordDto;
        const email = this.normalizeEmail(resetPasswordDto.email);

        // Verify OTP
        const isValidOtp = this.otpService.verifyOtp(email, otp);
        if (!isValidOtp) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // Find user
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await this.userService.updatePassword(email, hashedPassword);

        // Delete OTP after successful verification
        this.otpService.deleteOtp(email);

        return {
            message: 'Password reset successfully',
        };
    }
}
