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
  current?: boolean; // user's current plan (locked / non-selectable)
};

export default function SubscriptionPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // ✅ Hooks at top level
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  // ✅ Default selected = Pro (as requested)
  const [selectedPlan, setSelectedPlan] = useState<PlanName>("Pro");

  // ✅ Orange-only selected styles (no purple)
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
        features: [
          "5 BOQ generations per month",
          "Basic AI suggestions",
          "PDF export",
          "Email support",
        ],
        current: true, // Example current plan (user cannot select this)
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

  // ✅ Redirect should be in useEffect
  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  // ✅ If selected plan is current (locked), auto move selection to Pro
  // This prevents "current plan selected" state if your backend marks Pro as current later.
  useEffect(() => {
    const currentName = plans.find((p) => p.current)?.name;
    if (currentName && selectedPlan === currentName) {
      setSelectedPlan("Pro");
    }
  }, [plans, selectedPlan]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  const onSelectPlan = (plan: Plan) => {
    // ❌ user cannot select the current plan
    if (plan.current) return;
    setSelectedPlan(plan.name);
  };

  const onUpgrade = (plan: Plan) => {
    console.log("Upgrade to:", plan.name, "Billing:", billingCycle);
    // TODO: call backend checkout endpoint
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upgrade to unlock unlimited BOQ generations and premium features
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span
              className={`text-sm font-medium ${
                billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Monthly
            </span>

            <button
              onClick={() =>
                setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
              }
              className="relative w-14 h-7 bg-slate-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Toggle billing cycle"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  billingCycle === "yearly" ? "translate-x-7" : ""
                }`}
              />
            </button>

            <span
              className={`text-sm font-medium ${
                billingCycle === "yearly" ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isCurrent = !!plan.current;
            const isSelected = selectedPlan === plan.name;

            // ✅ Highlight only if selected AND not current (current cannot be selected)
            const selectedClasses =
              isSelected && !isCurrent
                ? `${SELECTED_RING} ${SELECTED_BG} ${SELECTED_BORDER}`
                : "";

            return (
              <button
                key={plan.name}
                type="button"
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrent} // ✅ cannot click/select current plan
                className={[
                  "text-left relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all border",
                  "focus:outline-none focus:ring-2 focus:ring-orange-500",
                  isCurrent
                    ? "opacity-80 cursor-not-allowed border-slate-200"
                    : "hover:shadow-xl border-transparent",
                  selectedClasses,
                  plan.popular ? "md:scale-105" : "",
                ].join(" ")}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                {/* Selected badge */}
                {isSelected && !isCurrent && (
                  <div
                    className={`absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full ${SELECTED_BADGE} text-white shadow`}
                  >
                    Selected
                  </div>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <div className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold rounded-full bg-slate-900 text-white shadow">
                    Current
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-slate-900">
                        ₹{billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                      </span>
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

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full px-6 py-3 bg-slate-200 text-slate-600 font-semibold rounded-lg cursor-not-allowed"
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
                        "w-full px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all",
                        isSelected
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white",
                      ].join(" ")}
                    >
                      Upgrade Now
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Plan Summary */}
        <div className="mt-4 text-center text-sm text-slate-600">
          Selected Plan:{" "}
          <span className="font-semibold text-slate-900">{selectedPlan}</span>{" "}
          ({billingCycle === "monthly" ? "Monthly" : "Yearly"})
        </div>
      </div>
    </div>
  );
}
