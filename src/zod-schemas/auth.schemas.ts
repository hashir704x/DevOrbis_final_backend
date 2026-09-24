import { z } from "zod";

export const signupSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.email(),
    password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
    email: z.email("Please enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password is required"),
});

export const resendOtpSchema = z.object({
    email: z.email("Please enter a valid email address"),
});
