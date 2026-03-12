import fs from "fs";
import path from "path";
import crypto from "crypto";

export type MessageRole = "user" | "assistant";
export type MessageType = "text" | "boq" | "answer";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: any;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  location: string;
  baseRatePerSqft: number;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectName?: string;
}

function toDateSafe(value: any): Date {
  // JSON parse gives string for dates
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function normalizeConversation(raw: any): Conversation {
  return {
    id: String(raw.id),
    location: String(raw.location),
    baseRatePerSqft: Number(raw.baseRatePerSqft),
    messages: Array.isArray(raw.messages)
      ? raw.messages.map((m: any) => ({
          id: String(m.id),
          role: m.role === "assistant" ? "assistant" : "user",
          type: m.type === "boq" || m.type === "answer" ? m.type : "text",
          content: m.content,
          timestamp: toDateSafe(m.timestamp),
        }))
      : [],
    createdAt: toDateSafe(raw.createdAt),
    updatedAt: toDateSafe(raw.updatedAt),
    projectName: raw.projectName != null ? String(raw.projectName).trim() || undefined : undefined,
  };
}

class ConversationService {
  private dataDir: string;

  constructor() {
    /**
     * ✅ Robust path handling:
     * If you run from backend/ => dataDir = backend/data/conversations
     * If you run from project root => dataDir = backend/data/conversations
     */
    const cwd = process.cwd();

    const candidate1 = path.join(cwd, "data", "conversations"); // running inside backend/
    const candidate2 = path.join(cwd, "backend", "data", "conversations"); // running from root

    this.dataDir = fs.existsSync(path.join(cwd, "data")) ? candidate1 : candidate2;

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Generate unique conversation ID
  generateConversationId(): string {
    return `conv-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
  }

  // Generate unique message ID
  generateMessageId(): string {
    return `msg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }

  // Create new conversation
  createConversation(location: string, baseRatePerSqft: number): Conversation {
    const conversation: Conversation = {
      id: this.generateConversationId(),
      location,
      baseRatePerSqft,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.saveConversation(conversation);
    return conversation;
  }

  /**
   * ✅ Recommended method for controllers:
   * Adds a text/boq/answer message with auto id + timestamp.
   */
  addTextMessage(
    conversationId: string,
    role: MessageRole,
    type: MessageType,
    content: any
  ): Conversation {
    const message: ConversationMessage = {
      id: this.generateMessageId(),
      role,
      type,
      content,
      timestamp: new Date(),
    };

    return this.addMessage(conversationId, message);
  }

  // Add message to conversation (expects full message object)
  addMessage(conversationId: string, message: ConversationMessage): Conversation {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.messages.push({
      ...message,
      // ensure timestamp is Date even if caller passed string
      timestamp: toDateSafe(message.timestamp),
    });

    conversation.updatedAt = new Date();
    this.saveConversation(conversation);
    return conversation;
  }

  // Get conversation by ID
  getConversation(conversationId: string): Conversation | null {
    try {
      const filePath = path.join(this.dataDir, `${conversationId}.json`);
      if (!fs.existsSync(filePath)) return null;

      const data = fs.readFileSync(filePath, "utf-8");
      const raw = JSON.parse(data);
      return normalizeConversation(raw);
    } catch (error) {
      console.error(`Error reading conversation ${conversationId}:`, error);
      return null;
    }
  }

  // Get all conversations
  getAllConversations(): Conversation[] {
    try {
      const files = fs.readdirSync(this.dataDir);
      const conversations: Conversation[] = [];

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filePath = path.join(this.dataDir, file);
        const data = fs.readFileSync(filePath, "utf-8");
        const raw = JSON.parse(data);

        conversations.push(normalizeConversation(raw));
      }

      return conversations.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch (error) {
      console.error("Error reading conversations:", error);
      return [];
    }
  }

  // Save conversation to file (safer write)
  private saveConversation(conversation: Conversation): void {
    try {
      const filePath = path.join(this.dataDir, `${conversation.id}.json`);
      const tmpPath = `${filePath}.tmp`;

      fs.writeFileSync(tmpPath, JSON.stringify(conversation, null, 2), "utf-8");
      fs.renameSync(tmpPath, filePath);
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }

  // Update conversation (e.g. project name)
  updateConversation(conversationId: string, updates: { projectName?: string }): Conversation | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;
    if (updates.projectName !== undefined) {
      conversation.projectName = updates.projectName.trim() ? updates.projectName.trim() : undefined;
    }
    conversation.updatedAt = new Date();
    this.saveConversation(conversation);
    return conversation;
  }

  // Delete conversation
  deleteConversation(conversationId: string): boolean {
    try {
      const filePath = path.join(this.dataDir, `${conversationId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
  }
}

export default new ConversationService();
