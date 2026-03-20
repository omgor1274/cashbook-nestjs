import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';

export class CreateLoginDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @IsNotEmpty()
    password: string;
}