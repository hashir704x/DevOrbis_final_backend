import "dotenv/config";
import nodemailer from "nodemailer";
import { AppError } from "../errors/AppError.js";

if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
    throw new Error("EMAIL_ADDRESS or EMAIL_PASSWORD are not set in the .env file");
}

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function sendEmail(to: string, subject: string, text: string) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new AppError("Failed to send email. Problem at server side.", 503);
    }
}
