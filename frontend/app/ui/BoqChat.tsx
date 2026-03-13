"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { BoqResult } from "./BoqResult";

// ✅ Safe backend URL: no trailing slash; localhost must use http (not https)
function getBackendUrl(): string {
  let url = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://boq-generator-pcqh.onrender.com").trim().replace(/\/$/, "");
  if (url.startsWith("https://localhost") || url.startsWith("https://127.0.0.1")) {
    url = url.replace("https://", "http://");
  }
  return url;
}
const BACKEND = getBackendUrl();

type Message = {
  id: string;
  role: "user" | "assistant";
  type: "text" | "boq" | "answer";
  content: any;
  timestamp: Date;
};

const LOCATIONS = ["BKC, Bandra", "Wadala", "Andheri", "Powai", "Dadar", "Navi Mumbai", "Pune"];

/** ✅ fetch with timeout */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

/** ✅ Safe read JSON (also returns raw text) */
async function safeReadJson(res: Response) {
  const raw = await res.text();
  try {
    return { ok: true, data: JSON.parse(raw), raw };
  } catch {
    return { ok: false, data: null, raw };
  }
}

export default function BoqChat({
  onFirstResult,
  location,
  onLocationChange,
}: {
  onFirstResult: () => void;
  location: string;
  onLocationChange: (location: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [baseRatePerSqft, setBaseRatePerSqft] = useState<number>(3618);
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentBoq, setCurrentBoq] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);

  // Location detect UI
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationHint, setLocationHint] = useState("");

  const onDrop = (acceptedFiles: File[]) => setFiles((p) => [...p, ...acceptedFiles]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 10,
    accept: undefined,
  });

  const LOCATION_RATES: Record<string, number> = {
    "BKC, Bandra": 6113,
    Wadala: 3618,
    Andheri: 4200,
    Powai: 5500,
    Dadar: 4800,
    "Navi Mumbai": 3200,
    Pune: 2800,
  };

  function handleLocationChange(newLocation: string) {
    onLocationChange(newLocation);
    setBaseRatePerSqft(LOCATION_RATES[newLocation] || 3618);
  }

  const getFileIcon = (fileType: string, fileName: string): string => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet") || fileType === "text/csv") return "📊";
    if (fileType === "application/json") return "📋";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("video")) return "🎬";
    if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "📊";
    if (["json"].includes(ext || "")) return "📋";
    return "📎";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filePreviews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        type: f.type,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        icon: getFileIcon(f.type, f.name),
        size: f.size,
        sizeFormatted: formatFileSize(f.size),
      })),
    [files]
  );

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [filePreviews]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          type: "text",
          content:
            '👋 Hi! I\'m your BOQ assistant.\n\n✨ To get started, simply say:\n• "I need BOQ" or "I need an estimate"\n\nI\'ll guide you through a few questions to create an accurate BOQ with AI-powered suggestions!\n\nOr feel free to ask any interior design questions. 🏡',
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderTextContent(content: any) {
    if (typeof content === "string") return content;
    if (content?.error) return String(content.error);
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }

  async function initializeConversation(): Promise<string | null> {
    if (conversationId) return conversationId;

    try {
      const res = await fetchWithTimeout(
        `${BACKEND}/api/conversations/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, baseRatePerSqft }),
        },
        20000
      );

      const parsed = await safeReadJson(res);

      if (!res.ok) {
        throw new Error(parsed.ok ? parsed.data?.error || "Failed to create conversation" : parsed.raw || "Failed");
      }

      if (parsed.ok && parsed.data?.conversationId) {
        setConversationId(parsed.data.conversationId);
        return parsed.data.conversationId as string;
      }

      return null;
    } catch (e) {
      console.error("[BoqChat] create conversation failed:", e);
      return null;
    }
  }

  async function saveMessageToDatabase(convId: string, message: Message) {
    try {
      await fetch(`${BACKEND}/api/conversations/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message }),
      });
    } catch (error) {
      console.error("[BoqChat] save msg failed:", error);
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      setFiles((p) => [...p, file]);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function sendMessage() {
    // ✅ prevent double click
    if (loading) return;

    const trimmed = prompt.trim();

    // ✅ nothing to send
    if (!trimmed && files.length === 0) return;

    // ✅ if file-only => send default message so backend won't reject
    const effectivePrompt = trimmed || (files.length > 0 ? "Please analyze the attached file(s) and respond." : "");

    const attachedFileNames = files.map((f) => f.name).filter(Boolean);
    const attachmentsLine = attachedFileNames.length ? `Attached file(s): ${attachedFileNames.join(", ")}` : "";
    const promptForDisplay = [effectivePrompt, attachmentsLine].filter(Boolean).join("\n\n");

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      type: "text",
      content: promptForDisplay,
      timestamp: new Date(),
    };

    const thinkingId = `thinking-${Date.now()}`;
    const thinkingMessage: Message = {
      id: thinkingId,
      role: "assistant",
      type: "text",
      content: "⏳ Working on it...",
      timestamp: new Date(),
    };

    // Show user message and "Working on it..." first, then try to create conversation
    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setLoading(true);
    onFirstResult();

    const convId = await initializeConversation();
    if (!convId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? {
                id: m.id,
                role: "assistant" as const,
                type: "text" as const,
                content: `❌ Could not start conversation. Check that the backend is running at ${BACKEND} and try again.`,
                timestamp: new Date(),
              }
            : m
        )
      );
      setLoading(false);
      return;
    }

    await saveMessageToDatabase(convId, userMessage);

    try {
      const formData = new FormData();
      formData.append("message", effectivePrompt); // ✅ NEVER EMPTY NOW
      formData.append("location", location);
      formData.append("baseRatePerSqft", String(baseRatePerSqft));
      formData.append("conversationId", convId);
      files.forEach((f) => formData.append("files", f));

      // ✅ debug: ensure message exists
      console.log("[BoqChat] FormData keys:", Array.from(formData.keys()));
      console.log("[BoqChat] message value:", effectivePrompt);

      const res = await fetchWithTimeout(`${BACKEND}/api/boq/chat`, { method: "POST", body: formData }, 60000);
      const parsed = await safeReadJson(res);

      if (!res.ok) {
        throw new Error(parsed.ok ? parsed.data?.error || `HTTP ${res.status}` : parsed.raw || `HTTP ${res.status}`);
      }

      const data = parsed.ok ? parsed.data : null;
      if (!data) throw new Error("Backend returned non-JSON response.");

      let assistantMessage: Message;

      if (data.type === "boq") {
        setCurrentBoq(data.data);
        assistantMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          type: "boq",
          content: data.data,
          timestamp: new Date(),
        };
      } else {
        // Backend can return type "text" (e.g. { message, state }) or type "answer" (e.g. { answer, question })
        const payload = data.data ?? data;
        const textContent =
          typeof payload === "string"
            ? payload
            : payload?.answer ?? payload?.message ?? (payload && typeof payload === "object" ? String(payload.message ?? payload.answer ?? "") : "");
        assistantMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          type: "answer",
          content: typeof payload === "object" && (payload?.answer != null || payload?.message != null) ? { answer: textContent } : textContent,
          timestamp: new Date(),
        };
      }

      setMessages((prev) => prev.map((m) => (m.id === thinkingId ? assistantMessage : m)));
      await saveMessageToDatabase(convId, assistantMessage);

      setPrompt("");
      setFiles([]);
    } catch (e: any) {
      const isNetwork =
        e?.name === "AbortError" ||
        e?.message?.includes("fetch") ||
        e?.message?.includes("Failed to fetch") ||
        e?.message?.includes("NetworkError");
      const hint = isNetwork
        ? "\n\nIf deployed on Render: set NEXT_PUBLIC_BACKEND_URL to your backend URL and ensure backend has GEMINI_API_KEY set."
        : "";
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        type: "text",
        content: `❌ Send failed: ${e?.message || "Unknown error"}${hint}\nBackend: ${BACKEND}`,
        timestamp: new Date(),
      };
      setMessages((prev) => prev.map((m) => (m.id === thinkingId ? errorMessage : m)));
      await saveMessageToDatabase(convId, errorMessage);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 80);
    }
  }

  async function download(type: "excel" | "pdf") {
    if (!currentBoq) return;

    const endpoint = type === "excel" ? "/api/boq/export/excel" : "/api/boq/export/pdf";
    const res = await fetch(`${BACKEND}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentBoq),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "excel" ? "boq.xlsx" : "boq.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 flex flex-col h-screen md:h-[520px] w-full">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-slate-50" />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 border-b border-slate-200 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                🤖
              </div>
            )}

            <div
              className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm transition-colors ${
                msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-slate-100 text-slate-900 rounded-bl-none"
              }`}
            >
              {msg.type === "text" && <div className="text-sm leading-relaxed whitespace-pre-line">{renderTextContent(msg.content)}</div>}

              {msg.type === "answer" && (
                <div className="text-sm space-y-2">
                  <div className="font-semibold text-xs text-slate-600 mb-1">Answer:</div>
                  <div
                    className="leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html:
                        (typeof msg.content === "object" && msg.content !== null && (msg.content as any).answer) ||
                        (typeof msg.content === "object" && msg.content !== null && (msg.content as any).message) ||
                        (typeof msg.content === "string" ? msg.content : renderTextContent(msg.content)),
                    }}
                  />
                </div>
              )}

              {msg.type === "boq" && (
                <div className="text-sm space-y-2">
                  <div className="font-semibold text-blue-600 mb-2">✅ BOQ Generated</div>
                  <button
                    onClick={() => setCurrentBoq(msg.content)}
                    className="w-full rounded px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors text-xs"
                    type="button"
                  >
                    View & Edit BOQ
                  </button>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm">
                👤
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-slate-50 mt-auto">
        <div className="flex flex-col gap-3 bg-white rounded-lg p-3 ring-1 ring-slate-200 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px";
            }}
            placeholder="Ask anything... (example: generate BOQ 2BHK 900 sqft)"
            className="min-h-[44px] max-h-[120px] w-full resize-none bg-transparent text-sm outline-none placeholder-slate-400 font-medium"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
              {filePreviews.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs hover:bg-slate-200 transition-colors"
                  title={`${p.name} (${p.sizeFormatted})`}
                >
                  {p.url ? <img src={p.url} alt="" className="h-6 w-6 rounded object-cover" /> : <span className="text-base">{p.icon}</span>}
                  <span className="max-w-[120px] sm:max-w-[180px] truncate">{p.name}</span>
                  <button
                    className="text-slate-500 hover:text-red-500 transition-colors font-bold"
                    onClick={() => {
                      if (p.url) URL.revokeObjectURL(p.url);
                      setFiles((prev) => prev.filter((f) => f.name !== p.name));
                    }}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
            <div
              {...getRootProps()}
              className="cursor-pointer rounded-lg bg-slate-200 hover:bg-slate-300 px-3 py-2 text-xs ring-1 ring-slate-300 hover:ring-slate-400 font-semibold transition-all"
            >
              <input {...getInputProps()} />
              📎 Attach
            </div>

            <button
              onClick={recording ? stopRecording : startRecording}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ring-1 ${
                recording ? "bg-red-500 text-white hover:bg-red-600 ring-red-400" : "bg-slate-200 hover:bg-slate-300 ring-slate-300 hover:ring-slate-400"
              }`}
              type="button"
            >
              {recording ? "🛑 Stop" : "🎙️ Voice"}
            </button>

            <button
              disabled={loading || (!prompt.trim() && files.length === 0)}
              onClick={sendMessage}
              className="ml-auto rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed transition-all ring-1 ring-blue-400 disabled:ring-slate-300"
              type="button"
            >
              {loading ? "⏳ Thinking..." : "📤 Send"}
            </button>
          </div>
        </div>
      </div>

      {/* BOQ Modal */}
      {currentBoq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="font-semibold text-xl">BOQ Details - View & Edit</h2>
              <button onClick={() => setCurrentBoq(null)} className="text-slate-500 hover:text-slate-900 text-2xl font-bold" type="button">
                ✕
              </button>
            </div>
            <div className="p-4">
              <BoqResult boq={currentBoq} onDownload={download} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
