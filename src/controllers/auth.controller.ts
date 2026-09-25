import type { Request, Response } from "express";
import {
  loginSchema,
  resendOtpSchema,
  signupSchema,
  verifyEmailSchema,
} from "../zod-schemas/auth.schemas.js";
import { db } from "../drizzle/database-client.js";
import { users, otpCodes } from "../drizzle/schema.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AppError } from "../errors/AppError.js";
import { eq } from "drizzle-orm";
import { createToken } from "../utils/jwt.js";
import bcrypt from "bcrypt";
import { createAndSendOtp } from "../utils/createAndSendOtp.js";
import type { JwtPayload } from "../types/types.js";

export async function signup(req: Request, res: Response) {
  const validatedData = signupSchema.parse(req.body);
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);
  const user = await db
    .insert(users)
    .values({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
    })
    .returning();

  const createdUser = user[0];
  if (!createdUser) {
    console.log("createdUser is empty");
    throw new AppError("Failed to create user, problem at server side", 500);
  }
  await createAndSendOtp(createdUser.id, createdUser.email);
  const response = new ApiResponse(true, "User created successfully", null);
  return res.status(201).json(response);
}

export async function getCurrentUser(req: Request, res: Response) {
  const userData = req.userData as JwtPayload;
  const userId = userData.userId;

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return res.status(404).json(new ApiResponse(false, "User not found", null));
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "Current user fetched successfully", user));
}

export async function verifyEmail(req: Request, res: Response) {
  const { email, otp } = verifyEmailSchema.parse(req.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }
  const [otpRecord] = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.userId, user.id))
    .limit(1);
  if (!otpRecord) {
    throw new AppError("OTP not found", 400);
  }
  if (otpRecord.otp !== otp) {
    throw new AppError("Invalid OTP", 400);
  }
  await db
    .update(users)
    .set({
      isVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  await db.delete(otpCodes).where(eq(otpCodes.userId, user.id));
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  const token = createToken(user.id, user.role);
  res.cookie("agentic_rag_access_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 2 * 24 * 60 * 60 * 1000,
  });
  return res
    .status(200)
    .json(new ApiResponse(true, "Email verified successfully", userData));
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }
  if (!user.isVerified) {
    await db.delete(otpCodes).where(eq(otpCodes.userId, user.id));
    await createAndSendOtp(user.id, user.email);
    return res.status(200).json(
      new ApiResponse(true, "Email verification required", {
        email: user.email,
        requiresVerification: true,
      }),
    );
  }
  const token = createToken(user.id, user.role);
  res.cookie("agentic_rag_access_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 2 * 24 * 60 * 60 * 1000,
  });
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  return res.status(200).json(new ApiResponse(true, "Login successful", userData));
}

export async function resendOtp(req: Request, res: Response) {
  const { email } = resendOtpSchema.parse(req.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }
  await db.delete(otpCodes).where(eq(otpCodes.userId, user.id));
  await createAndSendOtp(user.id, user.email);
  return res
    .status(200)
    .json(new ApiResponse(true, "A new OTP has been sent to your email", null));
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("agentic_rag_access_token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(true, "Logged out successfully", null));
}
