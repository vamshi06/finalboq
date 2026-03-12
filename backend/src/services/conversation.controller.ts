import { Request, Response } from "express";
import conversationService from "./conversation.service";
import { getGeminiAnswer } from "../ai/gemini.service"; // adjust path if needed

// ✅ Add this formatter ABOVE your controllers (below imports is best)
function normalizeAiAnswer(raw: string): string {
  if (!raw) return "";

  let text = String(raw);

  // 1) Convert markdown bold (**text**) to HTML <strong> tags
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 2) Remove emojis (optional - commenting out to keep them)
  // text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "");
  // text = text.replace(/[■◆●▶👉✅📌🔳🔹⭐✨🏡📋🎯]/g, "");

  // 3) Put headings on new line: "Title: Something" -> "Title:\nSomething"
  text = text.replace(/:\s*(?=[A-Za-z])/g, ":\n");

  // 4) Convert inline bullets to new lines
  text = text.replace(/\s*•\s*/g, "\n• ");
  // If AI uses " - " inline, make it new line bullet (careful)
  text = text.replace(/\s+-\s+/g, "\n- ");

  // 5) Fix known sections (optional but helpful for your tile example)
  text = text.replace(
    /(Bathroom & Kitchen|Living Areas|Outdoor|Recommendation)/g,
    "\n\n$1"
  );

  // 6) Remove too many blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  // 7) Trim every line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

  return text;
}

export async function createConversation(req: Request, res: Response) {
  try {
    const { location, baseRatePerSqft } = req.body;

    const loc = typeof location === "string" ? location.trim() : "";
    const rate = Number(baseRatePerSqft);

    if (!loc || Number.isNaN(rate)) {
      return res.status(400).json({
        success: false,
        error:
          "Missing/invalid required fields: location (string), baseRatePerSqft (number)",
      });
    }

    const conversation = conversationService.createConversation(loc, rate);

    return res.json({
      success: true,
      conversationId: conversation.id,
    });
  } catch (error: any) {
    console.error("createConversation error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}

export async function addMessageToConversation(req: Request, res: Response) {
  try {
    const { conversationId, message } = req.body;

    const id = typeof conversationId === "string" ? conversationId.trim() : "";
    const msg = typeof message === "string" ? message.trim() : "";

    if (!id || (!msg && (typeof message !== "object" || message === null))) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: conversationId, message (string) OR message object { role, type, content }",
      });
    }

    /**
     * ✅ Store-only mode (used by BoqChat):
     * Frontend sends full message objects; we just persist them and DO NOT trigger an AI reply here.
     */
    if (typeof message === "object" && message !== null) {
      const role = message.role === "assistant" ? "assistant" : "user";
      const type = message.type === "boq" || message.type === "answer" ? message.type : "text";
      const content = message.content;

      conversationService.addTextMessage(id, role, type, content);
      return res.json({ success: true });
    }

    // ✅ 1) Store USER message first
    let conversation = conversationService.addTextMessage(
      id,
      "user",
      "text",
      msg
    );

    // ✅ 2) AI reply
    let aiReply: string | null = await getGeminiAnswer(msg);
    if (!aiReply) {
      aiReply =
        "I'm sorry, I couldn't generate a response right now. Please try again.";
    }

    // ✅ IMPORTANT: Normalize before saving + returning
    const cleanedReply = normalizeAiAnswer(aiReply);

    // Persist assistant message
    conversation = conversationService.addTextMessage(
      id,
      "assistant",
      "answer",
      cleanedReply
    );

    // Return only assistant answer and timestamp
    const lastAssistantMsg = conversation.messages
      .filter((m) => m.role === "assistant")
      .slice(-1)[0];

    const answerTs = lastAssistantMsg
      ? new Date(lastAssistantMsg.timestamp).toISOString()
      : new Date().toISOString();

    return res.json({
      success: true,
      answer: cleanedReply,
      timestamp: answerTs,
    });
  } catch (error: any) {
    console.error("addMessageToConversation error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}

export async function getConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const id = typeof conversationId === "string" ? conversationId.trim() : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing required param: conversationId",
      });
    }

    const conversation = conversationService.getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error("getConversation error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}

export async function getAllConversations(req: Request, res: Response) {
  try {
    const conversations = conversationService.getAllConversations();
    return res.json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    console.error("getAllConversations error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}

export async function updateConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const id = typeof conversationId === "string" ? conversationId.trim() : "";
    const { projectName } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing required param: conversationId",
      });
    }

    const updated = conversationService.updateConversation(id, {
      projectName: typeof projectName === "string" ? projectName : undefined,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,
      conversation: updated,
    });
  } catch (error: any) {
    console.error("updateConversation error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const id = typeof conversationId === "string" ? conversationId.trim() : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing required param: conversationId",
      });
    }

    const success = conversationService.deleteConversation(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,
      message: "Conversation deleted",
    });
  } catch (error: any) {
    console.error("deleteConversation error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}
