import express from "express";
import {
  createConversation,
  addMessageToConversation,
  getConversation,
  getAllConversations,
  updateConversation,
  deleteConversation,
} from "../services/conversation.controller";

const router = express.Router();

// Create new conversation
router.post("/create", createConversation);

// Add message to conversation
router.post("/message", addMessageToConversation);

// Get conversation by ID
router.get("/:conversationId", getConversation);

// Get all conversations
router.get("/", getAllConversations);

// Update conversation (e.g. project name)
router.patch("/:conversationId", updateConversation);

// Delete conversation
router.delete("/:conversationId", deleteConversation);

export default router;