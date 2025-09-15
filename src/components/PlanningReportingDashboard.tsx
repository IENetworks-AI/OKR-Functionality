import { useState } from "react";

interface Plan {
  title: string;
  progress: number;
  priority: "High" | "Medium" | "Low";
}

const plans: Record<"Daily" | "Weekly" | "Monthly", Plan[]> = {
  Daily: [
    { title: "Validate ingested data with AI/ML pipeline", progress: 70, priority: "High" },
    { title: "Align AI team on OKR metrics", progress: 45, priority: "Medium" },
    { title: "Optimize ETL job performance", progress: 20, priority: "Low" },
  ],
  Weekly: [
    { title: "Complete feature-level data readiness", progress: 50, priority: "High" },
    { title: "Finalize model training environment setup", progress: 30, priority: "Medium" },
    { title: "Draft report on current AI experiments", progress: 60, priority: "Medium" },
  ],
  Monthly: [
    { title: "Deliver integrated AI-powered reporting dashboard", progress: 40, priority: "High" },
    { title: "Deploy first recommender system MVP", progress: 25, priority: "High" },
    { title: "Prepare company-wide AI adoption roadmap", progress: 10, priority: "Low" },
  ],
};

export function PlanningReportingDashboard() {
  const [mode, setMode] = useState<"Planning" | "Reporting">("Planning");
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planning and Reporting</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "Planning"
              ? `AI-powered recommendations for your ${activeTab} plan`
              : "Reporting insights based on your OKRs"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("Planning")}
            className={`px-4 py-1 rounded border ${
              mode === "Planning" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Planning
          </button>
          <button
            onClick={() => setMode("Reporting")}
            className={`px-4 py-1 rounded border ${
              mode === "Reporting" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Reporting
          </button>
        </div>
      </div>

      {mode === "Planning" ? (
        <>
          {/* Tabs */}
          <div className="border-b border-border px-6 py-2 flex gap-6">
            {(["Daily", "Weekly", "Monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Plans */}
          <div className="p-6 grid grid-cols-3 gap-6">
            {plans[activeTab].map((plan, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <h2 className="font-medium text-sm">{plan.title}</h2>
                <div className="mt-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded ${
                      plan.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : plan.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {plan.priority} Priority
                  </span>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-primary"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.progress}% complete</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Reporting Insights</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>✅ 70% of Daily AI/ML validation tasks completed</li>
            <li>📊 Weekly model training setup is 30% done</li>
            <li>🚀 Monthly recommender system MVP is progressing (25%)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
