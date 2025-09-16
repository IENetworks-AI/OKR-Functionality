import { useState } from "react";
import { 
  Target, 
  Plus,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreatePlanModal } from "./CreatePlanModal";
import { ReportingDashboard } from "./ReportingDashboard";

// --- Data Structures (unchanged) ---
interface KeyResult {
  id: string;
  title: string;
  owner: Employee;
  objective: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  target: number;
  achieved: number;
  krProgress: number;
  priority: "High" | "Medium" | "Low";
  weight: number;
}

interface Plan {
  id:string;
  keyResultId: string;
  date: string;
  status: "Active" | "Closed" | "Pending";
  tasks: Task[];
}

// --- Sample Data (unchanged) ---
const employees: Employee[] = [
  { id: "1", name: "Mikias A.", role: "AI and Data Science" },
  { id: "2", name: "Sarah Chen", role: "Machine Learning Engineer" },
];

const keyResults: KeyResult[] = [
  { 
    id: "kr-1", 
    title: "Finalize 100% data readiness for model integration", 
    owner: employees[0], 
    objective: "Launch New AI Feature" 
  },
  { 
    id: "kr-2", 
    title: "Complete 100% of data ingestion and processing setup for 2 new features", 
    owner: employees[0], 
    objective: "Enhance Data Platform" 
  },
  {
    id: "kr-3",
    title: "Deploy new ML model to production with 95% accuracy",
    owner: employees[1],
    objective: "Improve Prediction Engine"
  }
];

const samplePlans: Record<string, Plan[]> = {
  Daily: [
    {
      id: "daily-1",
      keyResultId: "kr-1",
      date: "September 15 2025, 7:40:36 AM",
      status: "Closed",
      tasks: [
        {
          id: "task-1",
          title: "Collaborate with AI/ML Engineer and validate data schema",
          description: "Data Validation & Alignment with AI/ML Engineer",
          target: 100,
          achieved: 100,
          krProgress: 100,
          priority: "Medium",
          weight: 50.000,
        },
        {
          id: "task-2", 
          title: "Perform final exploratory data analysis (EDA)",
          description: "Data Ingestion Setup",
          target: 100,
          achieved: 80,
          krProgress: 80,
          priority: "High",
          weight: 50.000,
        }
      ]
    }
  ],
  Weekly: [],
};

export function PlanningDashboard() {
  const [mode, setMode] = useState<"Planning" | "Reporting">("Planning");
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [selectedKeyResultId, setSelectedKeyResultId] = useState<string>(keyResults[0]?.id || "");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const plansForSelectedKR = samplePlans[activeTab]?.filter(
    (plan) => plan.keyResultId === selectedKeyResultId
  ) || [];
  
  const selectedKR = keyResults.find(kr => kr.id === selectedKeyResultId);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Planning and Reporting</h1>
            <p className="text-sm text-muted-foreground">OKR Settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === "Planning" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("Planning")}
            >
              Planning
            </Button>
            <Button
              variant={mode === "Reporting" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("Reporting")}
            >
              Reporting
            </Button>
          </div>
        </div>

        {mode === "Planning" ? (
          // CHANGED: Removed `p-6` from this container to make it full-width.
          // Added `overflow-y-auto` for better scrolling behavior.
          <div className="flex-1 flex flex-col overflow-y-auto"> 
            {/* Tab Section & Create Button */}
            {/* CHANGED: Added padding (`px-6`, `pt-6`) to this section */}
            <div className="flex items-center justify-between mb-6 px-6 pt-6 border-b">
              <div className="flex gap-8">
                {(["Daily", "Weekly"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    // CHANGED: Adjusted styles to work with the border on the parent
                    className={`pb-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab
                        ? "text-blue-600"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 text-muted-foreground border-dashed"
              >
                <Plus className="w-4 h-4" />
                Create {activeTab} Plan
              </Button>
            </div>

            <CreatePlanModal
              open={showCreateForm}
              onClose={() => setShowCreateForm(false)}
              planType={activeTab}
              keyResults={keyResults}
            />

            {/* Key Result Selection */}
            {/* CHANGED: Added padding (`px-6`, `pt-6`) to this section */}
            <div className="px-6 pt-6 mb-6">
               <label className="text-sm font-medium text-muted-foreground mb-2 block">Select Key Result</label>
              <Select value={selectedKeyResultId} onValueChange={setSelectedKeyResultId}>
                <SelectTrigger className="w-full md:w-1/2 lg:w-1/3 bg-card">
                  <SelectValue placeholder="Select a Key Result" />
                </SelectTrigger>
                <SelectContent>
                  {keyResults.map((kr) => (
                    <SelectItem key={kr.id} value={kr.id}>
                      {kr.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* CHANGED: Added a wrapper with padding for the main content area */}
            <div className="px-6 pb-6">
              {/* Plans Display */}
              {plansForSelectedKR.length > 0 ? (
                plansForSelectedKR.map((plan) => (
                  <div key={plan.id}>
                    {/* Plan Info Card */}
                    <div className="flex items-center justify-between mb-6 p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{selectedKR?.owner.name}</h3>
                          <p className="text-xs text-muted-foreground">{selectedKR?.owner.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${plan.status === 'Closed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <span className="text-sm font-medium">{plan.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.date}</p>
                      </div>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-4">
                      {plan.tasks.map(task => (
                        <div key={task.id} className="bg-card border border-border rounded-lg p-4">
                          <h3 className="font-medium text-sm mb-3">{task.title}</h3>
                          <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm text-muted-foreground mb-3">⚙️ {task.description}</p>
                               <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                  <span className="text-xs text-muted-foreground">Target: <Badge variant="secondary">{task.target}</Badge></span>
                                  <span className="text-xs text-muted-foreground">Achieved: <Badge variant="secondary">{task.achieved}</Badge></span>
                                  <span className="text-xs text-muted-foreground">Progress: <span className="font-medium text-green-600">{task.krProgress.toFixed(2)}%</span></span>
                                  <Badge className={
                                      task.priority === "High" ? "bg-red-100 text-red-700" :
                                      task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                                  }>{task.priority}</Badge>
                                  <span className="text-xs text-muted-foreground">Weight: <Badge variant="outline">{task.weight.toFixed(3)}</Badge></span>
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                  <div className="text-center py-10 bg-card border-dashed border-2 rounded-lg">
                      <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">No Plans Found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">No {activeTab.toLowerCase()} plans exist for this Key Result.</p>
                      <div className="mt-6">
                          <Button size="sm" onClick={() => setShowCreateForm(true)}>
                              <Plus className="-ml-1 mr-2 h-5 w-5" />
                              Create New Plan
                          </Button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <ReportingDashboard />
          </div>
        )}
      </div>
    </div>
  );
}