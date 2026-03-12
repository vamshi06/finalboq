"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BoqResult } from "../ui/BoqResult";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");
// const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://boq-generator-pcqh.onrender.com/api").replace(/\/$/, "");

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  type: "text" | "boq" | "answer";
  content: any;
  timestamp: string | Date;
};

type Conversation = {
  id: string;
  location: string;
  baseRatePerSqft: number;
  messages: ConversationMessage[];
  createdAt: string | Date;
  updatedAt: string | Date;
  projectName?: string;
};

export default function MyProjectsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedBoq, setSelectedBoq] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const getLatestBoqFromConversation = (conv: Conversation) => {
    const msgs = Array.isArray(conv.messages) ? conv.messages : [];
    const boqs = msgs.filter((m) => m.type === "boq");
    return boqs.length > 0 ? boqs[boqs.length - 1].content : null;
  };

  const defaultName = (conv: Conversation) =>
    conv.projectName?.trim() || `${conv.location || "Project"} - ${conv.id.slice(-8)}`;

  const projects = useMemo(() => {
    return conversations.map((conv) => {
      const boq = getLatestBoqFromConversation(conv);
      const areaSqft = boq?.meta?.areaSqft;
      const grandTotal = boq?.topazSummary?.grandTotal ?? boq?.summary?.grandTotal ?? boq?.meta?.grandTotal;
      const updatedAt = conv.updatedAt ? new Date(conv.updatedAt as any) : new Date();
      return {
        id: conv.id,
        name: defaultName(conv),
        area: areaSqft ? `${areaSqft} sqft` : "N/A",
        cost: typeof grandTotal === "number" ? `₹${Math.round(grandTotal).toLocaleString("en-IN")}` : "N/A",
        date: updatedAt,
        status: boq ? "Completed" : "In Progress",
        conversation: conv,
        boq,
      };
    });
  }, [conversations]);

  const toggleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditName = (project: { id: string; name: string }) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const saveEditName = async () => {
    if (!editingId || editingName.trim() === "") {
      setEditingId(null);
      setEditingName("");
      return;
    }
    const name = editingName.trim();
    setEditingId(null);
    setEditingName("");
    try {
      const res = await fetch(`${BACKEND}/api/conversations/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: name }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setConversations((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, projectName: name, updatedAt: new Date() } : c))
      );
    } catch {
      alert("Failed to update project name");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ok = confirm(`Delete ${selectedIds.size} selected project(s)? This cannot be undone.`);
    if (!ok) return;
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        const res = await fetch(`${BACKEND}/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
      }
      setConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch {
      alert("Failed to delete some projects");
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingProjects(true);
      try {
        const res = await fetch(`${BACKEND}/api/conversations`, { method: "GET" });
        const data = await res.json();
        const list: Conversation[] = data?.conversations || [];
        if (!cancelled) setConversations(list);
      } catch (e) {
        console.error("Failed to load conversations", e);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function downloadBoq(boq: any, type: "excel" | "pdf", filenameBase: string) {
    const endpoint = type === "excel" ? "/api/boq/export/excel" : "/api/boq/export/pdf";
    const res = await fetch(`${BACKEND}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boq),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "excel" ? `${filenameBase}.xlsx` : `${filenameBase}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(conversationId: string) {
    const ok = confirm("Delete this project? This will remove the saved BOQ/conversation.");
    if (!ok) return;
    try {
      const res = await fetch(`${BACKEND}/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    } catch (e) {
      alert("Failed to delete project");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Projects</h1>
          <p className="text-slate-600 mt-2">View and manage all your BOQ projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {projects.filter((p) => p.status === "In Progress").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {projects.filter((p) => p.status === "Completed").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹2.08Cr</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-slate-900">All Projects</h2>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Delete selected ({selectedIds.size})
                </button>
              )}
              <Link
                href="/estimation"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                + New Project
              </Link>
            </div>
          </div>

          {loadingProjects && <div className="p-6 text-sm text-slate-600">Loading projects...</div>}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={projects.length > 0 && selectedIds.size === projects.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Select all</span>
                    </label>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id)}
                        onChange={() => toggleSelect(project.id)}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {editingId === project.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditName();
                              if (e.key === "Escape") {
                                setEditingId(null);
                                setEditingName("");
                              }
                            }}
                            onBlur={saveEditName}
                            className="flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="font-medium text-slate-900">{project.name}</span>
                          <button
                            type="button"
                            onClick={() => startEditName(project)}
                            className="p-1 text-slate-400 hover:text-orange-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit name"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{project.area}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{project.cost}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(project.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          project.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {/* View */}
                        <button
                          className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-40"
                          disabled={!project.boq}
                          onClick={() => setSelectedBoq(project.boq)}
                          title={project.boq ? "View BOQ" : "No BOQ available"}
                          type="button"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* ✅ Download EXCEL */}
                        <button
                          className="p-2 text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                          disabled={!project.boq}
                          onClick={() => project.boq && downloadBoq(project.boq, "excel", project.name)}
                          title={project.boq ? "Download BOQ (Excel)" : "No BOQ available"}
                          type="button"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => handleDelete(project.conversation.id)}
                          title="Delete project"
                          type="button"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOQ Modal */}
        {selectedBoq && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="font-semibold text-xl">BOQ Details</h2>
                <button
                  onClick={() => setSelectedBoq(null)}
                  className="text-slate-500 hover:text-slate-900 text-2xl font-bold"
                  type="button"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <BoqResult boq={selectedBoq} onDownload={(t) => downloadBoq(selectedBoq, t, "boq")} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
