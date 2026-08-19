import { z } from "zod";
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_PER_REQUEST,
} from "@product-reviews/contracts";

const conversationRoleSchema = z.enum(["user", "ava"]);

const conversationMessageSchema = z.object({
  id: z.string().trim().min(1).max(128),
  role: conversationRoleSchema,
  content: z.string().max(MAX_MESSAGE_LENGTH),
  createdAt: z.string().trim().min(1).max(64),
  status: z.enum(["complete", "pending", "error"]).optional(),
  structuredContent: z.array(z.unknown()).optional(),
  sources: z.array(z.unknown()).optional(),
  followUps: z.array(z.string().max(MAX_MESSAGE_LENGTH)).max(5).optional(),
});

export const conversationRequestSchema = z.object({
  brandId: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "brandId must be lowercase letters, numbers, or hyphens"),
  sessionId: z.string().trim().min(1).max(128),
  messages: z
    .array(conversationMessageSchema)
    .min(1)
    .max(MAX_MESSAGES_PER_REQUEST),
});

export type ConversationRequestBody = z.infer<typeof conversationRequestSchema>;
