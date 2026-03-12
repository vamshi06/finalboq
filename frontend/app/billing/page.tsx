"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

type BillingCycle = "monthly" | "yearly";
type PlanName = "Free" | "Pro" | "Enterprise";

type Plan = {
  name: PlanName;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  current?: boolean;
};

type Invoice = {
  id: string;
  date: string; // ISO string
  plan: PlanName;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
  downloadUrl?: string;
};

type PaymentMethod = {
  id: string;
  brand: "Visa" | "Mastercard" | "RuPay" | "UPI" | "NetBanking" | "Card";
  last4?: string;
  label: string;
  isDefault?: boolean;
};

export default function BillingAndPaymentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // ✅ Hooks at top level
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanName>("Pro");

  // Tabs: Overview / Payment Methods / Invoices
  const [tab, setTab] = useState<"overview" | "methods" | "invoices">("overview");

  // Example UI state (replace with API calls later)
  const [autoRenew, setAutoRenew] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ✅ Orange-only selected styles
  const SELECTED_RING = "ring-2 ring-orange-500";
  const SELECTED_BG = "bg-orange-50";
  const SELECTED_BORDER = "border-orange-200";
  const SELECTED_BADGE = "bg-orange-500";

  const plans: Plan[] = useMemo(
    () => [
      {
        name: "Free",
        description: "Perfect for trying out",
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: ["5 BOQ generations per month", "Basic AI suggestions", "PDF export", "Email support"],
        current: true, // example current (locked)
      },
      {
        name: "Pro",
        description: "Best for professionals",
        monthlyPrice: 999,
        yearlyPrice: 9990,
        features: [
          "Unlimited BOQ generations",
          "Advanced AI suggestions",
          "PDF & Excel export",
          "Priority support",
          "Custom branding",
          "Advanced analytics",
        ],
        popular: true,
      },
      {
        name: "Enterprise",
        description: "For large teams",
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        features: [
          "Everything in Pro",
          "Multi-user collaboration",
          "API access",
          "Dedicated account manager",
          "Custom integrations",
          "SLA guarantee",
        ],
      },
    ],
    []
  );

  // Example payment methods (replace from backend)
  const paymentMethods: PaymentMethod[] = useMemo(
    () => [
      { id: "pm_1", brand: "UPI", label: "UPI • abhi@upi", isDefault: true },
      { id: "pm_2", brand: "Visa", last4: "4242", label: "Visa •••• 4242" },
    ],
    []
  );

  // Example invoices (replace from backend)
  const invoices: Invoice[] = useMemo(
    () => [
      { id: "inv_1001", date: "2026-01-15", plan: "Pro", amount: 999, status: "Paid" },
      { id: "inv_1002", date: "2025-12-15", plan: "Pro", amount: 999, status: "Paid" },
      { id: "inv_1003", date: "2025-11-15", plan: "Free", amount: 0, status: "Paid" },
    ],
    []
  );

  // ✅ Redirect in effect
  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  // ✅ Prevent selecting current plan (locked). Also ensure selectedPlan never equals current.
  useEffect(() => {
    const currentName = plans.find((p) => p.current)?.name;
    if (currentName && selectedPlan === currentName) setSelectedPlan("Pro");
  }, [plans, selectedPlan]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  const currentPlan = plans.find((p) => p.current)?.name ?? "Free";

  const onSelectPlan = (plan: Plan) => {
    if (plan.current) return; // ❌ cannot select current plan
    setSelectedPlan(plan.name);
    setTab("overview");
  };

  const onUpgrade = (plan: Plan) => {
    console.log("Checkout for:", plan.name, "Billing:", billingCycle);
    // TODO: call backend checkout endpoint (Razorpay/Stripe)
  };

  const onSetDefaultMethod = (id: string) => {
    console.log("Set default payment method:", id);
    // TODO: call backend
  };

  const onRemoveMethod = (id: string) => {
    console.log("Remove payment method:", id);
    // TODO: call backend
  };

  const onDownloadInvoice = (inv: Invoice) => {
    console.log("Download invoice:", inv.id);
    // TODO: backend invoice download url
  };

  const priceForPlan = (plan: Plan) => (billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Billing & Payments</h1>
          <p className="text-slate-600 mt-2">
            Manage subscription, billing cycle, payment methods, and invoices.
          </p>
        </div>

        {/* Top summary cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <p className="text-sm text-slate-500">Current Plan</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-bold text-slate-900">{currentPlan}</p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">
                Active
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Billing: <span className="font-semibold">{billingCycle === "monthly" ? "Monthly" : "Yearly"}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <p className="text-sm text-slate-500">Auto-Renewal</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-bold text-slate-900">{autoRenew ? "On" : "Off"}</p>
              <button
                onClick={() => setAutoRenew((v) => !v)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  autoRenew ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"
                }`}
              >
                Toggle
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              You can change this anytime.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <p className="text-sm text-slate-500">Next Payment</p>
            <div className="mt-2">
              <p className="text-2xl font-bold text-slate-900">
                ₹{billingCycle === "monthly" ? "999" : "9990"}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Due on <span className="font-semibold">Feb 15, 2026</span> (example)
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="flex flex-wrap gap-2 p-4 border-b border-slate-100">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} label="Overview" />
            <TabButton active={tab === "methods"} onClick={() => setTab("methods")} label="Payment Methods" />
            <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")} label="Invoices" />
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="p-6">
              {/* Billing Toggle */}
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Subscription</h2>
                  <p className="text-sm text-slate-600">Select a plan and choose billing cycle.</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"}`}>
                    Monthly
                  </span>

                  <button
                    onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                    className="relative w-14 h-7 bg-slate-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="Toggle billing cycle"
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        billingCycle === "yearly" ? "translate-x-7" : ""
                      }`}
                    />
                  </button>

                  <span className={`text-sm font-medium ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-500"}`}>
                    Yearly
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Save 17%
                    </span>
                  </span>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isCurrent = !!plan.current;
                  const isSelected = selectedPlan === plan.name;

                  const selectedClasses =
                    isSelected && !isCurrent ? `${SELECTED_RING} ${SELECTED_BG} ${SELECTED_BORDER}` : "";

                  return (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => onSelectPlan(plan)}
                      disabled={isCurrent}
                      className={[
                        "text-left relative bg-white rounded-2xl shadow-md overflow-hidden transition-all border",
                        "focus:outline-none focus:ring-2 focus:ring-orange-500",
                        isCurrent ? "opacity-80 cursor-not-allowed border-slate-200" : "hover:shadow-lg border-transparent",
                        selectedClasses,
                        plan.popular ? "md:scale-[1.02]" : "",
                      ].join(" ")}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                          MOST POPULAR
                        </div>
                      )}

                      {/* {isSelected && !isCurrent && (
                        <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full ${SELECTED_BADGE} text-white shadow`}>
                          Selected
                        </div>
                      )} */}

                      {isCurrent && (
                        <div className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full bg-slate-900 text-white shadow">
                          Current
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                        <p className="text-slate-600 mb-4">{plan.description}</p>

                        <div className="mb-4">
                          <div className="flex items-baseline">
                            <span className="text-3xl font-bold text-slate-900">₹{priceForPlan(plan)}</span>
                            <span className="text-slate-600 ml-2">
                              /{billingCycle === "monthly" ? "month" : "year"}
                            </span>
                          </div>
                          {billingCycle === "yearly" && plan.yearlyPrice > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              Save ₹{plan.monthlyPrice * 12 - plan.yearlyPrice} per year
                            </p>
                          )}
                        </div>

                        <ul className="space-y-2 mb-5">
                          {plan.features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckIcon />
                              <span className="text-sm text-slate-700">{f}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrent ? (
                          <button
                            type="button"
                            disabled
                            className="w-full px-4 py-2 bg-slate-200 text-slate-600 font-semibold rounded-lg cursor-not-allowed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Current Plan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpgrade(plan);
                            }}
                            className={[
                              "w-full px-4 py-2 font-semibold rounded-lg shadow-sm transition-all",
                              isSelected ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white",
                            ].join(" ")}
                          >
                            Continue
                          </button>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {tab === "methods" && (
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Payment Methods</h2>
                  <p className="text-sm text-slate-600">Manage your saved payment methods.</p>
                </div>

                <button
                  onClick={() => console.log("Add payment method")}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm"
                >
                  Add Method
                </button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{pm.label}</p>
                      <p className="text-xs text-slate-600">
                        {pm.isDefault ? "Default" : "Not default"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!pm.isDefault && (
                        <button
                          onClick={() => onSetDefaultMethod(pm.id)}
                          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-semibold text-sm"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveMethod(pm.id)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-white border border-slate-100 rounded-xl p-4">
                <p className="font-semibold text-slate-900 mb-1">Secure payments</p>
                <p className="text-sm text-slate-600">
                  We use secure payment gateways. Your card details are never stored directly on our servers.
                </p>
              </div>
            </div>
          )}

          {/* Invoices */}
          {tab === "invoices" && (
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Invoices</h2>
                  <p className="text-sm text-slate-600">Download past invoices and receipts.</p>
                </div>

                <button
                  onClick={() => console.log("Export invoices")}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  Export
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="min-w-full bg-white">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">Invoice</th>
                      <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">Date</th>
                      <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">Plan</th>
                      <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">Amount</th>
                      <th className="text-left text-sm font-semibold text-slate-700 px-4 py-3">Status</th>
                      <th className="text-right text-sm font-semibold text-slate-700 px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-900 font-semibold">{inv.id}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatDate(inv.date)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{inv.plan}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">₹{inv.amount}</td>
                        <td className="px-4 py-3 text-sm">
                          <StatusPill status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onDownloadInvoice(inv)}
                            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-semibold text-sm"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-sm text-slate-600" colSpan={6}>
                          No invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                >
                  Cancel Subscription
                </button>
                <p className="text-sm text-slate-600">
                  Need help? Contact support for billing issues.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900">Cancel Subscription?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Your access will continue until the end of your billing period. You can re-subscribe anytime.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  console.log("Cancel subscription confirmed");
                  setShowCancelModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Small UI Helpers ---------- */

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-lg font-semibold text-sm transition",
        active ? "bg-orange-500 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      ].join(" ")}
      type="button"
    >
      {label}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StatusPill({ status }: { status: "Paid" | "Pending" | "Failed" }) {
  const cls =
    status === "Paid"
      ? "bg-green-100 text-green-700"
      : status === "Pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

function formatDate(iso: string) {
  // Simple format: YYYY-MM-DD -> DD Mon YYYY
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
