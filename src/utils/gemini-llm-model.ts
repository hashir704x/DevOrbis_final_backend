import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set in the .env file");
}

export const LLM = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey: GOOGLE_API_KEY,
});
