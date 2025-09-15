import { useState } from "react";
import { 
  LayoutDashboard, 
  Settings,
  Target, 
  BookOpen, 
  DollarSign, 
  Clock, 
  ChevronLeft, 
  Plus,
  User,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreatePlanModal } from "./CreatePlanModal";
import { ReportingDashboard } from "./ReportingDashboard";

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
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
  targetValue: number;
}

interface Plan {
  id: string;
  employee: Employee;
  date: string;
  status: "Active" | "Closed" | "Pending";
  tasks: Task[];
}

const employees: Employee[] = [
  { id: "1", name: "Mikias A.", role: "AI and Data Science" },
  { id: "2", name: "Sarah Chen", role: "Machine Learning Engineer" },
  { id: "3", name: "David Kumar", role: "Data Engineer" },
];

const samplePlans: Record<string, Plan[]> = {
  Daily: [
    {
      id: "daily-1",
      employee: employees[0],
      date: "September 15 2025, 7:40:36 AM",
      status: "Closed",
      tasks: [
        {
          id: "task-1",
          title: "Collaborate with AI/ML Engineer and finalize 100% data readiness for model integration",
          description: "Data Validation & Alignment with AI/ML Engineer",
          target: 100,
          achieved: 65,
          krProgress: 65,
          priority: "Medium",
          weight: 20.000,
          targetValue: 0
        },
        {
          id: "task-2", 
          title: "Complete 100% of data ingestion and processing setup for 2 features",
          description: "Data Ingestion Setup",
          target: 100,
          achieved: 30,
          krProgress: 30,
          priority: "High",
          weight: 80.000,
          targetValue: 0
        }
      ]
    }
  ],
  Weekly: [
    {
      id: "weekly-1",
      employee: employees[1],
      date: "September 9-15 2025",
      status: "Active",
      tasks: [
        {
          id: "task-3",
          title: "Deploy ML model to production environment",
          description: "Model Deployment Pipeline",
          target: 100,
          achieved: 85,
          krProgress: 85,
          priority: "High",
          weight: 50.000,
          targetValue: 1
        }
      ]
    }
  ],
  Monthly: [
    {
      id: "monthly-1",
      employee: employees[2],
      date: "September 2025",
      status: "Pending",
      tasks: [
        {
          id: "task-4",
          title: "Complete ETL pipeline optimization for quarterly review",
          description: "Performance Enhancement",
          target: 100,
          achieved: 40,
          krProgress: 40,
          priority: "Medium",
          weight: 75.000,
          targetValue: 2
        }
      ]
    }
  ]
};

const aiSuggestions = {
  Daily: [
    "Focus on data validation automation to improve efficiency",
    "Schedule regular sync meetings with ML engineering team",
    "Prioritize pipeline testing before model integration"
  ],
  Weekly: [
    "Consider implementing A/B testing framework for model performance",
    "Set up monitoring dashboards for production models",
    "Plan knowledge sharing session on recent ML breakthroughs"
  ],
  Monthly: [
    "Evaluate new data sources for model enhancement",
    "Conduct comprehensive review of ML infrastructure",
    "Plan strategic roadmap for next quarter's AI initiatives"
  ]
};

export function PlanningDashboard() {
  const [mode, setMode] = useState<"Planning" | "Reporting">("Planning");
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const currentPlans = samplePlans[activeTab] || [];
  const currentSuggestions = aiSuggestions[activeTab] || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Closed": return "bg-green-500";
      case "Active": return "bg-blue-500";
      case "Pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

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
          <div className="flex-1 flex flex-col">
            {/* Tab Section */}
            <div className="px-6 py-6 flex items-center justify-between">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab("Daily")}
                  className={`pb-2 text-sm font-medium transition-colors relative ${
                    activeTab === "Daily"
                      ? "text-blue-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Daily
                  {activeTab === "Daily" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("Weekly")}
                  className={`pb-2 text-sm font-medium transition-colors relative ${
                    activeTab === "Weekly"
                      ? "text-blue-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Weekly
                  {activeTab === "Weekly" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
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
              employees={employees}
            />

            {/* Employee Selection */}
            <div className="px-6 pb-6">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-64 bg-card">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Today's Plan */}
            <div className="px-6 pb-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Today's Plan</h2>
              
              {/* Employee Info Card */}
              <div className="flex items-center justify-between mb-6 p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Mikias A.</h3>
                    <p className="text-xs text-muted-foreground">AI and Data Science</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Closed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">September 15 2025, 7:40:36 AM</p>
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-6">
                {/* Task 1 */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-3">Collaborate with AI/ML Engineer and finalize 100% data readiness for model integration</h3>
                      
                      <div className="bg-gray-50 p-3 rounded mb-4">
                        <p className="text-sm text-muted-foreground mb-3">⚙️ Data Validation & Alignment with AI/ML Engineer</p>
                        <p className="text-xs text-muted-foreground mb-3">OKR functionality overview with AI team</p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">●</span>
                            <span className="text-xs text-muted-foreground">Target</span>
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">100</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">●</span>
                            <span className="text-xs text-muted-foreground">Achieved</span>
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">65</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">●</span>
                            <span className="text-xs text-muted-foreground">KR Progress</span>
                            <span className="text-xs font-medium text-green-600">65.00%</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-6">
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1">Medium</Badge>
                          <span className="text-xs text-muted-foreground">
                            Weight <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">20.000</Badge>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Target <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">0</Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task 2 */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-3">Complete 100% of data ingestion and processing setup for 2 features</h3>
                      
                      <div className="bg-gray-50 p-3 rounded mb-4">
                        <p className="text-sm text-muted-foreground mb-3">⚙️ Data Ingestion Setup</p>
                        <p className="text-xs text-muted-foreground mb-3">Data Ingestion Setup</p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">●</span>
                            <span className="text-xs text-muted-foreground">Target</span>
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">100</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">●</span>
                            <span className="text-xs text-muted-foreground">Achieved</span>
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">30</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">●</span>
                            <span className="text-xs text-muted-foreground">KR Progress</span>
                            <span className="text-xs font-medium text-green-600">30.00%</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-6">
                          <Badge className="bg-red-100 text-red-700 text-xs px-2 py-1">High</Badge>
                          <span className="text-xs text-muted-foreground">
                            Weight <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">80.000</Badge>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Target <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">0</Badge>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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