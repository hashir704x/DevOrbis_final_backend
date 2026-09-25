import { db } from "../drizzle/database-client.js";
import { otpCodes } from "../drizzle/schema.js";
import { AppError } from "../errors/AppError.js";
import { sendEmail } from "./mail.js";

export async function createAndSendOtp(userId: string, email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const createdOtp = await db
    .insert(otpCodes)
    .values({
      userId,
      otp,
    })
    .returning();

  const savedOtp = createdOtp[0];
  if (!savedOtp) {
    throw new AppError("Failed to create OTP, problem at server side", 500);
  }
  await sendEmail(
    email,
    "Verify your email address",
    `Hi from Agentic RAG Application,
        Thank you for signing up!
        To complete your registration, please use the following verification code:
        ${otp}
        `,
  );
}
