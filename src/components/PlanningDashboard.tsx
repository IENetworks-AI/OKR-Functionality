import { useState, useEffect } from "react";
import { Target, Plus, User, MoreVertical, Circle, CheckCircle, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreatePlanModal } from "./CreatePlanModal";
import { ReportingDashboard } from "./ReportingDashboard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Data Structures ---
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
  id: string;
  keyResultId: string;
  date: string;
  status: "Active" | "Closed" | "Pending" | "Open";
  tasks: Task[];
  achieved: number;
  progress: number;
}

// --- Sample Data ---
const employees: Employee[] = [
  { id: "1", name: "Mikias A.", role: "AI and Data Science" },
  { id: "2", name: "Sarah Chen", role: "Machine Learning Engineer" },
];

const keyResults: KeyResult[] = [
  {
    id: "kr-1",
    title: "Collaborate with AI/ML Engineer and finalize 100% data readiness for model integration",
    owner: employees[0],
    objective: "Launch New AI Feature",
  },
  {
    id: "kr-2",
    title:
      "Complete 100% of data ingestion and processing setup for 2 new features",
    owner: employees[0],
    objective: "Enhance Data Platform",
  },
  {
    id: "kr-3",
    title: "Deploy new ML model to production with 95% accuracy",
    owner: employees[1],
    objective: "Improve Prediction Engine",
  },
];

const initialPlans: Record<string, Plan[]> = {
  Daily: [
    {
      id: "daily-1",
      keyResultId: "kr-1",
      date: "September 15, 2025, 5:46 PM",
      status: "Closed",
      achieved: 45,
      progress: 45,
      tasks: [
        {
          id: "task-1",
          title: "Collaborate with AI/ML Engineer and validate data schema",
          description: "Data Validation & Alignment with AI/ML Engineer",
          target: 100,
          achieved: 100,
          krProgress: 100,
          priority: "Medium",
          weight: 50.0,
        },
        {
          id: "task-2",
          title: "Perform final exploratory data analysis (EDA)",
          description: "Data Ingestion Setup",
          target: 100,
          achieved: 80,
          krProgress: 80,
          priority: "High",
          weight: 50.0,
        },
      ],
    },
    {
      id: "daily-2",
      keyResultId: "kr-1",
      date: "September 16, 2025, 6:49 PM",
      status: "Open",
      achieved: 45,
      progress: 45,
      tasks: [
        {
          id: "task-3",
          title: "Data Validation & Alignment with AI/ML Engineer",
          description: "Test our functionality with sample RAG Api",
          target: 0,
          achieved: 0,
          krProgress: 0,
          priority: "High",
          weight: 100.0,
        },
      ],
    },
  ],
  Weekly: [
    {
      id: "weekly-1",
      keyResultId: "kr-1",
      date: "September 15, 2025, 5:46 PM",
      status: "Closed",
      achieved: 45,
      progress: 45,
      tasks: [
        {
          id: "task-4",
          title: "Weekly data validation and schema alignment",
          description: "Coordinate weekly syncs with ML team",
          target: 100,
          achieved: 45,
          krProgress: 45,
          priority: "High",
          weight: 100.0,
        },
      ],
    },
  ],
};

export function PlanningDashboard() {
  const [mode, setMode] = useState<"Planning" | "Reporting">("Planning");
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "">("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0].id);
  const [selectedKeyResultId, setSelectedKeyResultId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [plans, setPlans] = useState<Record<string, Plan[]>>(initialPlans);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const employeeKRs = keyResults.filter((kr) => kr.owner.id === selectedEmployeeId);

  useEffect(() => {
    setSelectedKeyResultId(employeeKRs[0]?.id || "");
  }, [selectedEmployeeId]);

  const plansForSelectedEmployee = plans[activeTab]?.filter(
    (plan) => keyResults.find((kr) => kr.id === plan.keyResultId)?.owner.id === selectedEmployeeId
  ) || [];

  const handleCreatePlan = (planType: "Daily" | "Weekly", keyResultId: string, tasks: Task[]) => {
    const newPlan: Plan = {
      id: crypto.randomUUID(),
      keyResultId,
      date: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
      status: "Open",
      tasks: tasks.map((t) => ({ ...t, achieved: 0, krProgress: 0 })),
      achieved: 0,
      progress: 0,
    };

    setPlans((prev) => ({
      ...prev,
      [planType]: [...(prev[planType] || []), newPlan],
    }));
    setShowCreateForm(false);
  };

  const handleUpdatePlan = (planId: string, updatedPlan: Plan) => {
    setPlans((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((p) => (p.id === planId ? updatedPlan : p)),
    }));
    setEditingPlanId(null);
  };

  const handleUpdateTask = (planId: string, taskId: string, field: keyof Task, value: any) => {
    setPlans((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              tasks: plan.tasks.map((task) =>
                task.id === taskId ? { ...task, [field]: value } : task
              ),
            }
          : plan
      ),
    }));
  };

  const handleSaveTask = () => {
    setEditingTaskId(null);
  };

  return (
    <div className="flex h-full w-full bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Planning and Reporting
            </h1>
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
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {/* Tab Section & Create Button */}
            <div className="flex items-center justify-between mb-6 px-6 pt-6 border-b">
              <div className="flex gap-8">
                {(["Daily", "Weekly"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab
                        ? "text-blue-600"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600 block" />
                    )}
                  </button>
                ))}
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 text-muted-foreground border-dashed"
                  disabled={!activeTab}
                >
                  <Plus className="w-4 h-4" />
                  Create {activeTab || ""} Plan
                </Button>
              </div>
            </div>

            <CreatePlanModal
              open={showCreateForm}
              onClose={() => setShowCreateForm(false)}
              onSave={handleCreatePlan}
              planType={activeTab}
              keyResults={employeeKRs}
              weeklyPlans={plans.Weekly || []}
            />

            {/* Instruction when not selected */}
            {!activeTab || !selectedEmployeeId ? (
              <div className="px-6 pt-10 pb-16 text-center text-muted-foreground">
                <p>
                  Select Daily or Weekly, then choose an Employee to view
                  planning details.
                </p>
              </div>
            ) : null}

            {/* Main content area */}
            {activeTab && selectedEmployeeId && (
              <div className="px-6 pb-6">
                {/* Plans Display */}
                {plansForSelectedEmployee.length > 0 ? (
                  plansForSelectedEmployee.map((plan) => {
                    const KR = keyResults.find((kr) => kr.id === plan.keyResultId);
                    const isEditingPlan = editingPlanId === plan.id;
                    return (
                      <div key={plan.id} className="mb-8">
                        {/* Plan Info Card */}
                        <div className="p-4 bg-card border border-border rounded-lg mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                              <div>
                                <h3 className="font-medium text-sm">
                                  {KR?.owner.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {KR?.owner.role}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                {plan.status === "Closed" ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="text-sm font-medium">
                                  {plan.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {plan.date}
                              </p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingPlanId(plan.id)}>Edit Plan</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge className="bg-blue-100 text-blue-800">Target 100</Badge>
                            <Badge className="bg-purple-100 text-purple-800">Achieved {plan.achieved}</Badge>
                            <Badge className="bg-green-100 text-green-800">KR Progress {plan.progress.toFixed(2)}%</Badge>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            <p className="text-sm font-medium">{KR?.title}</p>
                          </div>
                          {isEditingPlan && (
                            <div className="mt-4 flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setEditingPlanId(null)}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleUpdatePlan(plan.id, plan)}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Plan
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Task Cards */}
                        <div className="space-y-4">
                          {plan.tasks.map((task) => {
                            const isEditingTask = editingTaskId === task.id;
                            return (
                              <div
                                key={task.id}
                                className="bg-card border border-border rounded-lg p-4"
                              >
                                {isEditingTask ? (
                                  <div>
                                    <Input
                                      value={task.title}
                                      onChange={(e) => handleUpdateTask(plan.id, task.id, 'title', e.target.value)}
                                      className="mb-2"
                                    />
                                    <Textarea
                                      value={task.description || ""}
                                      onChange={(e) => handleUpdateTask(plan.id, task.id, 'description', e.target.value)}
                                      className="mb-2"
                                    />
                                    <Select
                                      value={task.priority}
                                      onValueChange={(value) => handleUpdateTask(plan.id, task.id, 'priority', value)}
                                    >
                                      <SelectTrigger className="mb-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      value={task.target}
                                      onChange={(e) => handleUpdateTask(plan.id, task.id, 'target', parseInt(e.target.value))}
                                      placeholder="Target"
                                      className="mb-2"
                                    />
                                    <Input
                                      type="number"
                                      value={task.weight}
                                      onChange={(e) => handleUpdateTask(plan.id, task.id, 'weight', parseFloat(e.target.value))}
                                      placeholder="Weight"
                                      className="mb-2"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" size="sm" onClick={() => setEditingTaskId(null)}>
                                        Cancel
                                      </Button>
                                      <Button size="sm" onClick={handleSaveTask}>
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <h3 className="font-medium text-sm mb-3">
                                      {task.title}
                                    </h3>
                                    <div className="bg-gray-50 p-3 rounded">
                                      <div className="flex items-start justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">
                                          {task.description}
                                        </p>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingTaskId(task.id)}>
                                              <Edit2 className="w-4 h-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <span className="text-xs text-muted-foreground">
                                          Target:{" "}
                                          <Badge variant="secondary">{task.target}</Badge>
                                        </span>
                                        <Badge
                                          className={
                                            task.priority === "High"
                                              ? "bg-red-100 text-red-700"
                                              : task.priority === "Medium"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-green-100 text-green-700"
                                          }
                                        >
                                          {task.priority}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Weight:{" "}
                                          <Badge variant="outline">
                                            {task.weight.toFixed(3)}
                                          </Badge>
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-6 text-sm text-muted-foreground">
                          0 Comments
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-card border-dashed border-2 rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">
                      No Plans Found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No {activeTab.toLowerCase()} plans exist for this Employee.
                    </p>
                    <div className="mt-6">
                      <Button size="sm" onClick={() => setShowCreateForm(true)}>
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Create New Plan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
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