"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Tab = "account" | "security" | "notifications" | "preferences" | "danger";

export default function SettingsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // ✅ Hooks at top level
  const [tab, setTab] = useState<Tab>("account");

  // Example UI state (replace with backend values)
  const [fullName, setFullName] = useState(session?.user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState(session?.user?.user_metadata?.phone || "");

  const [twoFA, setTwoFA] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifyInApp, setNotifyInApp] = useState(true);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [defaultLocation, setDefaultLocation] = useState("Wadala");

  const tabs = useMemo(
    () => [
      { key: "account" as const, label: "Account" },
      { key: "security" as const, label: "Security" },
      { key: "notifications" as const, label: "Notifications" },
      { key: "preferences" as const, label: "Preferences" },
      { key: "danger" as const, label: "Danger Zone" },
    ],
    []
  );

  // ✅ Redirect in effect
  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  // Sync local state when session changes (after save)
  useEffect(() => {
    if (!session?.user) return;
    setFullName(session.user.user_metadata?.full_name || "");
    setEmail(session.user.email || "");
    setPhone(session.user.user_metadata?.phone || "");
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  // Handlers (connect backend later)
  const saveAccount = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        // Email updates may require confirmation depending on Supabase settings
        email: email || undefined,
        data: {
          full_name: fullName,
          phone,
        },
      });
      if (error) throw error;
      await supabase.auth.getSession();
      alert("Account updated successfully!");
    } catch (error: any) {
      alert(error?.message || "Failed to update account");
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return alert("Please fill all password fields.");
    if (newPassword !== confirmPassword) return alert("New password and confirm password do not match.");

    try {
      // Supabase doesn't verify current password here; it's used only for UI confirmation.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert(error?.message || "Failed to update password");
    }
  };

  const saveNotifications = () => {
    console.log("Save Notifications:", { notifyEmail, notifyWhatsapp, notifyInApp });
  };

  const savePreferences = () => {
    console.log("Save Preferences:", { theme, currency, defaultLocation });
  };

  const logoutAllDevices = () => {
    console.log("Logout all devices");
  };

  const deleteAccount = () => {
    const ok = confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (!ok) return;
    console.log("Delete account confirmed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your profile, security, and preferences.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  {String(fullName || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{fullName || "User"}</p>
                  <p className="text-xs text-slate-600 truncate">{email}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={[
                      "w-full text-left px-4 py-3 rounded-xl font-semibold transition",
                      tab === t.key
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    ].join(" ")}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8">
            {/* Account */}
            {tab === "account" && (
              <SectionCard title="Account" subtitle="Update your profile information.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Your name"
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+91..."
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="you@example.com"
                    />
                  </Field>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveAccount}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm"
                    type="button"
                  >
                    Save Changes
                  </button>
                </div>
              </SectionCard>
            )}

            {/* Security */}
            {tab === "security" && (
              <SectionCard title="Security" subtitle="Manage your password and protection settings.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Current Password">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="••••••••"
                    />
                  </Field>

                  <Field label="New Password">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="••••••••"
                    />
                  </Field>

                  <Field label="Confirm New Password">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="••••••••"
                    />
                  </Field>
                </div>

                <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Toggle checked={twoFA} onChange={setTwoFA} />
                    <div>
                      <p className="font-semibold text-slate-900">Two-factor authentication</p>
                      <p className="text-sm text-slate-600">Add extra security for your account.</p>
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm"
                    type="button"
                  >
                    Update Password
                  </button>
                </div>

                <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="font-semibold text-slate-900">Session Control</p>
                  <p className="text-sm text-slate-600 mt-1">
                    If you suspect unauthorized access, log out from all devices.
                  </p>
                  <button
                    onClick={logoutAllDevices}
                    className="mt-3 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-semibold"
                    type="button"
                  >
                    Logout all devices
                  </button>
                </div>
              </SectionCard>
            )}

            {/* Notifications */}
            {tab === "notifications" && (
              <SectionCard title="Notifications" subtitle="Choose how you want to receive updates.">
                <div className="space-y-4">
                  <ToggleRow
                    title="Email notifications"
                    desc="Get updates about your BOQ, invoices, and plan changes."
                    checked={notifyEmail}
                    onChange={setNotifyEmail}
                  />
                  <ToggleRow
                    title="WhatsApp notifications"
                    desc="Receive quick alerts on WhatsApp (requires number verification)."
                    checked={notifyWhatsapp}
                    onChange={setNotifyWhatsapp}
                  />
                  <ToggleRow
                    title="In-app notifications"
                    desc="Show notifications inside the dashboard."
                    checked={notifyInApp}
                    onChange={setNotifyInApp}
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveNotifications}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm"
                    type="button"
                  >
                    Save Notifications
                  </button>
                </div>
              </SectionCard>
            )}

            {/* Preferences */}
            {tab === "preferences" && (
              <SectionCard title="Preferences" subtitle="Personalize your experience.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Theme">
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </Field>

                  <Field label="Currency">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </Field>

                  <Field label="Default Location">
                    <input
                      value={defaultLocation}
                      onChange={(e) => setDefaultLocation(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Wadala"
                    />
                  </Field>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={savePreferences}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm"
                    type="button"
                  >
                    Save Preferences
                  </button>
                </div>
              </SectionCard>
            )}

            {/* Danger Zone */}
            {tab === "danger" && (
              <SectionCard title="Danger Zone" subtitle="Be careful. These actions are irreversible.">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="font-semibold text-red-700">Delete account</p>
                  <p className="text-sm text-red-700/80 mt-1">
                    This will permanently delete your data, conversations, and invoices.
                  </p>
                  <button
                    onClick={deleteAccount}
                    className="mt-4 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                    type="button"
                  >
                    Delete Account
                  </button>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ UI Helpers ------------------ */

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500",
        checked ? "bg-orange-500" : "bg-slate-300",
      ].join(" ")}
      aria-label="toggle"
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-5" : "",
        ].join(" ")}
      />
    </button>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600 mt-1">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
