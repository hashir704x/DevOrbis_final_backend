import { Router } from "express";
import { handleVoiceChat } from "../controllers/vapi.controller.js";

const router = Router();
router.post("/llm/chat/completions", handleVoiceChat);

export default router;
